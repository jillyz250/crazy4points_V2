#!/usr/bin/env node
/**
 * Tests for lib/awardChart.compute.ts — all 5 chart types + multi-chart walker.
 *
 * Self-contained: duplicates the compute logic in pure JS (same algorithm as
 * the TS file) and runs ~25 hand-verified test routes covering every branch.
 *
 * Run: node scripts/award-chart-compute-tests.mjs
 */

// ─── Inline airport set ───────────────────────────────────────────────────

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

function distanceMiles(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const R = 3958.8
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}

function isUS(a) { return a.country_code === 'US' }

function mapRouteToBucket(a, b) {
  if (isUS(a) && isUS(b)) {
    const d = distanceMiles(a, b)
    if (d < 700)  return 'us-short'
    if (d < 2500) return 'us-medium'
    return 'us-long'
  }
  if (isUS(a) || isUS(b)) {
    const intl  = isUS(a) ? b : a
    const usSide = isUS(a) ? a : b
    if (intl.region === 'europe')       return usSide.lng < -100 ? 'us-eu-west' : 'us-eu-east'
    if (intl.region === 'middle-east')  return 'us-me-india'
    if (intl.region === 'south-america')return 'us-samerica'
    if (intl.region === 'japan-korea')  return 'us-japan'
    if (intl.region === 'se-asia')      return 'us-se-asia'
  }
  return null
}

// ─── Pure-JS compute (mirrors lib/awardChart.compute.ts) ─────────────────

function inPeakWindow(cal, d) {
  if (!d || !cal?.length) return false
  return cal.some((w) => d >= w.start && d <= w.end)
}
function matchOverride(overrides, origin, dest, cabin, season) {
  if (!overrides?.length) return null
  for (const o of overrides) {
    const fwd  = o.from === origin.iata && o.to === dest.iata
    const back = o.bidirectional && o.from === dest.iata && o.to === origin.iata
    if (!(fwd || back)) continue
    if (o.cabin !== cabin) continue
    if (o.season && season && o.season !== season) continue
    return { miles: o.miles, typical: o.miles, exact: true, source: 'override', season: o.season ?? season, notes: o.note }
  }
  return null
}
function fmtKilo(n) { return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n) }
function bandLabel(prevMax, max, cost) { return `${(prevMax + 1).toLocaleString()}–${max.toLocaleString()} mi @ ${fmtKilo(cost)}` }

function computeDistance(chart, partnerSlug, origin, dest, cabin) {
  const p = chart.partners[partnerSlug]; if (!p) return null
  const d = distanceMiles(origin, dest); let prev = 0
  for (const b of p.bands) {
    if (d <= b.max_miles) {
      const c = b.cabin[cabin]; if (c == null) return null
      const final = chart.rt_only ? Math.round(c * (chart.one_way_multiplier ?? 0.5)) : c
      return { miles: final, typical: final, exact: true, source: 'chart', band: bandLabel(prev, b.max_miles, final),
        notes: chart.rt_only ? 'Round-trip-only chart; shown as one-way equivalent.' : undefined }
    }
    prev = b.max_miles
  }
  return null
}
function computeZone(chart, partnerSlug, origin, dest, cabin) {
  const p = chart.partners[partnerSlug]; if (!p) return null
  const bucket = mapRouteToBucket(origin, dest); if (!bucket) return null
  const c = p.matrix[bucket]?.[cabin]; if (c == null) return null
  return { miles: c, typical: c, exact: true, source: 'chart', band: bucket }
}
function computeDpm(chart, partnerSlug, origin, dest, cabin, opts) {
  const p = chart.partners[partnerSlug]; if (!p) return null
  const cal = p.peak_calendar ?? chart.peak_calendar
  const season = inPeakWindow(cal, opts?.travelDate) ? 'peak' : 'off_peak'
  const d = distanceMiles(origin, dest); let prev = 0
  for (const b of p.bands) {
    if (d <= b.max_miles) {
      const c = b[season]?.[cabin]; if (c == null) return null
      const mult = p.multiplier ?? 1.0
      const final = Math.round(c * mult)
      return { miles: final, typical: final, exact: true, source: 'chart', season, band: bandLabel(prev, b.max_miles, final) }
    }
    prev = b.max_miles
  }
  return null
}
function computeDynamic(chart, partnerSlug, origin, dest, cabin) {
  const p = chart.partners[partnerSlug]; if (!p) return null
  if (p.ranges_by_distance?.length) {
    const d = distanceMiles(origin, dest)
    for (const b of p.ranges_by_distance) {
      if (d <= b.max_miles) {
        const pct = b[cabin]; if (!pct) return null
        return { miles: { low: pct.p10, high: pct.p90 }, typical: pct.p50, exact: false, source: 'dynamic_estimate', band: `≤${b.max_miles.toLocaleString()} mi` }
      }
    }
  }
  if (p.ranges_by_bucket) {
    const bucket = mapRouteToBucket(origin, dest); if (!bucket) return null
    const pct = p.ranges_by_bucket[bucket]?.[cabin]; if (!pct) return null
    return { miles: { low: pct.p10, high: pct.p90 }, typical: pct.p50, exact: false, source: 'dynamic_estimate', band: bucket, notes: 'Dynamic pricing — expect the typical figure on most days.' }
  }
  return null
}
function computeFixedRoute(chart, origin, dest, cabin) {
  for (const r of chart.routes) {
    const fwd  = r.from === origin.iata && r.to === dest.iata
    const back = r.bidirectional && r.from === dest.iata && r.to === origin.iata
    if (!(fwd || back)) continue
    const c = r.cabin[cabin]; if (c == null) return null
    return { miles: c, typical: c, exact: true, source: 'chart' }
  }
  return null
}
function chartCoversPartner(chart, partnerSlug) {
  if (chart.type === 'fixed_route') return chart.routes.length > 0
  return partnerSlug in chart.partners
}
function chartAppliesToBucket(chart, bucket) {
  const allowed = chart.applies_to_buckets
  if (!allowed?.length) return true
  if (!bucket) return false
  return allowed.includes(bucket)
}
function computeOne(chart, partnerSlug, origin, dest, cabin, opts) {
  const cal = 'peak_calendar' in chart ? chart.peak_calendar : undefined
  const season = cal ? (inPeakWindow(cal, opts?.travelDate) ? 'peak' : 'off_peak') : undefined
  const ov = matchOverride(chart.overrides, origin, dest, cabin, season)
  if (ov) return ov
  switch (chart.type) {
    case 'distance':                return computeDistance(chart, partnerSlug, origin, dest, cabin)
    case 'zone':                    return computeZone(chart, partnerSlug, origin, dest, cabin)
    case 'distance_plus_modifiers': return computeDpm(chart, partnerSlug, origin, dest, cabin, opts)
    case 'dynamic':                 return computeDynamic(chart, partnerSlug, origin, dest, cabin)
    case 'fixed_route':             return computeFixedRoute(chart, origin, dest, cabin)
  }
}
function computeAwardCost(program, partnerSlug, origin, dest, cabin, opts = {}) {
  if (!program?.charts?.length) return null
  const bucket = mapRouteToBucket(origin, dest)
  for (const chart of program.charts) {
    if (!chartCoversPartner(chart, partnerSlug)) continue
    if (!chartAppliesToBucket(chart, bucket)) continue
    const r = computeOne(chart, partnerSlug, origin, dest, cabin, opts)
    if (r) return r
  }
  return null
}

// ─── Test fixtures ────────────────────────────────────────────────────────

// 1. Pure distance (Etihad-like) — proves us-long Hawaii routes get correctly priced
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
