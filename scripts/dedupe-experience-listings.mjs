#!/usr/bin/env node
/**
 * One-off cleanup for duplicate experience_listings rows.
 *
 * Root cause (fixed in utils/experiences/runExperiencesWatch.ts on 2026-08-27):
 * the dedup key only extracted a 5+ digit run from the detail URL, so UUID/slug
 * URLs fell through to a title+date key whose DATE FORMAT drifted between scrapes
 * ("2026-09-10" vs "september-10-2026"), spawning a fresh row each run.
 *
 * This script re-keys every existing row to the NEW url-based scheme and collapses
 * rows that now share a key, keeping the single best row per key:
 *   prefer  active > closed  →  then has-image  →  then most-recently-seen.
 * The keeper's source_listing_key is rewritten to the new key so the next scrape
 * matches it (update) instead of inserting yet another dupe.
 *
 * DRY BY DEFAULT. Pass --apply to actually delete + re-key.
 *
 *   node scripts/dedupe-experience-listings.mjs          # preview
 *   node scripts/dedupe-experience-listings.mjs --apply  # execute
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// Load .env.local (same pattern as other scripts here).
try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* env may already be set */
}

const APPLY = process.argv.includes('--apply')
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const TRACKING_PARAM = /^(utm_[a-z]+|fbclid|gclid|mc_cid|mc_eid|_ga|ref|ref_|source)$/i
function normalizeDetailUrl(url) {
  let u = url.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/#.*$/, '')
  const qIdx = u.indexOf('?')
  if (qIdx !== -1) {
    const base = u.slice(0, qIdx)
    const kept = u
      .slice(qIdx + 1)
      .split('&')
      .filter((kv) => kv && !TRACKING_PARAM.test(kv.split('=')[0]))
      .sort()
    u = kept.length ? `${base}?${kept.join('&')}` : base
  }
  return u.replace(/\/+$/, '').toLowerCase()
}

function newKey(row) {
  if (row.detail_url && row.detail_url.trim()) {
    return `${row.program_slug}:url:${normalizeDetailUrl(row.detail_url)}`
  }
  const t = (row.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
  const parsed = row.event_date ? Date.parse(row.event_date) : NaN
  const d = Number.isNaN(parsed) ? '' : new Date(parsed).toISOString().slice(0, 10)
  return `${row.program_slug}:${t}:${d}`
}

// Rank a row within its dup group; LOWER is better (kept).
function rank(r) {
  const notActive = r.status === 'active' ? 0 : 1
  const noImage = r.image_url ? 0 : 1
  const seen = r.last_seen_at ? Date.parse(r.last_seen_at) : 0
  return { notActive, noImage, seen }
}
function better(a, b) {
  const ra = rank(a)
  const rb = rank(b)
  if (ra.notActive !== rb.notActive) return ra.notActive < rb.notActive ? a : b
  if (ra.noImage !== rb.noImage) return ra.noImage < rb.noImage ? a : b
  return ra.seen >= rb.seen ? a : b
}

const { data, error } = await supabase
  .from('experience_listings')
  .select('id, program_slug, source_platform, title, detail_url, event_date, status, image_url, last_seen_at, source_listing_key, editorial_reviewed_at, featured')
  .limit(10000)

if (error) {
  console.error('query failed:', error.message)
  process.exit(1)
}

const groups = new Map()
for (const r of data) {
  const k = newKey(r)
  if (!groups.has(k)) groups.set(k, [])
  groups.get(k).push(r)
}

const toDelete = []
const toRekey = [] // { id, from, to }
let dupGroups = 0
for (const [k, rows] of groups) {
  // Rekey the (eventual) keeper if its key changed.
  let keeper = rows[0]
  for (const r of rows.slice(1)) keeper = better(keeper, r)
  if (keeper.source_listing_key !== k) toRekey.push({ id: keeper.id, from: keeper.source_listing_key, to: k })
  if (rows.length > 1) {
    dupGroups++
    // Preserve any editorial signal from a non-keeper onto the keeper.
    const anyReviewed = rows.some((r) => r.editorial_reviewed_at)
    const anyFeatured = rows.some((r) => r.featured)
    keeper._inheritReviewed = anyReviewed && !keeper.editorial_reviewed_at
    keeper._inheritFeatured = anyFeatured && !keeper.featured
    for (const r of rows) if (r.id !== keeper.id) toDelete.push(r)
  }
}

console.log(`total rows:        ${data.length}`)
console.log(`distinct new keys: ${groups.size}`)
console.log(`duplicate groups:  ${dupGroups}`)
console.log(`rows to DELETE:    ${toDelete.length}`)
console.log(`keepers to re-key: ${toRekey.length}`)
console.log('')
console.log('sample of dupes to remove:')
for (const r of toDelete.slice(0, 12)) {
  console.log(`  del ${r.status.padEnd(6)} seen ${(r.last_seen_at || '').slice(0, 10)} [${r.program_slug}] ${(r.title || '').slice(0, 50)}`)
}

if (!APPLY) {
  console.log('\nDRY RUN — nothing changed. Re-run with --apply to execute.')
  process.exit(0)
}

// Execute: inherit editorial signals onto keepers, delete dupes, re-key keepers.
let inherited = 0
for (const [, rows] of groups) {
  if (rows.length < 2) continue
  let keeper = rows[0]
  for (const r of rows.slice(1)) keeper = better(keeper, r)
  const patch = {}
  if (keeper._inheritReviewed) patch.editorial_reviewed_at = new Date().toISOString()
  if (keeper._inheritFeatured) { patch.featured = true; patch.featured_at = new Date().toISOString() }
  if (Object.keys(patch).length) {
    await supabase.from('experience_listings').update(patch).eq('id', keeper.id)
    inherited++
  }
}

const delIds = toDelete.map((r) => r.id)
for (let i = 0; i < delIds.length; i += 200) {
  const { error: e } = await supabase.from('experience_listings').delete().in('id', delIds.slice(i, i + 200))
  if (e) { console.error('delete failed:', e.message); process.exit(1) }
}

let rekeyed = 0
for (const { id, to } of toRekey) {
  const { error: e } = await supabase.from('experience_listings').update({ source_listing_key: to }).eq('id', id)
  if (e) { console.error(`rekey ${id} failed:`, e.message) } else rekeyed++
}

console.log(`\nAPPLIED: deleted ${delIds.length} dupes, re-keyed ${rekeyed} keepers, inherited editorial signal on ${inherited}.`)
