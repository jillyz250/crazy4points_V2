#!/usr/bin/env node
/**
 * Add ONE item to the social-calendar Recommended lane (a `suggested` triage card).
 * Used from the daily ritual: when Jill decides an alert is worth a social post, this
 * drops it into the calendar's Recommended rail with a sensible suggested date, and
 * she drags it to a day (or hits Schedule to take the suggested date). Deduped by
 * source_ref + topic signature so it won't double up with the reminder auto-ingest.
 *
 * Usage:
 *   node scripts/add-social-triage.mjs --topic "Amex to ANA sweet spot" \
 *     --category sweet_spot --ref alert:amex-ana-sweet-spot --date 2026-09-03 \
 *     --link /alerts/amex-ana-sweet-spot --platform facebook --note "..."
 * Categories: experience|sweepstakes|sweet_spot|program_news|deal|guide|recurring|other
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Inlined from lib/socialCategories.ts (kept in sync) so this runs under plain node.
const STOP = new Set(['the', 'a', 'an', 'to', 'in', 'on', 'for', 'with', 'and', 'of', 'at', 'your', 'you', 'is', 'now', 'from', 'by', 'this', 'that', 'get', 'earn', 'win', 'per', 'up', 'q1', 'q2', 'q3', 'q4', 'categories', 'category', 'bonus', 'points', 'point', 'miles', 'mile', 'sweepstakes', 'entry', 'night'])
const topicSignature = (t) => [...new Set(String(t ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\b\d+%?\b/g, ' ').split(/\s+/).filter((x) => x.length > 2 && !STOP.has(x)))].sort()
const signaturesOverlap = (a, b) => { if (!a.length || !b.length) return false; const s = new Set(a); let n = 0; for (const t of b) if (s.has(t)) n++; return n >= 2 && n / Math.min(a.length, b.length) >= 0.6 }

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const args = process.argv.slice(2)
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined }

const topic = val('--topic')
const category = val('--category') || 'other'
const source_ref = val('--ref') || `manual:${Date.now()}`
const post_date = val('--date') || new Date(Date.now() + 86400000).toISOString().slice(0, 10)
const link_url = val('--link') || null
const platform = val('--platform') || 'facebook'
const notes = val('--note') || null

if (!topic || !/^\d{4}-\d{2}-\d{2}$/.test(post_date)) {
  console.error('need --topic and a valid --date YYYY-MM-DD'); process.exit(1)
}

// Dedup: skip if a same-idea slot already exists within ~30 days.
const lo = new Date(`${post_date}T00:00:00Z`); lo.setUTCDate(lo.getUTCDate() - 30)
const hi = new Date(`${post_date}T00:00:00Z`); hi.setUTCDate(hi.getUTCDate() + 30)
const { data: near } = await db.from('social_calendar').select('topic, source_ref')
  .gte('post_date', lo.toISOString().slice(0, 10)).lte('post_date', hi.toISOString().slice(0, 10))
const sig = topicSignature(topic)
const dupe = (near || []).find((r) => r.source_ref === source_ref || signaturesOverlap(sig, topicSignature(r.topic)))
if (dupe) { console.log(`skipped — already on the calendar ("${dupe.topic}")`); process.exit(0) }

const { error } = await db.from('social_calendar').insert({
  post_date, platform, topic, category, source_type: 'alert', source_ref,
  dedupe_key: null, status: 'suggested', link_url, notes,
})
if (error) { console.error('insert failed:', error.message); process.exit(1) }
console.log(`added to Recommended: "${topic}" [${category}] suggests ${post_date} (${platform})`)
