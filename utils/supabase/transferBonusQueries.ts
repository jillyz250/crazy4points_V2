import type { SupabaseClient } from '@supabase/supabase-js'
import type { Alert, Program } from '@/utils/supabase/queries'
import type { AwardChartProgram, AwardCostResult, Cabin } from '@/lib/awardChart'
import type { RouteBucket } from '@/lib/airports'
import { findAirport } from '@/lib/airports'
import { computeAwardCost, computeBucketTypicalCost } from '@/lib/awardChart.compute'

/**
 * Active transfer-bonus alert + its destination program metadata + any
 * "what breaks this deal" warnings derived from the destination's
 * partner_redemptions rows. The Should I Transfer? tool consumes this.
 */
export interface SweetSpotExample {
  id: string
  cabin: string
  region_or_route: string
  cost_miles_low: number | null
  cost_miles_high: number | null
  operating_carrier: { name: string; slug: string } | null
  currency_program: { name: string; slug: string } | null
  teach_caption: string | null
  /** Phase 3.2: chart-computed cost when destination program has a chart. */
  computed_cost: AwardCostResult | null
  /**
   * True when this example is the curator-pinned marquee redemption for
   * the destination program (Migration 246). Display gets an
   * "EDITOR'S PICK" badge so the reader knows it's the famous one,
   * not just the cheapest active row.
   */
  is_marquee: boolean
  /**
   * One-sentence "why this is the famous one" pitch (Migration 247).
   * Only populated when ALL of: is_marquee=true, marquee_pitch set,
   * AND marquee_pitch_source_url set (Migration 248 source gate).
   * If source URL is missing, pitch is forcibly null — better silent
   * than fabricated. Card falls back to plain "Editor's pick" with no
   * narrative.
   */
  marquee_pitch: string | null
  /** URL backing marquee_pitch claims. Surfaced as a "Source" link. */
  marquee_pitch_source_url: string | null
  // Phase 4 (How to book this disclosure) — narrative fields surfaced inline
  booking_channel: string | null
  bookable_online: boolean | null
  routing_rules: string | null
  non_saver_fallback: string | null
  what_breaks_this: string | null
  fuel_surcharges: 'none' | 'low' | 'high' | null
  cash_fee_low: number | null
  cash_fee_high: number | null
  fees_note: string | null
  requires_saver_space: boolean | null
  availability_reality: 'excellent' | 'good' | 'mixed' | 'rare' | 'unicorn' | null
}

const REDEMPTION_TO_CHART_CABIN: Record<string, Cabin> = {
  'Economy': 'economy',
  'Premium Economy': 'premium_economy',
  'Business': 'business',
  'First': 'first',
}

export interface ActiveTransferBonus {
  alert: Alert
  destinationProgram: Program | null
  warnings: string[]
  examples: SweetSpotExample[]
}

/**
 * Pulls all currently-active transfer_bonus alerts. Currently-active means:
 *   - status = published
 *   - type = transfer_bonus
 *   - end_date is null OR end_date >= today
 *
 * Joins the destination program (primary_program_id) and pulls a small
 * set of "what breaks this deal" warnings from partner_redemptions
 * (rows where the destination is the currency and the row has a
 * what_breaks_this note or high fuel surcharges).
 */
