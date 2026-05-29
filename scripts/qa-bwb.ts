/**
 * QA harness for Best Way to Book It.
 * Runs the REAL computeAwardCost against the LIVE DB charts for any route.
 *
 * Usage:
 *   npx tsx scripts/qa-bwb.ts discover JFK CUN Economy   # what COULD price this route (ignores bucket gate)
 *   npx tsx scripts/qa-bwb.ts route JFK CUN Economy       # what the LIVE tool returns (honors route_buckets gate)
 */
import { readFileSync } from 'node:fs'
import { findAirport, mapRouteToBucket, ROUTE_BUCKET_LABELS, distanceMiles, type RouteBucket } from '../lib/airports'
import { computeAwardCost } from '../lib/awardChart.compute'
import type { AwardChartProgram, Cabin } from '../lib/awardChart'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const U = process.env.NEXT_PUBLIC_SUPABASE_URL!, K = process.env.SUPABASE_SERVICE_ROLE_KEY!
const H = { apikey: K, Authorization: `Bearer ${K}` }
const CABIN_MAP: Record<string, Cabin> = { Economy: 'economy', 'Premium Economy': 'premium_economy', Business: 'business', First: 'first' }

async function rest(path: string, params: Record<string, string>) {
  const url = new URL(`${U}/rest/v1/${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const r = await fetch(url, { headers: H })
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`)
  return r.json()
}

async function loadCharts(): Promise<Map<string, AwardChartProgram | null>> {
  const rows = await rest('programs', { select: 'id,slug,award_chart_structured' })
  const byId = new Map<string, AwardChartProgram | null>()
  for (const p of rows) byId.set(p.id, p.award_chart_structured ?? null)
  return byId
}

async function loadRows() {
  return rest('partner_redemptions', {
    select: 'id,cabin,region_or_route,route_buckets,cost_miles_low,cost_miles_high,currency_program_id,operating_carrier_id,is_active,currency_program:programs!partner_redemptions_currency_program_id_fkey(slug,name),operating_carrier:programs!partner_redemptions_operating_carrier_id_fkey(slug,name)',
    is_active: 'eq.true',
  })
}

function fmt(n: number | { low: number; high: number } | null | undefined): string {
  if (n == null) return '—'
  if (typeof n === 'object') return `${Math.round(n.low / 100) / 10}k–${Math.round(n.high / 100) / 10}k`
  return `${Math.round(n / 100) / 10}k`
}

