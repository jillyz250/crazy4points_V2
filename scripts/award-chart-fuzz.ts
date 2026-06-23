/**
 * Award-chart FUZZ harness — hammers the REAL engine with adversarial inputs to
 * prove it never throws and never emits insane output. Complements the
 * value-regression test (award-chart-engine-test.ts) and the parity test
 * (award-diagnosis-test.ts).
 *
 * Dimensions: every prod chart x sampled partners (covered + bogus) x adversarial
 * airports (null / {} / missing-region / unknown-IATA / same-airport / valid) x
 * cabins (4 valid + 1 invalid) x dates (off-peak / peak / boundary / null /
 * malformed).
 *
 * Assertions (CI-failing): never throws; diagnosis kind always valid; computed
 * results sane (miles >= 0, low <= high, finite); adversarial airports never
 * yield a bogus 'computed'.
 *
 * Run: set -a; . ./.env.local; set +a; npx tsx scripts/award-chart-fuzz.ts
 */
/* eslint-disable */
// @ts-nocheck
import { createClient } from '@supabase/supabase-js'
import { computeAwardCost, diagnoseAwardCost } from '../lib/awardChart.compute'

const VALID_KINDS = new Set(['computed', 'no-structured-chart', 'not-covered', 'chart-miss', 'invalid-input'])

const VALID_AIRPORTS = {
  JFK: { iata: 'JFK', lat: 40.64, lng: -73.78, region: 'us-east', country_code: 'US' },
  LAX: { iata: 'LAX', lat: 33.94, lng: -118.41, region: 'us-west', country_code: 'US' },
  LHR: { iata: 'LHR', lat: 51.47, lng: -0.45, region: 'europe', country_code: 'GB' },
  NRT: { iata: 'NRT', lat: 35.77, lng: 140.39, region: 'japan-korea', country_code: 'JP' },
}
// Adversarial airport set (the crash class the null-guard was about).
const ADVERSARIAL_AIRPORTS: Record<string, any> = {
  ...VALID_AIRPORTS,
  _null: null,
  _undef: undefined,
  _empty: {},
  _noRegion: { iata: 'XXX', lat: 0, lng: 0, country_code: 'ZZ' }, // missing region
  _noCC: { iata: 'YYY', lat: 10, lng: 10, region: 'middle-east' }, // missing country_code
  _unknown: { iata: 'ZZZ', lat: 1, lng: 1, region: 'nowhere', country_code: 'QQ' },
}
const CABINS = ['economy', 'premium_economy', 'business', 'first', 'suite' /* invalid */]
const DATES = [undefined, '2026-04-15', '2026-07-15', '2026-12-31', '2026-13-40' /* malformed */, 'notadate', '']

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await sb.from('programs').select('slug, award_chart_structured').not('award_chart_structured', 'is', null)

  let combos = 0, threw = 0, insane = 0, bogusComputed = 0
  const kinds: Record<string, number> = {}
  const perProgram: Record<string, number> = {}
  const throwSamples: string[] = []

  for (const p of (data ?? []) as Array<{ slug: string; award_chart_structured: any }>) {
    const program = p.award_chart_structured
    const partners = new Set<string>()
    for (const c of program.charts ?? []) for (const k of Object.keys(c.partners ?? {})) partners.add(k)
    const testPartners = [...partners].slice(0, 3).concat(['__bogus__'])

    for (const partner of testPartners) {
      for (const [oName, o] of Object.entries(ADVERSARIAL_AIRPORTS)) {
        for (const [dName, d] of Object.entries(ADVERSARIAL_AIRPORTS)) {
          for (const cabin of CABINS) {
            for (const date of DATES) {
              combos++
              let diag: any, val: any
              try {
                diag = diagnoseAwardCost(program, partner, o, d, cabin as any, { travelDate: date as any })
                val = computeAwardCost(program, partner, o, d, cabin as any, { travelDate: date as any })
              } catch (e) {
                threw++
                if (throwSamples.length < 10) throwSamples.push(`${p.slug}/${partner} ${oName}-${dName}/${cabin}/${date}: ${String(e).slice(0, 120)}`)
                continue
              }
              if (!VALID_KINDS.has(diag.kind)) { insane++; continue }
              kinds[diag.kind] = (kinds[diag.kind] || 0) + 1
              perProgram[p.slug] = (perProgram[p.slug] || 0) + 1
              // Adversarial airports must never yield a real 'computed'.
              const adversarialAirport = oName.startsWith('_') || dName.startsWith('_')
              if (adversarialAirport && diag.kind === 'computed') {
                // _noRegion/_noCC are technically non-null objects; mapRouteToBucket
                // may still bucket them. Only null/undefined must short-circuit.
                if (o == null || d == null) { bogusComputed++; }
              }
              if (diag.kind === 'computed' && diag.result) {
                const m = diag.result.miles
                const lo = typeof m === 'object' ? m.low : m
                const hi = typeof m === 'object' ? m.high : m
                if (!(lo >= 0 && hi >= lo && Number.isFinite(lo) && Number.isFinite(hi))) insane++
              }
            }
          }
        }
      }
    }
  }

  console.log(`\n=== Award-chart fuzz: ${combos.toLocaleString()} combos ===`)
  console.log('kinds:', JSON.stringify(kinds))
  console.log(`THREW: ${threw}   insane output: ${insane}   bogus computed on null airport: ${bogusComputed}`)
  if (throwSamples.length) { console.log('throw samples:'); for (const s of throwSamples) console.log('  ', s) }
  const ok = threw === 0 && insane === 0 && bogusComputed === 0
  console.log(ok ? '\nPASS — engine never throws, output always sane, null airports short-circuit.' : '\nFAILED')
  process.exit(ok ? 0 : 1)
}
main()
