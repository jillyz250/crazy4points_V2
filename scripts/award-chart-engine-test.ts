/**
 * Award-chart engine REGRESSION test - 24 hand-verified cases against the REAL
 * TS engine (lib/awardChart.compute), replacing the JS mirror that reimplemented
 * the engine (a drift hazard: it could pass while the real engine broke).
 *
 * Run: npx tsx scripts/award-chart-engine-test.ts
 */
/* eslint-disable */
// @ts-nocheck
import { computeAwardCost } from '../lib/awardChart.compute'

const AIRPORTS = {
  LHR: { iata: 'LHR', lat: 51.4700, lng: -0.4543,  region: 'europe',     country_code: 'GB' },
  CDG: { iata: 'CDG', lat: 49.0097, lng:  2.5479,  region: 'europe',     country_code: 'FR' },
  MAD: { iata: 'MAD', lat: 40.4983, lng: -3.5676,  region: 'europe',     country_code: 'ES' },
  JFK: { iata: 'JFK', lat: 40.6413, lng: -73.7781, region: 'us-east',    country_code: 'US' },
  LAX: { iata: 'LAX', lat: 33.9416, lng:-118.4085, region: 'us-west',    country_code: 'US' },
  ORD: { iata: 'ORD', lat: 41.9742, lng: -87.9073, region: 'us-central', country_code: 'US' },
  HNL: { iata: 'HNL', lat: 21.3245, lng:-157.9251, region: 'us-hawaii',  country_code: 'US' },
  BOS: { iata: 'BOS', lat: 42.3656, lng: -71.0096, region: 'us-east',    country_code: 'US' },
  DOH: { iata: 'DOH', lat: 25.2610, lng:  51.5651, region: 'middle-east',country_code: 'QA' },
  BKK: { iata: 'BKK', lat: 13.6900, lng: 100.7501, region: 'se-asia',    country_code: 'TH' },
  NRT: { iata: 'NRT', lat: 35.7720, lng: 140.3929, region: 'japan-korea',country_code: 'JP' },
  GRU: { iata: 'GRU', lat:-23.4356, lng: -46.4731, region: 'south-america',country_code: 'BR' },
}


const ETIHAD_LIKE = {
  charts: [
    {
      type: 'distance', label: 'Etihad partner chart on AA',
      partners: {
        american_airlines: {
          bands: [
            { max_miles: 650,  cabin: { economy: 4500 } },
            { max_miles: 1000, cabin: { economy: 5500 } },
            { max_miles: 2000, cabin: { economy: 8000 } },
            { max_miles: 3000, cabin: { economy: 11000 } },
            { max_miles: 4500, cabin: { economy: 17500 } },
            { max_miles: 7000, cabin: { economy: 22000, business: 44000 } },
          ],
        },
      },
    },
  ],
}

// 2. Pure distance with rt_only (ANA-like)
const ANA_LIKE = {
  charts: [
    {
      type: 'distance', label: 'ANA RT-only chart',
      rt_only: true, one_way_multiplier: 0.5,
      partners: {
        united: {
          bands: [
            { max_miles: 5000, cabin: { economy: 55000, business: 90000 } },
            { max_miles: 7000, cabin: { economy: 75000, business: 120000 } },
          ],
        },
      },
    },
  ],
}

// 3. Zone (AA-like)
const AA_SAVER_LIKE = {
  charts: [
    {
      type: 'zone', label: 'AA Saver',
      partners: {
        aa: {
          matrix: {
            'us-short':   { economy: 7500,  business: 25000 },
            'us-medium':  { economy: 12500, business: 25000 },
            'us-long':    { economy: 12500, business: 25000 },
            'us-eu-east': { economy: 30000, business: 57500, first: 85000 },
          },
        },
      },
    },
  ],
}

