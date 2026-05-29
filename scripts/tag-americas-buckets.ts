/**
 * Real fix (Phase 2) for US <-> Mexico/Caribbean, Central America, Canada.
 *
 * Strategy — ZERO fabricated numbers:
 *   1. Extend the Atmos "Americas region" distance chart's applies_to_buckets
 *      to include the three new buckets (Alaska prices the whole Americas by
 *      distance — verified-correct).
 *   2. Tag the route_buckets of every ACTIVE partner_redemptions row whose
 *      currency program has a DISTANCE-based chart that computes a valid price
 *      for a representative route in each new region AND whose operating
 *      carrier actually serves that region. Distance charts are country-
 *      agnostic, so the displayed cost recomputes correctly per route.
 *
 * Pass --apply to write; default is dry-run.
 */
import { readFileSync } from 'node:fs'
import { findAirport } from '../lib/airports'
import { computeAwardCost } from '../lib/awardChart.compute'
import type { AwardChartProgram } from '../lib/awardChart'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const U = process.env.NEXT_PUBLIC_SUPABASE_URL!, K = process.env.SUPABASE_SERVICE_ROLE_KEY!
const H = { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json' }
const APPLY = process.argv.includes('--apply')

// Operating carriers that actually serve each region (so the row is bookable).
// We only tag rows whose operating carrier flies the region. American + Alaska
// + United + Copa are the realistic Americas operators among our partners.
const REGION_CARRIERS: Record<string, Set<string>> = {
  'us-mexico-carib': new Set(['aa', 'alaska-airlines', 'united', 'caribbean-airlines', 'copa']),
  'us-camerica':     new Set(['aa', 'united', 'copa']),
  'us-canada':       new Set(['aa', 'alaska-airlines', 'united', 'air-canada']),
}
// Representative route per region (real airports) to test that the chart yields
// a distance-based price for that region.
const PROBE: Record<string, [string, string]> = {
  'us-mexico-carib': ['JFK', 'CUN'],
  'us-camerica':     ['MIA', 'SJO'], // Miami -> San Jose, Costa Rica
  'us-canada':       ['JFK', 'YYZ'], // New York -> Toronto
}

async function rest(method: string, path: string, params: Record<string, string>, body?: unknown) {
  const url = new URL(`${U}/rest/v1/${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const r = await fetch(url, { method, headers: { ...H, Prefer: 'return=representation' }, body: body ? JSON.stringify(body) : undefined })
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status}: ${await r.text()}`)
  return r.json()
}

async function main() {
  const programs = await rest('GET', 'programs', { select: 'id,slug,award_chart_structured' })
  const chartById = new Map<string, AwardChartProgram | null>()
  for (const p of programs) chartById.set(p.id, p.award_chart_structured ?? null)

  // ── Step 1: extend Atmos Americas chart applies_to_buckets ───────────────
  const atmos = programs.find((p: any) => p.slug === 'atmos')
  if (atmos?.award_chart_structured?.charts) {
    const chart = atmos.award_chart_structured as AwardChartProgram
    let touched = false
    for (const c of chart.charts as any[]) {
      if (Array.isArray(c.applies_to_buckets) && c.applies_to_buckets.includes('us-samerica')) {
        for (const b of ['us-mexico-carib', 'us-camerica', 'us-canada']) {
          if (!c.applies_to_buckets.includes(b)) { c.applies_to_buckets.push(b); touched = true }
        }
        console.log(`Atmos chart "${c.label}" applies_to_buckets -> ${JSON.stringify(c.applies_to_buckets)}`)
      }
    }
    if (touched && APPLY) {
      await rest('PATCH', 'programs', { id: `eq.${atmos.id}` }, { award_chart_structured: chart })
      console.log('  [APPLIED] Atmos chart updated\n')
    } else console.log(`  [${APPLY ? 'no change' : 'dry-run'}]\n`)
  }

  // ── Step 2: tag distance-computing rows onto the new buckets ─────────────
  const rows = await rest('GET', 'partner_redemptions', {
    select: 'id,cabin,region_or_route,route_buckets,currency_program_id,operating_carrier:programs!partner_redemptions_operating_carrier_id_fkey(slug,name),currency_program:programs!partner_redemptions_currency_program_id_fkey(slug,name)',
    is_active: 'eq.true',
  })

  let planned = 0
  for (const r of rows) {
    const carrier = r.operating_carrier?.slug
    if (!carrier) continue
    const chart = chartById.get(r.currency_program_id) ?? null
    if (!chart) continue
    const current: string[] = Array.isArray(r.route_buckets) ? r.route_buckets : []
    const toAdd: string[] = []
    for (const bucket of ['us-mexico-carib', 'us-camerica', 'us-canada']) {
      if (current.includes(bucket)) continue
      if (!REGION_CARRIERS[bucket].has(carrier)) continue
      const [oi, di] = PROBE[bucket]
      const o = findAirport(oi)!, d = findAirport(di)!
      const cabin = ({ Economy: 'economy', 'Premium Economy': 'premium_economy', Business: 'business', First: 'first' } as const)[r.cabin as 'Economy']
      const res = computeAwardCost(chart, carrier, o, d, cabin)
      if (res && res.source === 'chart') toAdd.push(bucket) // only distance/zone exact chart hits
    }
    if (toAdd.length) {
      planned++
      const next = [...current, ...toAdd]
      console.log(`  +${toAdd.join(',').padEnd(40)} ${r.cabin.padEnd(16)} ${(r.currency_program?.name||'?')} via ${(r.operating_carrier?.name||'-')}  [${r.region_or_route}]`)
      if (APPLY) await rest('PATCH', 'partner_redemptions', { id: `eq.${r.id}` }, { route_buckets: next })
    }
  }
  console.log(`\n${planned} row(s) ${APPLY ? 'updated' : 'to update (dry-run; pass --apply)'}.`)
}
main()
