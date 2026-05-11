#!/usr/bin/env node
/**
 * Backfill partner_redemptions.origin_iata / dest_iata from region_or_route text.
 *
 * Phase 1 of Award Chart Rebuild (Option C). Idempotent — re-run safe.
 *
 * Strategy:
 *   1. Pull every row where origin_iata IS NULL (i.e. unbackfilled)
 *   2. Try to extract an (origin, dest) IATA pair from region_or_route via:
 *      a. Direct IATA pattern: "XXX ↔ YYY", "XXX-YYY", "XXX/YYY", "XXX to YYY"
 *      b. Named-city → IATA mapping for common cases ("New York to London")
 *   3. Region-bucket rows ("US East ↔ Europe", "Within US — long-haul") stay NULL.
 *      These are bucket rows; they'll match by route_buckets[] at query time.
 *   4. Report counts: parsed / left NULL / parse failures.
 *
 * Run: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-partner-redemption-iata.mjs
 *      Add --dry to preview without writing.
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(url, key, { auth: { persistSession: false } })
const DRY = process.argv.includes('--dry')

// Common named-city → IATA mappings. Add as needed; the regex pass catches
// most "JFK ↔ LHR"-style rows without this table.
const CITY_TO_IATA = {
  'new york': 'JFK',
  'newark': 'EWR',
  'los angeles': 'LAX',
  'san francisco': 'SFO',
  'chicago': 'ORD',
  'boston': 'BOS',
  'miami': 'MIA',
  'dallas': 'DFW',
  'atlanta': 'ATL',
  'seattle': 'SEA',
  'honolulu': 'HNL',
  'london': 'LHR',
  'paris': 'CDG',
  'amsterdam': 'AMS',
  'frankfurt': 'FRA',
  'munich': 'MUC',
  'madrid': 'MAD',
  'rome': 'FCO',
  'milan': 'MXP',
  'zurich': 'ZRH',
  'dublin': 'DUB',
  'doha': 'DOH',
  'dubai': 'DXB',
  'abu dhabi': 'AUH',
  'singapore': 'SIN',
  'tokyo': 'NRT',
  'osaka': 'KIX',
  'hong kong': 'HKG',
  'bangkok': 'BKK',
  'sydney': 'SYD',
  'melbourne': 'MEL',
  'auckland': 'AKL',
  'sao paulo': 'GRU',
  'rio de janeiro': 'GIG',
  'mexico city': 'MEX',
  'toronto': 'YYZ',
  'vancouver': 'YVR',
  'montreal': 'YUL',
  'johannesburg': 'JNB',
  'cape town': 'CPT',
  'mumbai': 'BOM',
  'delhi': 'DEL',
  'seoul': 'ICN',
  'taipei': 'TPE',
  'istanbul': 'IST',
  'tel aviv': 'TLV',
}

const IATA_REGEX = /\b([A-Z]{3})\b\s*(?:↔|to|-|–|—|\/|\?)\s*\b([A-Z]{3})\b/

function tryParse(text) {
  if (!text) return null
  // Pass 1: direct IATA-pair pattern
  const m = text.match(IATA_REGEX)
  if (m) return { origin: m[1], dest: m[2] }
  // Pass 2: named-city to IATA mapping
  const lower = text.toLowerCase()
  for (const [city1, iata1] of Object.entries(CITY_TO_IATA)) {
    const i = lower.indexOf(city1)
    if (i === -1) continue
    const rest = lower.slice(i + city1.length)
    if (!/\s*(↔|to|-|–|—|\/)/.test(rest)) continue
    for (const [city2, iata2] of Object.entries(CITY_TO_IATA)) {
      if (city2 === city1) continue
      if (rest.includes(city2)) return { origin: iata1, dest: iata2 }
    }
  }
  return null
}

async function main() {
  const { data: rows, error } = await supabase
    .from('partner_redemptions')
    .select('id, region_or_route, origin_iata, dest_iata')
    .is('origin_iata', null)

  if (error) {
    console.error('Query failed:', error)
    process.exit(1)
  }

  console.log(`Found ${rows.length} unbackfilled rows.\n`)

  const parsed = []
  const unparseable = []
  for (const r of rows) {
    const res = tryParse(r.region_or_route)
    if (res) parsed.push({ id: r.id, ...res, text: r.region_or_route })
    else unparseable.push({ id: r.id, text: r.region_or_route })
  }

  console.log(`Parseable:    ${parsed.length}`)
  console.log(`Region rows:  ${unparseable.length} (correctly stay NULL)\n`)

  if (parsed.length > 0) {
    console.log('Sample of parsed rows:')
    for (const p of parsed.slice(0, 8)) {
      console.log(`  ${p.origin}-${p.dest}  "${p.text}"`)
    }
    console.log()
  }

  if (DRY) {
    console.log('--dry: no writes.')
    return
  }

  // Batch update
  let written = 0
  for (const p of parsed) {
    const { error: e } = await supabase
      .from('partner_redemptions')
      .update({ origin_iata: p.origin, dest_iata: p.dest })
      .eq('id', p.id)
    if (e) {
      console.error(`Update failed for ${p.id}:`, e.message)
    } else {
      written++
    }
  }
  console.log(`Wrote ${written} of ${parsed.length}.`)
}

main()