// 4. Multi-chart: AA saver (zone) + AAnytime (dynamic)
const AA_MULTI = {
  charts: [
    {
      type: 'zone', label: 'AA Saver',
      partners: {
        aa: { matrix: {
          'us-medium':  { economy: 12500 },
          'us-long':    { economy: 12500 },
          'us-eu-east': { economy: 30000 },
        } },
      },
    },
    {
      type: 'dynamic', label: 'AA AAnytime',
      partners: {
        aa: { ranges_by_bucket: {
          'us-medium':  { economy: { p10: 20000, p50: 40000, p90: 75000 } },
          'us-long':    { economy: { p10: 25000, p50: 50000, p90: 90000 } },
          'us-eu-east': { economy: { p10: 60000, p50: 110000, p90: 180000 } },
        } },
      },
    },
  ],
}

// 5. distance_plus_modifiers (BA Avios pattern)
const BA_AVIOS_LIKE = {
  charts: [
    {
      type: 'distance_plus_modifiers', label: 'Avios',
      peak_calendar: [{ start: '2026-06-01', end: '2026-09-01' }],
      partners: {
        british_airways: {
          bands: [
            { max_miles: 650,  peak: { economy: 7500 },  off_peak: { economy: 6000 } },
            { max_miles: 4000, peak: { economy: 26000, business: 52000 }, off_peak: { economy: 21000, business: 45000 } },
          ],
        },
      },
      overrides: [
        { from: 'MAD', to: 'JFK', bidirectional: true, cabin: 'business', season: 'off_peak', miles: 34000, note: 'MAD-JFK off-peak unicorn' },
      ],
    },
  ],
}

// 6. fixed_route (Caribbean-like)
const CARIBBEAN_LIKE = {
  charts: [
    {
      type: 'fixed_route', label: 'Caribbean flat',
      routes: [
        { from: 'JFK', to: 'POS', bidirectional: true, cabin: { economy: 15000 } },
      ],
    },
  ],
}

// 8. Bucket-scoped multi-region (Aeroplan-style)
const AEROPLAN_LIKE = {
  charts: [
    {
      type: 'distance', label: 'NA',
      applies_to_buckets: ['us-short', 'us-medium', 'us-long'],
      partners: {
        united: { bands: [
          { max_miles: 500,  cabin: { economy: 6000  } },
          { max_miles: 2750, cabin: { economy: 12500 } },
          { max_miles: 6000, cabin: { economy: 25000 } },
        ]},
      },
    },
    {
      type: 'distance', label: 'Atlantic',
      applies_to_buckets: ['us-eu-east', 'us-eu-west', 'us-me-india', 'us-africa'],
      partners: {
        united: { bands: [
          { max_miles: 4000, cabin: { economy: 35000, business: 60000 } },
          { max_miles: 6000, cabin: { economy: 40000, business: 70000 } },
        ]},
      },
    },
    {
      type: 'distance', label: 'Pacific',
      applies_to_buckets: ['us-japan', 'us-se-asia', 'us-pacific'],
      partners: {
        united: { bands: [
          { max_miles: 6000,  cabin: { economy: 35000, business: 75000 } },
          { max_miles: 10000, cabin: { economy: 45000, business: 75000 } },
        ]},
      },
    },
  ],
}

// 7. dynamic ranges_by_distance (finer-grained United)
const UNITED_FINE = {
  charts: [
    {
      type: 'dynamic', label: 'United fine-grain',
      partners: {
        united: {
          ranges_by_distance: [
            { max_miles: 700,  economy: { p10: 5000, p50: 10000, p90: 20000 } },
            { max_miles: 2500, economy: { p10: 8000, p50: 18000, p90: 35000 } },
            { max_miles: 5000, economy: { p10: 22000, p50: 35000, p90: 60000 } },
          ],
        },
      },
    },
  ],
}

// ─── Tests ────────────────────────────────────────────────────────────────


