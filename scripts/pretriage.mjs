#!/usr/bin/env node
/**
 * pretriage — zero-API deterministic pre-triage for the intel backlog.
 *
 * WHY: forwarded email intel piles up when the LLM triage-sweep is throttled
 * (e.g. low-API periods). This runs FIRST, with NO API calls, and safely clears
 * the obvious so a human (or the eventual LLM sweep) only handles the genuine
 * middle. On 2026-08-27 a 162-item backlog was ~mostly dupes-of-published +
 * recurring sales + non-US noise once the obvious was stripped.
 *
 * It NEVER collapses digest stories (a single digest email legitimately fans out
 * into many distinct deals — verified 2026-08-27, do NOT "de-dupe by email").
 * It only acts on three deterministic, conservative signals, and a US hard-guard
 * protects anything mentioning a US issuer / USD from ever being auto-dropped:
 *   1. DUPE-of-published  -> reject   (lexical Jaccard >= 0.55 vs a published
 *                                       alert AND a shared program token)
 *   2. recurring buy-points / monthly sale (non-US) -> newsletter_idea
 *   3. non-US-issuer-only, no US signal            -> reject
 * Everything else is KEPT for a human / the LLM sweep. Dry-run by default.
 *
 * Run:  node scripts/pretriage.mjs          # dry-run, prints the buckets
 *       node scripts/pretriage.mjs --apply   # execute (after eyeballing)
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const APPLY = process.argv.includes('--apply')

// --- deterministic signals (mirrors morning-snapshot's classifiers) ---------
const usSignal = (t) => /\b(chase|amex|american express|citi|citibank|bank of america|bofa|barclays|capital one|wells fargo|u\.s\.|us-only|usd)\b|\$\s?\d/i.test(t || '')
const NONUS_ISSUER = /\b(dbs|ocbc|uob|hsbc|standard chartered|maybank|posb|scb|krisflyer|royal orchid|thai airways|qantas|virgin australia|latam)\b/i
const RECURRING = /\b(monthly|buy points|buy miles|points sale|miles sale|global getaways|mileage bargains|spontaneous escapes)\b/i

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'for', 'on', 'in', 'with', 'now', 'up', 'your', 'you', 'is', 'are', 'get', 'new', 'off', 'per', 'points', 'miles', 'bonus', 'card', 'cards', 'rewards'])
const tok = (s) => new Set((s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)))
const jac = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1) }
// significant program/brand tokens for the overlap guard
const brandTok = (s) => [...tok(s)].filter((w) => /iberostar|aeroplan|avios|hyatt|marriott|hilton|ihg|avianca|lifemiles|jetblue|united|delta|alaska|singapore|krisflyer|cathay|etihad|emirates|qatar|wyndham|choice|accor|radisson|finnair|turkish|aeromexico|flyingblue|southwest/.test(w))

async function main() {
  const now = new Date().toISOString()
  const { data: intel, error } = await db.from('intel_items')
    .select('id, headline, source_type')
    .eq('processed', false).is('rejected_at', null).is('triage_decision', null)
    .or(`snoozed_until.is.null,snoozed_until.lte.${now}`)
  if (error) { console.log('!! intel query failed:', error.message); process.exit(1) }

  const since = new Date(Date.now() - 45 * 86400 * 1000).toISOString()
  const { data: pub } = await db.from('alerts').select('title').eq('status', 'published').gte('created_at', since)
  const pubTok = (pub || []).map((p) => ({ title: p.title, t: tok(p.title), b: new Set(brandTok(p.title)) }))

  const buckets = { dupe: [], newsletter: [], nonus: [], keep: [] }
  for (const r of intel || []) {
    const h = r.headline || ''
    const guarded = usSignal(h) // US items are never auto-dropped
    // 1. dupe of a published alert (lexical + shared brand token)
    const ht = tok(h), hb = new Set(brandTok(h))
    let dupe = null
    for (const p of pubTok) {
      if (jac(ht, p.t) >= 0.55 && [...hb].some((x) => p.b.has(x))) { dupe = p.title; break }
    }
    if (dupe) { buckets.dupe.push({ ...r, why: dupe }); continue }
    if (!guarded && RECURRING.test(h)) { buckets.newsletter.push(r); continue }
    if (!guarded && NONUS_ISSUER.test(h) && !usSignal(h)) { buckets.nonus.push(r); continue }
    buckets.keep.push(r)
  }

  const n = (a) => a.length
  console.log(`\n════ PRE-TRIAGE ${now.slice(0, 10)} ${APPLY ? '(APPLY)' : '(dry-run)'} ════`)
  console.log(`undecided in: ${intel.length}`)
  console.log(`  DUPE of a published alert -> reject:     ${n(buckets.dupe)}`)
  console.log(`  recurring sale (non-US) -> newsletter:   ${n(buckets.newsletter)}`)
  console.log(`  non-US-issuer only -> reject:            ${n(buckets.nonus)}`)
  console.log(`  KEEP for human / LLM sweep:              ${n(buckets.keep)}`)
  console.log(`\nsample DUPES (fresh -> matched published):`)
  for (const d of buckets.dupe.slice(0, 8)) console.log(`   - ${(d.headline || '').slice(0, 44)}  ~=  ${(d.why || '').slice(0, 40)}`)
  console.log(`\nsample KEEP (real decisions left):`)
  for (const k of buckets.keep.slice(0, 12)) console.log(`   - ${(k.headline || '').slice(0, 62)}`)

  if (APPLY) {
    const rej = [...buckets.dupe, ...buckets.nonus].map((r) => r.id)
    const news = buckets.newsletter.map((r) => r.id)
    if (rej.length) {
      const { error: e1 } = await db.from('intel_items').update({ rejected_at: now, processed: true, rejected_reason: 'pretriage: dupe-of-published or non-US-only' }).in('id', rej)
      console.log(e1 ? 'reject ERR ' + e1.message : `\nrejected ${rej.length}`)
    }
    if (news.length) {
      const { error: e2 } = await db.from('intel_items').update({ triage_decision: 'newsletter_idea' }).in('id', news)
      console.log(e2 ? 'newsletter ERR ' + e2.message : `parked ${news.length} as newsletter_idea`)
    }
    console.log(`kept ${buckets.keep.length} for human / the LLM sweep.`)
  } else {
    console.log(`\n(dry-run — nothing changed. Re-run with --apply to act.)`)
  }
}
main()
