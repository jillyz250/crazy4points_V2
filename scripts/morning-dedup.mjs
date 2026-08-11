#!/usr/bin/env node
/**
 * Semantic morning dedup — surfaces reworded duplicates the lexical checks miss.
 *
 * The lexical dedup (ingestItem Layer 2 + the snapshot's Jaccard flag) only
 * catches re-forwards that share wording. This runs an LLM pass that compares
 * each undecided fresh intel item against the last ~4 weeks of PUBLISHED alerts
 * to catch reworded dupes (e.g. "Marriott cards now offer 4 free nights or 150k"
 * vs a published "Marriott Bonvoy Credit Cards Offering Elevated Welcome Bonuses").
 *
 * SAFETY (learned 2026-08-11): a Haiku pass produced bad false positives
 * (matched "Southwest 50%" to "Wyndham 90%"; an IHG stay-bonus to an IHG
 * buy-points sale). So this is FLAG-ONLY by default — it reports candidate dupes
 * for a human yes/no and rejects NOTHING. Two precision guards:
 *   1. Sonnet (not Haiku) does the matching.
 *   2. Program-overlap guard: a match is dropped unless the fresh item's program
 *      also appears in the matched published alert (kills cross-program nonsense).
 * Pass --apply to actually reject the surviving matches (use only after eyeballing).
 *
 * Run: set -a; . ./.env.local; set +a; node scripts/morning-dedup.mjs        # flag only
 *      node scripts/morning-dedup.mjs --apply                                 # reject the matches
 * Runs BEFORE morning-snapshot.mjs in the daily ritual (see the daily-ritual skill).
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* env already exported */ }

const APPLY = process.argv.includes('--apply')
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const now = new Date()
const iso = (d) => new Date(now.getTime() - d * 864e5).toISOString()

// Fresh undecided intel + published alerts (with their programs, for the guard).
const { data: fresh } = await db.from('intel_items')
  .select('id, headline, programs, alert_type')
  .eq('processed', false).is('rejected_at', null).is('archived_at', null).is('triage_decision', null)
  .gte('created_at', iso(14)).order('created_at', { ascending: false }).limit(150)
if (!fresh?.length) { console.log('morning-dedup: no undecided fresh intel — nothing to do.'); process.exit(0) }

// Published alerts come from content_variants (title) joined to topics (programs).
const { data: pubRaw } = await db.from('content_variants')
  .select('title, topic_id, topics(programs)')
  .eq('format', 'alert').eq('status', 'published')
  .gte('created_at', iso(28)).order('created_at', { ascending: false }).limit(250)
const pub = (pubRaw || []).map((p) => ({ title: p.title, programs: p.topics?.programs || [] }))
if (!pub.length) { console.log('morning-dedup: no recent published alerts to compare — skipping.'); process.exit(0) }

const pubList = pub.map((p, i) => `P${i + 1}. ${p.title}`).join('\n')
const freshList = fresh.map((f, i) => `F${i + 1}. ${f.headline} [${(f.programs || []).join(',')}]`).join('\n')
const prompt =
  `You dedup a travel-rewards site's morning intel against alerts it ALREADY PUBLISHED.\n\n` +
  `PUBLISHED ALERTS:\n${pubList}\n\nFRESH INTEL:\n${freshList}\n\n` +
  `For each FRESH item that reports the SAME specific offer/change as a PUBLISHED alert, output ` +
  `{"f":<fresh#>,"p":<published#>}. A true duplicate must be the SAME PROGRAM, the SAME TYPE of ` +
  `offer, AND the same specifics (e.g. same buy-points bonus %, same transfer bonus, same fee ` +
  `change). Do NOT match: a different offer from the same program (a buy-points sale is NOT an ` +
  `award sale; a stay bonus is NOT a purchase bonus), a different program, a new month of a ` +
  `recurring promo, or a loose topic overlap. When unsure, do NOT match. STRICT JSON array only.`

let text = ''
try {
  const msg = await anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
  text = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
} catch (e) { console.log('morning-dedup: model call failed, skipping (non-fatal):', e.message); process.exit(0) }
const s = text.indexOf('['), e = text.lastIndexOf(']')
let matches = []
try { matches = JSON.parse(text.slice(s, e + 1)) } catch { console.log('morning-dedup: could not parse output, skipping.'); process.exit(0) }

const norm = (x) => String(x || '').toLowerCase()
let kept = 0, dropped = 0
for (const m of Array.isArray(matches) ? matches : []) {
  const f = fresh[(m.f | 0) - 1], p = pub[(m.p | 0) - 1]
  if (!f || !p) continue
  // Program-overlap guard: a real dupe shares a program. Accept if any fresh
  // program is in the published alert's programs, or its name is in the title.
  const fprogs = (f.programs || []).map(norm)
  const pprogs = (p.programs || []).map(norm)
  const titleHasProg = fprogs.some((fp) => fp && norm(p.title).includes(fp.replace(/-/g, ' ')))
  const overlap = fprogs.some((fp) => pprogs.includes(fp)) || titleHasProg || (!fprogs.length && !pprogs.length)
  if (!overlap) { dropped++; continue }
  kept++
  console.log(`${APPLY ? 'SUPPRESS' : 'candidate'}: "${f.headline.slice(0, 56)}"\n           = published: "${p.title.slice(0, 56)}"`)
  if (APPLY) {
    await db.from('intel_items').update({
      rejected_at: now.toISOString(), processed: true,
      rejected_reason: `semantic dupe of published: ${p.title.slice(0, 120)} (morning-dedup ${now.toISOString().slice(0, 10)})`,
    }).eq('id', f.id)
  }
}
console.log(`\nmorning-dedup: ${kept} likely dupe(s)${APPLY ? ' suppressed' : ' flagged (run with --apply to reject)'}; ${dropped} cross-program match(es) rejected by the guard. ${fresh.length} fresh total.`)
