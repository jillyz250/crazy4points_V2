#!/usr/bin/env node
/**
 * Group a program's Tips & quirks into scannable "### Heading" sub-sections.
 *
 * Claude ONLY classifies each existing bullet into a bucket — it never rewrites
 * text. This script reassembles the original bullets verbatim under the chosen
 * headings, then verifies every original bullet still appears unchanged before
 * writing. Originals are backed up to /tmp/quirks-backups/<slug>.txt.
 *
 * Usage: node scripts/group-quirks.mjs <slug> [<slug> ...]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

try {
  for (const l of readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
    const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
  }
} catch {}

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const AKEY = process.env.ANTHROPIC_API_KEY
const sb = { apikey: KEY, Authorization: `Bearer ${KEY}` }
const sbw = { ...sb, 'Content-Type': 'application/json', Prefer: 'return=representation' }

// FUNCTIONAL buckets only — Claude classifies into these. "Program history" is
// NOT a Claude option; it's applied deterministically afterward (see HISTORY_RE)
// so current rules can't get mis-greyed.
const BUCKETS = {
  airline: ['Redeeming & surcharges', 'Earning & status', 'Transfers & sharing'],
  hotel: ['Earning & redeeming', 'Elite status & perks', 'Cards & free nights'],
  default: ['Key rules', 'Earning & status', 'Transfers & sharing'],
}

// Strict, deterministic markers of genuine "how we got here" history — things
// that ENDED or CHANGED NAME and no longer affect how you use the program today.
// Conservative on purpose: a current rule with a past date must NOT match.
const HISTORY_RE = /\b(is dead|are dead|defunct|discontinued|rebranded|renamed|absorbed into|merger is (?:dead|complete)|formerly known as|replaced (?:q?miles|qmiles|the (?:old|previous)))\b/i

function parseBlocks(md) {
  const out = []
  let cur = null
  for (const line of md.split('\n')) {
    if (/^- /.test(line)) { if (cur) out.push(cur); cur = line }
    else if (cur != null) cur += '\n' + line
  }
  if (cur) out.push(cur)
  return out
}

async function classify(name, type, buckets, firstLines) {
  const numbered = firstLines.map((l, i) => `${i}: ${l.replace(/^- /, '').slice(0, 180)}`).join('\n')
  const prompt = `You are organizing the "Tips & quirks" bullets on a points-and-miles reference page for ${name} (a ${type} program). Assign each numbered bullet to exactly ONE of these groups:
${buckets.map((b) => `- ${b}`).join('\n')}

Guidance:
- "Program history" = how-we-got-here background that no longer changes how you USE the program today: rebrands, renames, a carrier joining/leaving an alliance, a past merger. Do NOT put current rules here just because they have a past date — a devaluation, a switch to revenue-based earning, or a fee that's in effect now are CURRENT rules, not history.
- Group by what the reader is trying to do (redeem, earn/status, move points, or just historical context).

BULLETS:
${numbered}

Return ONLY a JSON array, one object per bullet: [{"i":0,"group":"<exact group name>"}, ...]. Every index 0..${firstLines.length - 1} must appear exactly once.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': AKEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
  })
  const j = await res.json()
  const text = j.content?.find((c) => c.type === 'text')?.text ?? '[]'
  const arr = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1))
  const map = new Map()
  for (const x of arr) if (typeof x.i === 'number' && buckets.includes(x.group)) map.set(x.i, x.group)
  return map
}

async function groupOne(slug) {
  const [prog] = await (await fetch(`${BASE}/rest/v1/programs?slug=eq.${slug}&select=name,type,quirks`, { headers: sb })).json()
  if (!prog?.quirks) { console.log(`[${slug}] no quirks — skip`); return }

  // Always regroup from the ORIGINAL: use the backup if we made one, else the
  // current value (and back it up). Makes re-runs idempotent + safe.
  mkdirSync('/tmp/quirks-backups', { recursive: true })
  const backup = `/tmp/quirks-backups/${slug}.txt`
  let source
  if (existsSync(backup)) source = readFileSync(backup, 'utf8')
  else { source = prog.quirks; writeFileSync(backup, source) }

  const buckets = BUCKETS[prog.type] ?? BUCKETS.default
  const HIST = 'Program history'
  const blocks = parseBlocks(source)
  const firstLines = blocks.map((b) => b.split('\n')[0])
  const map = await classify(prog.name, prog.type, buckets, firstLines)

  // Functional assignment from Claude; then deterministically pull genuine
  // history out into the (greyed) history bucket. Default unmapped to bucket[0].
  const byBucket = new Map([...buckets, HIST].map((b) => [b, []]))
  let defaulted = 0
  blocks.forEach((b, i) => {
    if (HISTORY_RE.test(b)) { byBucket.get(HIST).push(b); return }
    let g = map.get(i)
    if (!g) { g = buckets[0]; defaulted++ }
    byBucket.get(g).push(b)
  })
  const order = [...buckets, HIST]
  const sections = order.filter((b) => byBucket.get(b).length).map((b) => `### ${b}\n\n${byBucket.get(b).join('\n')}`)
  const out = sections.join('\n\n')

  // VERIFY no bullet lost / altered: every original first-line present verbatim
  const missing = firstLines.filter((f) => !out.includes(f))
  if (missing.length) { console.error(`[${slug}] ABORT — ${missing.length} bullets missing after regroup`); return }

  const res = await fetch(`${BASE}/rest/v1/programs?slug=eq.${slug}`, { method: 'PATCH', headers: sbw, body: JSON.stringify({ quirks: out }) })
  const counts = order.map((b) => `${b.split(' ')[0]}=${byBucket.get(b).length}`).join(' ')
  const hist = byBucket.get(HIST).map((b) => b.split('\n')[0].replace(/^- \*\*/, '').slice(0, 55))
  console.log(`[${slug}] ${res.ok ? 'WROTE' : 'FAIL ' + res.status} | ${blocks.length} bullets | ${counts} | defaulted=${defaulted}`)
  if (hist.length) console.log(`         GREYED history: ${hist.join(' | ')}`)
}

const slugs = process.argv.slice(2)
if (!slugs.length) { console.error('usage: group-quirks.mjs <slug> ...'); process.exit(1) }
for (const s of slugs) { try { await groupOne(s) } catch (e) { console.error(`[${s}] error:`, e.message) } }
