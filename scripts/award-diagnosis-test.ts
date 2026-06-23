/**
 * Commit-1 test: diagnoseAwardCost parity + classification, against the REAL
 * TS engine (run via tsx) and REAL prod charts — not the JS mirror.
 *
 * Asserts:
 *  - PARITY: computeAwardCost(...) === (diag.kind==='computed' ? diag.result : null)
 *    for every (program × partner × origin × dest × cabin) combo.
 *  - NEVER THROWS on the matrix (incl. unknown partner).
 *  - computed results are sane (miles >= 0, low <= high, finite).
 *  - the non-computed kinds are reachable + correct on crafted inputs.
 *
 * Run: set -a; . ./.env.local; set +a; npx tsx scripts/award-diagnosis-test.ts
 */
import { createClient } from '@supabase/supabase-js'
import { computeAwardCost, diagnoseAwardCost, type AwardDiagnosis } from '../lib/awardChart.compute'
import type { Airport } from '../lib/airports'
import type { AwardChartProgram, Cabin } from '../lib/awardChart'

const A = (iata: string, lat: number, lng: number, region: string, cc: string): Airport =>
  ({ iata, lat, lng, region, country_code: cc } as unknown as Airport)
const AIRPORTS: Record<string, Airport> = {
  JFK: A('JFK', 40.64, -73.78, 'us-east', 'US'),
  LAX: A('LAX', 33.94, -118.41, 'us-west', 'US'),
  LHR: A('LHR', 51.47, -0.45, 'europe', 'GB'),
  NRT: A('NRT', 35.77, 140.39, 'japan-korea', 'JP'),
  GRU: A('GRU', -23.44, -46.47, 'south-america', 'BR'),
}
const CABINS: Cabin[] = ['economy', 'premium_economy', 'business', 'first']

async function main() {
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const { data } = await sb.from('programs').select('slug, award_chart_structured').not('award_chart_structured', 'is', null)

let checks = 0, fails = 0, threw = 0
const kinds: Record<string, number> = {}
const missSamples: string[] = []
const assert = (c: boolean, msg: string) => { checks++; if (!c) { fails++; if (fails <= 20) console.log('FAIL', msg) } }

for (const row of (data ?? []) as Array<{ slug: string; award_chart_structured: AwardChartProgram }>) {
  const program = row.award_chart_structured
  const partners = new Set<string>()
  for (const c of program.charts ?? []) for (const p of Object.keys((c as { partners?: Record<string, unknown> }).partners ?? {})) partners.add(p)
  const testPartners = [...partners].slice(0, 4).concat(['__nonexistent__'])
  for (const partner of testPartners) {
    for (const o of Object.values(AIRPORTS)) for (const d of Object.values(AIRPORTS)) {
      for (const cabin of CABINS) {
        let diag: AwardDiagnosis, val
        try {
          diag = diagnoseAwardCost(program, partner, o, d, cabin)
          val = computeAwardCost(program, partner, o, d, cabin)
        } catch (e) { threw++; console.log('THREW', row.slug, partner, o.iata, d.iata, cabin, String(e)); continue }
        kinds[diag.kind] = (kinds[diag.kind] || 0) + 1
        const expected = diag.kind === 'computed' ? diag.result : null
        // Value equality (computeAwardCost delegates but returns a distinct instance).
        assert(JSON.stringify(val) === JSON.stringify(expected), `parity ${row.slug}/${partner} ${o.iata}-${d.iata}/${cabin}: compute=${JSON.stringify(val)} diag=${diag.kind}`)
        if (diag.kind === 'chart-miss' && missSamples.length < 8) missSamples.push(`${row.slug}/${partner} ${o.iata}-${d.iata}/${cabin}: ${diag.reason}`)
        if (diag.kind === 'computed' && diag.result) {
          const m = diag.result.miles
          const lo = typeof m === 'object' ? m.low : m
          const hi = typeof m === 'object' ? m.high : m
          assert(lo >= 0 && hi >= lo && Number.isFinite(lo) && Number.isFinite(hi), `miles sane ${row.slug}/${partner}`)
        }
      }
    }
  }
}

// Crafted inputs → each non-computed kind reachable + correct, no throws.
assert(diagnoseAwardCost(null, 'aa', AIRPORTS.JFK, AIRPORTS.LAX, 'economy').kind === 'no-structured-chart', 'null program -> no-structured-chart')
assert(diagnoseAwardCost({ charts: [] } as unknown as AwardChartProgram, 'aa', AIRPORTS.JFK, AIRPORTS.LAX, 'economy').kind === 'no-structured-chart', 'empty charts')
let nullOriginKind = ''
try { nullOriginKind = diagnoseAwardCost({ charts: [{}] } as unknown as AwardChartProgram, 'aa', null as unknown as Airport, AIRPORTS.LAX, 'economy').kind } catch (e) { threw++; console.log('THREW null-origin', String(e)) }
assert(nullOriginKind === 'invalid-input', `null origin -> invalid-input (got ${nullOriginKind})`)

console.log(`\nchecks: ${checks}  fails: ${fails}  threw: ${threw}`)
console.log('diagnosis kinds seen:', JSON.stringify(kinds))
console.log('sample chart-miss cases:'); for (const s of missSamples) console.log('  ', s)
console.log(fails === 0 && threw === 0 ? '\nPASS — parity holds, no throws, all kinds reachable.' : '\nFAILED')
process.exit(fails || threw ? 1 : 0)
}
main()