async function main() {
  const [mode, fromI, toI, cabinArg = 'Economy'] = process.argv.slice(2)
  const from = findAirport(fromI), to = findAirport(toI)
  if (!from || !to) { console.error(`unknown airport(s): ${fromI} ${toI}`); process.exit(1) }
  const cabin = cabinArg as keyof typeof CABIN_MAP
  const chartCabin = CABIN_MAP[cabin]
  const bucket = mapRouteToBucket(from, to)
  const dist = distanceMiles(from, to)
  console.log(`\n${from.city} (${from.iata}) -> ${to.city} (${to.iata})  |  ${dist.toLocaleString()} mi  |  bucket=${bucket} (${bucket ? ROUTE_BUCKET_LABELS[bucket as RouteBucket] : 'UNCOVERED'})  |  ${cabin}\n`)
  if (!bucket) { console.log('Route bucket not covered.'); return }

  const charts = await loadCharts()
  const rows = await loadRows()
  const ofCabin = rows.filter((r: any) => r.cabin === cabin)

  if (mode === 'discover') {
    // Ignore route_buckets gate: for every unique (currency,carrier) pair seen
    // in active rows of this cabin, compute the cost for THIS route.
    const seen = new Set<string>()
    const out: any[] = []
    for (const r of ofCabin) {
      const key = `${r.currency_program?.slug}|${r.operating_carrier?.slug}`
      if (seen.has(key)) continue
      seen.add(key)
      const chart = charts.get(r.currency_program_id) ?? null
      const carrier = r.operating_carrier?.slug
      const res = carrier ? computeAwardCost(chart, carrier, from, to, chartCabin) : null
      out.push({
        currency: r.currency_program?.name, carrier: r.operating_carrier?.name,
        computed: res ? fmt(res.miles) : null, src: res?.source ?? '(no chart match)', band: res?.band ?? '',
      })
    }
    out.sort((a, b) => (a.computed ? 0 : 1) - (b.computed ? 0 : 1))
    console.log('DISCOVERY — what each (currency x carrier) pair would price for this exact route:\n')
    for (const o of out) console.log(`  ${o.computed ? '✓' : ' '} ${(o.currency || '?').padEnd(24)} via ${(o.carrier || '-').padEnd(22)} ${(o.computed || '').padStart(7)}  ${o.src}  ${o.band}`)
    return
  }

  // mode === 'route': replicate the live tool (honor route_buckets gate)
  const gated = ofCabin.filter((r: any) => Array.isArray(r.route_buckets) && r.route_buckets.includes(bucket))
  console.log(`LIVE TOOL — ${gated.length} row(s) tagged for bucket ${bucket}:\n`)
  const enriched = gated.map((r: any) => {
    const chart = charts.get(r.currency_program_id) ?? null
    const carrier = r.operating_carrier?.slug
    const res = carrier ? computeAwardCost(chart, carrier, from, to, chartCabin) : null
    const typical = res?.typical ?? ((r.cost_miles_low != null && r.cost_miles_high != null) ? Math.round((r.cost_miles_low + r.cost_miles_high) / 2) : r.cost_miles_low ?? r.cost_miles_high)
    return { r, res, typical }
  })
  // Mirror getRedemptionsForRoute dedup: collapse identical per-band rows,
  // keeping the band whose labeled mileage range contains the route distance.
  const bandMiss = (label: string | null) => {
    if (!label) return Infinity
    const m = label.match(/([\d,]+)\s*[-–]\s*([\d,]+)\s*mi/i)
    if (!m) return Infinity
    const lo = Number(m[1].replace(/,/g, '')), hi = Number(m[2].replace(/,/g, ''))
    if (Number.isNaN(lo) || Number.isNaN(hi)) return Infinity
    if (dist >= lo && dist <= hi) return 0
    return dist < lo ? lo - dist : dist - hi
  }
  const best = new Map<string, typeof enriched[number]>()
  for (const e of enriched) {
    const key = e.res
      ? `c:${e.r.currency_program_id}|${e.r.operating_carrier_id ?? ''}`
      : `s:${e.r.currency_program_id}|${e.r.operating_carrier_id ?? ''}|${e.r.cost_miles_low ?? ''}|${e.r.cost_miles_high ?? ''}`
    const cur = best.get(key)
    if (!cur) { best.set(key, e); continue }
    let prefer: boolean
    if (e.res && cur.res) {
      const mCand = bandMiss(e.r.region_or_route), mCur = bandMiss(cur.r.region_or_route)
      prefer = mCand !== mCur ? mCand < mCur : e.res.typical < cur.res.typical
    } else {
      prefer = (e.typical ?? 9e9) < (cur.typical ?? 9e9)
    }
    if (prefer) best.set(key, e)
  }
  const results = Array.from(best.values()).sort((a, b) => (a.typical ?? 9e9) - (b.typical ?? 9e9))
  for (const { r, res, typical } of results) {
    const shown = res ? fmt(res.miles) : (r.cost_miles_low != null ? `${fmt(r.cost_miles_low)}–${fmt(r.cost_miles_high)}` : '—')
    console.log(`  ${(r.currency_program?.name || '?').padEnd(24)} via ${(r.operating_carrier?.name || '-').padEnd(20)} ${shown.padStart(11)}  [${res ? res.source : 'stored'}] ${r.region_or_route}`)
  }
}
main()
