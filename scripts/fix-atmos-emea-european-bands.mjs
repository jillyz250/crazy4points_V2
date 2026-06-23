#!/usr/bin/env node
/**
 * Fix: add the missing "up to 7,000 mi" band to atmos EMEA partners that fly
 * transcon US-Europe routes exceeding their current 5,000-mi cap.
 *
 * award_chart_miss flagged iberia/finnair/aer-lingus on us-eu-west: all three fly
 * West-Coast-US to Europe (LAX-MAD ~5,800 / LAX-HEL ~5,600 / LAX/SFO-DUB ~5,100-5,200)
 * which exceeds their authored 5,000-mi band, so the engine can't price them.
 *
 * SOURCE: the atmos EMEA chart is uniform distance-pricing - every partner pays
 * the same per band. The "up to 7,000" band (business 70,000 / economy 35,000) is
 * already verified on british-airways/etihad/qatar/RAM/RJ. These three carriers
 * were truncated at 5,000 during authoring; this restores the chart's own ladder
 * for the 5,000-7,000mi routes they actually operate. Cabins match each partner's
 * existing set (business + economy only - no first/PE on these carriers' bands).
 * Idempotent.
 *
 * Run: set -a; . ./.env.local; set +a; node scripts/fix-atmos-emea-european-bands.mjs
 */
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data } = await sb.from('programs').select('id, award_chart_structured').eq('slug','atmos').single()
const prog = data.award_chart_structured
const emea = prog.charts.find((c) => (c.partners||{})['iberia'])
const BAND = { max_miles: 7000, cabin: { economy: 35000, business: 70000 } }
let added = []
for (const p of ['iberia','finnair','aer-lingus']) {
  const part = emea.partners[p]; if (!part) { console.log('skip (no partner):', p); continue }
  if (part.bands.some(b => b.max_miles === 7000)) { console.log('already has 7k band:', p); continue }
  part.bands.push({ ...BAND, cabin: { ...BAND.cabin } })
  part.bands.sort((a,b)=>a.max_miles-b.max_miles)
  added.push(p)
}
if (added.length) {
  const { error } = await sb.from('programs').update({ award_chart_structured: prog, content_updated_at: new Date().toISOString() }).eq('id', data.id)
  if (error) { console.log('FAILED:', error.message); process.exit(1) }
}
console.log('added up-to-7000 band to:', added.join(', ') || '(none)')