export async function getActiveTransferBonuses(
  supabase: SupabaseClient,
): Promise<ActiveTransferBonus[]> {
  const today = new Date().toISOString().slice(0, 10)

  const { data: alerts, error: alertErr } = await supabase
    .from('alerts')
    .select('*')
    .eq('type', 'transfer_bonus')
    .eq('status', 'published')
    .or(`end_date.gte.${today},end_date.is.null`)
    .order('end_date', { ascending: true, nullsFirst: false })

  if (alertErr) throw alertErr

  const out: ActiveTransferBonus[] = []
  for (const a of (alerts ?? []) as Alert[]) {
    let destinationProgram: Program | null = null
    const warnings: string[] = []

    if (a.primary_program_id) {
      const { data: prog } = await supabase
        .from('programs')
        .select('*')
        .eq('id', a.primary_program_id)
        .maybeSingle()
      destinationProgram = (prog as Program | null) ?? null

      // Collect distinct what_breaks_this warnings from partner_redemptions
      // where this program is the currency (i.e., the user would spend it).
      const { data: warningRows } = await supabase
        .from('partner_redemptions')
        .select('what_breaks_this, fuel_surcharges')
        .eq('currency_program_id', a.primary_program_id)
        .eq('is_active', true)
        .not('what_breaks_this', 'is', null)
        .limit(5)

      const seen = new Set<string>()
      for (const r of warningRows ?? []) {
        if (r.what_breaks_this && !seen.has(r.what_breaks_this)) {
          seen.add(r.what_breaks_this)
          warnings.push(r.what_breaks_this)
        }
      }

      // Plus a fuel-surcharge red flag if the destination has high
      // surcharge rows on any cabin.
      const { count: highSurchargeCount } = await supabase
        .from('partner_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('currency_program_id', a.primary_program_id)
        .eq('fuel_surcharges', 'high')
        .eq('is_active', true)

      if ((highSurchargeCount ?? 0) > 0 && !warnings.some((w) => w.toLowerCase().includes('surcharg'))) {
        warnings.push(
          'High fuel surcharges on long-haul redemptions. Always check the cash co-pay before transferring.',
        )
      }
    }

    // Pull "best of" sweet-spot example for this destination program.
    // Two-pass strategy:
    //   Pass 1 (preferred): high-quality only — easy complexity + good/excellent
    //                       availability, cheapest miles first.
    //   Pass 2 (fallback):  any active row with miles populated, cheapest first.
    // Fallback exists because hub columns (complexity_score, availability_reality)
    // are only backfilled for AA + UA today — other programs would otherwise
    // surface no example at all, which is worse than surfacing the cheapest
    // active row we have.
    const examples: SweetSpotExample[] = []
    // Fetch the destination program's chart + marquee FK once.
    let destinationChart: AwardChartProgram | null = null
    let marqueeRedemptionId: string | null = null
    let marqueePitch: string | null = null
    let marqueePitchSourceUrl: string | null = null
    if (a.primary_program_id) {
      const { data: progRow } = await supabase
        .from('programs')
        .select('award_chart_structured, marquee_redemption_id, marquee_pitch, marquee_pitch_source_url')
        .eq('id', a.primary_program_id)
        .maybeSingle()
      destinationChart = (progRow?.award_chart_structured as AwardChartProgram | null) ?? null
      marqueeRedemptionId = (progRow?.marquee_redemption_id as string | null) ?? null
      const rawPitch = (progRow?.marquee_pitch as string | null) ?? null
      const rawSource = (progRow?.marquee_pitch_source_url as string | null) ?? null
      // Source gate (Migration 248): pitch only renders when source URL is present.
      // Better silent than fabricated.
      if (rawPitch && rawSource) {
        marqueePitch = rawPitch
        marqueePitchSourceUrl = rawSource
      }
    }

    if (a.primary_program_id) {
      const baseSelect = `id, cabin, region_or_route, cost_miles_low, cost_miles_high, teach_caption,
           origin_iata, dest_iata, route_buckets,
           booking_channel, bookable_online, routing_rules, non_saver_fallback,
           what_breaks_this, fuel_surcharges, cash_fee_low, cash_fee_high,
           fees_note, requires_saver_space, availability_reality,
           operating_carrier:programs!partner_redemptions_operating_carrier_id_fkey(name, slug),
           currency_program:programs!partner_redemptions_currency_program_id_fkey(name, slug)`

      // Phase 3 marquee: if curator pinned a marquee redemption for this
      // program, fetch it FIRST so it surfaces in the top sweet spot block
      // regardless of cost. Fills the rest of the 2 slots from cheapest-easy.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rows: any[] = []
      const collectedIds = new Set<string>()

      if (marqueeRedemptionId) {
        const marquee = await supabase
          .from('partner_redemptions')
          .select(baseSelect)
          .eq('id', marqueeRedemptionId)
          .eq('is_active', true)
          .maybeSingle()
        if (marquee.data) {
          rows.push(marquee.data)
          collectedIds.add(marquee.data.id as string)
        }
      }

      const strict = await supabase
        .from('partner_redemptions')
        .select(baseSelect)
        .eq('currency_program_id', a.primary_program_id)
        .eq('is_active', true)
        .eq('complexity_score', 'easy')
        .in('availability_reality', ['excellent', 'good'])
        .not('cost_miles_low', 'is', null)
        .order('cost_miles_low', { ascending: true })
        .limit(2)

      for (const row of strict.data ?? []) {
        if (rows.length >= 2) break
        if (collectedIds.has(row.id as string)) continue
        rows.push(row)
        collectedIds.add(row.id as string)
      }

      if (rows.length === 0) {
        const fallback = await supabase
          .from('partner_redemptions')
          .select(baseSelect)
          .eq('currency_program_id', a.primary_program_id)
          .eq('is_active', true)
          .not('cost_miles_low', 'is', null)
          .order('cost_miles_low', { ascending: true })
          .limit(2)
        rows = fallback.data ?? []
      }

      for (const r of rows) {
        const carrier = Array.isArray(r.operating_carrier)
          ? r.operating_carrier[0]
          : r.operating_carrier
        const carrierSlug = (carrier?.slug as string | undefined) ?? null
        const chartCabin = REDEMPTION_TO_CHART_CABIN[r.cabin as string] ?? 'economy'

        // Phase 3.2: try chart compute. Two paths:
        //   a. If row has origin_iata + dest_iata, do exact route compute.
        //   b. Else, pick the first route_bucket on the row and use
        //      bucket-typical compute (returns matrix cell or band midpoint).
        let computed: AwardCostResult | null = null
        if (destinationChart && carrierSlug) {
          if (r.origin_iata && r.dest_iata) {
            const origin = findAirport(r.origin_iata as string)
            const dest = findAirport(r.dest_iata as string)
            if (origin && dest) {
              computed = computeAwardCost(destinationChart, carrierSlug, origin, dest, chartCabin)
            }
          }
          if (!computed) {
            const buckets = (r.route_buckets as string[] | null) ?? []
            if (buckets.length > 0) {
              computed = computeBucketTypicalCost(
                destinationChart,
                carrierSlug,
                buckets[0] as RouteBucket,
                chartCabin,
              )
            }
          }
        }

        const currency = Array.isArray(r.currency_program)
          ? r.currency_program[0]
          : r.currency_program
        examples.push({
          id: r.id as string,
          cabin: r.cabin as string,
          region_or_route: r.region_or_route as string,
          cost_miles_low: r.cost_miles_low as number | null,
          cost_miles_high: r.cost_miles_high as number | null,
          operating_carrier: carrier
            ? { name: carrier.name as string, slug: carrier.slug as string }
            : null,
          currency_program: currency
            ? { name: currency.name as string, slug: currency.slug as string }
            : null,
          teach_caption: (r.teach_caption as string | null) ?? null,
          computed_cost: computed,
          is_marquee: marqueeRedemptionId === r.id,
          marquee_pitch: marqueeRedemptionId === r.id ? marqueePitch : null,
          marquee_pitch_source_url:
            marqueeRedemptionId === r.id ? marqueePitchSourceUrl : null,
          booking_channel: (r.booking_channel as string | null) ?? null,
          bookable_online: (r.bookable_online as boolean | null) ?? null,
          routing_rules: (r.routing_rules as string | null) ?? null,
          non_saver_fallback: (r.non_saver_fallback as string | null) ?? null,
          what_breaks_this: (r.what_breaks_this as string | null) ?? null,
          fuel_surcharges: r.fuel_surcharges as 'none' | 'low' | 'high' | null,
          cash_fee_low: (r.cash_fee_low as number | null) ?? null,
          cash_fee_high: (r.cash_fee_high as number | null) ?? null,
          fees_note: (r.fees_note as string | null) ?? null,
          requires_saver_space: (r.requires_saver_space as boolean | null) ?? null,
          availability_reality: r.availability_reality as 'excellent' | 'good' | 'mixed' | 'rare' | 'unicorn' | null,
        })
      }
    }

    out.push({
      alert: a,
      destinationProgram,
      warnings: warnings.slice(0, 4),
      examples,
    })
  }

  return out
}

/**
 * Light heuristic to detect the source currency from an alert's title.
 * Used to filter alerts by the user's selected source. Falls back to
 * including the alert when no source can be detected (better visible
 * than missing).
 */
export function detectSourceCurrency(title: string): SourceCurrency | null {
  const t = title.toLowerCase()
  if (/\b(amex|membership rewards|mr)\b/.test(t)) return 'amex'
  if (/\b(chase|ultimate rewards|\bur\b)\b/.test(t)) return 'chase'
  if (/\b(citi|thank ?you|\bty\b)\b/.test(t)) return 'citi'
  if (/\b(capital one|cap one|venture|cap1)\b/.test(t)) return 'capital_one'
  if (/\bbilt\b/.test(t)) return 'bilt'
  if (/\b(marriott|bonvoy)\b/.test(t)) return 'marriott'
  if (/\b(world of hyatt|hyatt)\b/.test(t)) return 'hyatt'
  return null
}

export type SourceCurrency =
  | 'amex'
  | 'chase'
  | 'citi'
  | 'capital_one'
  | 'bilt'
  | 'marriott'
  | 'hyatt'

export const SOURCE_CURRENCIES: { id: SourceCurrency; label: string; short: string }[] = [
  { id: 'amex', label: 'Amex Membership Rewards', short: 'Amex MR' },
  { id: 'chase', label: 'Chase Ultimate Rewards', short: 'Chase UR' },
  { id: 'citi', label: 'Citi ThankYou', short: 'Citi TY' },
  { id: 'capital_one', label: 'Capital One Miles', short: 'Capital One' },
  { id: 'bilt', label: 'Bilt Rewards', short: 'Bilt' },
  { id: 'marriott', label: 'Marriott Bonvoy', short: 'Marriott' },
  { id: 'hyatt', label: 'World of Hyatt', short: 'Hyatt' },
]

/**
 * Source-family → program slugs that ACT AS that family in the transfer
 * graph. Curators sometimes used short slugs ('amex', 'chase') and
 * sometimes long ('amex-membership-rewards', 'chase-ultimate-rewards')
 * — we check both. Used by Don't Sleep to filter sweet spots by which
 * source currencies can reach each row's destination program.
 */
export const SOURCE_FAMILY_SLUGS: Record<SourceCurrency, string[]> = {
  amex: ['amex', 'amex-membership-rewards'],
  chase: ['chase', 'chase-ultimate-rewards'],
  citi: ['citi', 'citi-thankyou', 'citi-thank-you'],
  capital_one: ['capital-one', 'capital-one-miles'],
  bilt: ['bilt', 'bilt-rewards'],
  marriott: ['marriott', 'marriott-bonvoy'],
  hyatt: ['hyatt', 'world-of-hyatt'],
}
