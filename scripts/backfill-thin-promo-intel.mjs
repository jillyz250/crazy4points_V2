#!/usr/bin/env node
/**
 * One-shot: backfill intel_items.raw_text for already-ingested promo-shaped
 * findings whose RSS-supplied raw_text was too thin to carry qualifying terms
 * (status tier, min nights, travel window, exclusions, registration).
 *
 * Mirrors the live Scout enrichment logic from utils/ai/enrichPromoFindings.ts:
 *   - alert_type ∈ {limited_time_offer, transfer_bonus, status_promo}
 *   - raw_text length < 500 chars
 *   - source_url IS NOT NULL
 *   - Firecrawl-refetched body must be longer than existing raw_text
 *
 * Usage:
 *   # Dry run — print candidates and what would change, no DB writes:
 *   node scripts/backfill-thin-promo-intel.mjs
 *
 *   # Apply changes for real:
 *   node scripts/backfill-thin-promo-intel.mjs --apply
 *
 *   # Limit scope (default: all candidates):
 *   node scripts/backfill-thin-promo-intel.mjs --limit 5
 *
 * Cost: one Firecrawl call per candidate. Most affected DBs will have
 * a handful to ~50 rows. Dry run is free.
 *
 * Side effects (with --apply):
 *   - Updates intel_items.raw_text for enriched rows
 *   - Does NOT trigger any downstream regenerate. If you want the alerts
 *     authored against this richer raw_text, regenerate them in admin
 *     after backfill completes.
 */

import { readFileSync } from 'node:fs'
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const ARGS = process.argv.slice(2)
const APPLY = ARGS.includes('--apply')
const LIMIT_IDX = ARGS.indexOf('--limit')
const LIMIT = LIMIT_IDX >= 0 ? Number(ARGS[LIMIT_IDX + 1] ?? '0') : 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const firecrawlKey = process.env.FIRECRAWL_API_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE env vars')
  process.exit(1)
}
if (!firecrawlKey) {
  console.error('Missing FIRECRAWL_API_KEY (required for refetches)')
  process.exit(1)
}

const PROMO_TYPES = ['limited_time_offer', 'transfer_bonus', 'status_promo']
const RAW_TEXT_MIN_CHARS = 500
const FIRECRAWL_MAX_CHARS = 6000
const SLEEP_BETWEEN_CALLS_MS = 750

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function rest(path, { params = {}, method = 'GET', body, headers = {} } = {}) {
  const url = new URL(`${supabaseUrl}/rest/v1/${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: method === 'PATCH' ? 'return=minimal' : '',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => '')}`)
  if (method === 'PATCH') return null
  return res.json()
}

async function firecrawl(url) {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${firecrawlKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      timeout: 25000,
    }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) {
    return { ok: false, error: `${res.status} ${(await res.text().catch(() => '')).slice(0, 200)}` }
  }
  const json = await res.json()
  const md = json?.data?.markdown ?? ''
  if (!md) return { ok: false, error: 'no markdown payload' }
  return { ok: true, body: md.slice(0, FIRECRAWL_MAX_CHARS) }
}

console.log(`Mode: ${APPLY ? 'APPLY (will update DB)' : 'DRY RUN (no DB writes)'}`)
if (LIMIT > 0) console.log(`Limit: ${LIMIT}`)

// 1. Find candidates
const orFilter = PROMO_TYPES.map((t) => `alert_type.eq.${t}`).join(',')
const candidates = await rest('intel_items', {
  params: {
    select: 'id,headline,source_url,raw_text,alert_type,created_at',
    or: `(${orFilter})`,
    source_url: 'not.is.null',
    order: 'created_at.desc',
    ...(LIMIT > 0 ? { limit: String(LIMIT * 5) } : {}),  // pull 5x cap; filter by length next
  },
})

const thin = candidates.filter((c) => (c.raw_text ?? '').trim().length < RAW_TEXT_MIN_CHARS)
const thinLimited = LIMIT > 0 ? thin.slice(0, LIMIT) : thin

console.log(`\nFound ${candidates.length} promo candidates total.`)
console.log(`${thin.length} have thin raw_text (< ${RAW_TEXT_MIN_CHARS} chars).`)
if (LIMIT > 0 && thin.length > LIMIT) {
  console.log(`Processing first ${LIMIT} (most recent).`)
}

if (thinLimited.length === 0) {
  console.log('\nNothing to do. Exiting.')
  process.exit(0)
}

console.log('\n=== candidates ===')
for (const c of thinLimited) {
  console.log(`  • [${c.alert_type}] ${c.headline.slice(0, 70)}`)
  console.log(`    raw_text len: ${(c.raw_text ?? '').length}, source: ${c.source_url}`)
}

if (!APPLY) {
  console.log('\n--- DRY RUN — no Firecrawl calls, no DB writes ---')
  console.log('Re-run with --apply to refetch + update.')
  process.exit(0)
}

console.log('\n=== refetching via Firecrawl ===')
let enriched = 0
let skipped = 0
let failed = 0

for (const [i, c] of thinLimited.entries()) {
  process.stdout.write(`  [${i + 1}/${thinLimited.length}] ${c.headline.slice(0, 60)}… `)
  const result = await firecrawl(c.source_url)
  if (!result.ok) {
    console.log(`✗ failed (${result.error})`)
    failed++
    await sleep(SLEEP_BETWEEN_CALLS_MS)
    continue
  }
  const oldLen = (c.raw_text ?? '').length
  if (result.body.length <= oldLen) {
    console.log(`⤳ skipped (refetch shorter: ${result.body.length} ≤ ${oldLen})`)
    skipped++
    await sleep(SLEEP_BETWEEN_CALLS_MS)
    continue
  }
  try {
    await rest(`intel_items?id=eq.${c.id}`, {
      method: 'PATCH',
      body: { raw_text: result.body },
    })
    console.log(`✓ enriched ${oldLen} → ${result.body.length} chars`)
    enriched++
  } catch (err) {
    console.log(`✗ DB update failed (${err.message})`)
    failed++
  }
  await sleep(SLEEP_BETWEEN_CALLS_MS)
}

console.log(`\n=== summary ===`)
console.log(`  Enriched: ${enriched}`)
console.log(`  Skipped:  ${skipped}`)
console.log(`  Failed:   ${failed}`)
console.log(`  Total:    ${thinLimited.length}`)
console.log(`\nNote: regenerate the affected alerts in admin to re-author drafts against the enriched raw_text.`)