const TESTS = [
  // 1-3: Distance (Etihad on AA) — THE BUG FIX
  { id: 1,  desc: 'Etihad/AA short Y',           program: ETIHAD_LIKE,    partner: 'american_airlines', from: 'JFK', to: 'BOS', cabin: 'economy',  expect: 4500 },
  { id: 2,  desc: 'Etihad/AA transcon Y',        program: ETIHAD_LIKE,    partner: 'american_airlines', from: 'JFK', to: 'LAX', cabin: 'economy',  expect: 11000 },
  { id: 3,  desc: 'Etihad/AA Hawaii Y (THE BUG)',program: ETIHAD_LIKE,    partner: 'american_airlines', from: 'JFK', to: 'HNL', cabin: 'economy',  expect: 22000 },
  { id: 4,  desc: 'Etihad/AA Hawaii J',          program: ETIHAD_LIKE,    partner: 'american_airlines', from: 'JFK', to: 'HNL', cabin: 'business', expect: 44000 },
  // 5-6: rt_only (ANA on UA)
  { id: 5,  desc: 'ANA/UA Asia Y one-way equiv', program: ANA_LIKE,       partner: 'united',            from: 'LAX', to: 'NRT', cabin: 'economy',  expect: 37500 }, // 75000 * 0.5
  { id: 6,  desc: 'ANA/UA Asia J one-way equiv', program: ANA_LIKE,       partner: 'united',            from: 'LAX', to: 'NRT', cabin: 'business', expect: 60000 }, // 120000 * 0.5
  // 7-9: Zone (AA Saver)
  { id: 7,  desc: 'AA Saver transcon Y',         program: AA_SAVER_LIKE,  partner: 'aa',                from: 'JFK', to: 'LAX', cabin: 'economy',  expect: 12500 },
  { id: 8,  desc: 'AA Saver US-EU Y',            program: AA_SAVER_LIKE,  partner: 'aa',                from: 'JFK', to: 'LHR', cabin: 'economy',  expect: 30000 },
  { id: 9,  desc: 'AA Saver US-EU F',            program: AA_SAVER_LIKE,  partner: 'aa',                from: 'JFK', to: 'LHR', cabin: 'first',    expect: 85000 },
  // 10-11: Multi-chart walker (AA saver wins because listed first)
  { id: 10, desc: 'AA multi: saver wins (Y)',    program: AA_MULTI,       partner: 'aa',                from: 'JFK', to: 'LAX', cabin: 'economy',  expect: 12500 },
  { id: 11, desc: 'AA multi: saver wins (Y) US-EU', program: AA_MULTI,    partner: 'aa',                from: 'JFK', to: 'LHR', cabin: 'economy',  expect: 30000 },
  // 12-14: DPM (Avios) — sanity from pilot
  { id: 12, desc: 'BA Y transatlantic off-peak', program: BA_AVIOS_LIKE,  partner: 'british_airways',   from: 'LHR', to: 'JFK', cabin: 'economy',  expect: 21000, date: '2026-04-15' },
  { id: 13, desc: 'BA Y transatlantic peak',     program: BA_AVIOS_LIKE,  partner: 'british_airways',   from: 'LHR', to: 'JFK', cabin: 'economy',  expect: 26000, date: '2026-07-15' },
  { id: 14, desc: 'BA override MAD-JFK J off',   program: BA_AVIOS_LIKE,  partner: 'british_airways',   from: 'MAD', to: 'JFK', cabin: 'business', expect: 34000, date: '2026-04-15' },
  // 15-16: fixed_route
  { id: 15, desc: 'Caribbean JFK-POS Y',         program: CARIBBEAN_LIKE, partner: 'caribbean_airlines', from: 'JFK', to: 'POS', cabin: 'economy',  expect: 15000, addAirport: { POS: { iata: 'POS', lat: 10.5854, lng: -61.3372, region: 'mexico-carib', country_code: 'TT' } } },
  { id: 16, desc: 'Caribbean POS-JFK Y (bidir)', program: CARIBBEAN_LIKE, partner: 'caribbean_airlines', from: 'POS', to: 'JFK', cabin: 'economy',  expect: 15000, addAirport: { POS: { iata: 'POS', lat: 10.5854, lng: -61.3372, region: 'mexico-carib', country_code: 'TT' } } },
  // 17-19: Dynamic — typical sort-key + range output
  { id: 17, desc: 'UA fine: short Y typical',    program: UNITED_FINE,    partner: 'united',            from: 'JFK', to: 'BOS', cabin: 'economy',  expectTypical: 10000 },
  { id: 18, desc: 'UA fine: transcon Y typical', program: UNITED_FINE,    partner: 'united',            from: 'JFK', to: 'LAX', cabin: 'economy',  expectTypical: 18000 },
  { id: 19, desc: 'UA fine: transcon Y range',   program: UNITED_FINE,    partner: 'united',            from: 'JFK', to: 'LAX', cabin: 'economy',  expectRange: { low: 8000, high: 35000 } },
  // 20: no chart matches → null
  { id: 20, desc: 'No matching partner → null',  program: ETIHAD_LIKE,    partner: 'unknown_carrier',    from: 'JFK', to: 'LAX', cabin: 'economy',  expectNull: true },

  // 21-24: bucket-scoped charts (v1.1 — Aeroplan-style multi-region)
  { id: 21, desc: 'AeroplanLike NA transcon Y (NA chart wins)',  program: AEROPLAN_LIKE, partner: 'united', from: 'JFK', to: 'LAX', cabin: 'economy', expect: 12500 },
  { id: 22, desc: 'AeroplanLike US-EU Y (Atlantic wins)',        program: AEROPLAN_LIKE, partner: 'united', from: 'JFK', to: 'LHR', cabin: 'economy', expect: 35000 },
  { id: 23, desc: 'AeroplanLike US-Asia Y (Pacific wins)',       program: AEROPLAN_LIKE, partner: 'united', from: 'LAX', to: 'NRT', cabin: 'economy', expect: 35000 },
  { id: 24, desc: 'AeroplanLike US-Asia J (Pacific J)',          program: AEROPLAN_LIKE, partner: 'united', from: 'LAX', to: 'NRT', cabin: 'business', expect: 75000 },
]

