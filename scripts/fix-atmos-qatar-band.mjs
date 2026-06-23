#!/usr/bin/env node
/**
 * Fix: add Qatar's missing long-haul distance band to the atmos EMEA chart.
 *
 * The award_chart_miss integrity check flagged qatar/us-me-india + qatar/us-africa:
 * the chart capped Qatar at a single "up to 7,000 mi" band, so the engine couldn't
 * price US->India (~7,800 mi) even though Atmos DOES publish it.
 *
 * SOURCE: Atmos/Alaska publishes US->India Qatar business at 85,000 mi and
 * US->Doha at 70,000 mi (https://onemileatatime.com/news/redeem-alaska-miles-qatar-airways/).
 * The atmos EMEA chart is uniform distance-pricing — every partner pays the same
 * per band — and etihad/british-airways already carry the "up to 10,000 mi" band
 * (business 85,000 / economy 42,500 / first 130,000). US->Doha 70k = the existing
 * "up to 7,000" band; US->India 85k = the "up to 10,000" band Qatar was missing.
 * So this restores Qatar to the chart's own verified ladder. Idempotent.
 *
 * Run: set -a; . ./.env.local; set +a; node scripts/fix-atmos-qatar-band.mjs
 */
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await sb.from('programs').select('id, award_chart_structured').eq('slug', 'atmos').single()
const prog = data.award_chart_structured
const emea = prog.charts.find((c) => (c.partners || {}).qatar) // the EMEA chart carries qatar
const qatar = emea.partners.qatar
if (qatar.bands.some((b) => b.max_miles === 10000)) {
  console.log('qatar up-to-10000 band already present — no-op')
  process.exit(0)
}
qatar.bands.push({ max_miles: 10000, cabin: { economy: 42500, business: 85000, first: 130000 } })
qatar.bands.sort((a, b) => a.max_miles - b.max_miles)
const { error } = await sb.from('programs').update({ award_chart_structured: prog, content_updated_at: new Date().toISOString() }).eq('id', data.id)
if (error) { console.log('FAILED:', error.message); process.exit(1) }
console.log('OK: added qatar up-to-10000 band (business 85,000 / economy 42,500 / first 130,000)')