// ─── Runner ───────────────────────────────────────────────────────────────


function run() {
  console.log('\n=== Award Chart Compute — Phase 1 tests ===\n')
  let pass = 0, fail = 0
  const fails = []

  for (const t of TESTS) {
    const airports = { ...AIRPORTS, ...(t.addAirport ?? {}) }
    const origin = airports[t.from]
    const dest   = airports[t.to]
    if (!origin || !dest) { console.log(`#${t.id} SKIP — missing airport`); fail++; fails.push({ ...t, got: 'missing airport' }); continue }

    const result = computeAwardCost(t.program, t.partner, origin, dest, t.cabin, { travelDate: t.date })

    let ok = false
    let summary = ''
    if (t.expectNull) {
      ok = result === null
      summary = `expect null, got ${result === null ? 'null' : JSON.stringify(result.miles)}`
    } else if (t.expectTypical !== undefined) {
      ok = result?.typical === t.expectTypical
      summary = `expect typical ${t.expectTypical}, got ${result?.typical}`
    } else if (t.expectRange) {
      ok = result && typeof result.miles === 'object' && result.miles.low === t.expectRange.low && result.miles.high === t.expectRange.high
      summary = `expect range ${t.expectRange.low}-${t.expectRange.high}, got ${result?.miles && typeof result.miles === 'object' ? `${result.miles.low}-${result.miles.high}` : result?.miles}`
    } else {
      ok = result?.miles === t.expect
      summary = `expect ${t.expect}, got ${result?.miles}`
    }

    const status = ok ? '✓ PASS' : '✗ FAIL'
    console.log(`#${String(t.id).padStart(2)}  ${status}  ${t.desc.padEnd(40)} | ${summary}`)
    if (!ok) { fails.push({ ...t, got: result }); fail++ } else pass++
  }

  console.log(`\nResults: ${pass} pass / ${fail} fail (of ${TESTS.length})`)
  if (fail > 0) {
    console.log('\nFailures:')
    for (const f of fails) console.log(`  #${f.id}  ${f.desc}\n        result: ${JSON.stringify(f.got)}`)
    process.exit(1)
  } else {
    console.log('\n✓ All branches passing — compute is ready for Phase 2 chart authoring.')
  }
}

run()
