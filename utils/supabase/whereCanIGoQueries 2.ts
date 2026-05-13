import type { SupabaseClient } from '@supabase/supabase-js'
import type { PartnerRedemptionWithPrograms, Program, TransferPartnerRow } from '@/utils/supabase/queries'

/**
 * A user's wallet: program slug → miles balance.
 * Stored in localStorage on the client; serialized into URL params for
 * shareability + server-side rendering.
 */
export type Wallet = Record<string, number>

/**
 * Pre-built map of which destination program slugs each transferable
 * currency reaches, plus the ratio. Built once from programs.transfer_partners.
 *
 * Example: { 'amex': [{ to: 'flying_blue', ratio: '1:1' }, ...], ... }
 */
export type TransferGraph = Record<
  string, // source slug (Amex MR, Chase UR, etc.)
  Array<{ to: string; ratio: string | null; notes: string | null }>
>

/**
 * Build the transfer graph by scanning every program's transfer_partners.
 * Reverses the relationship (transfer_partners lists inbound partners; we
 * want outbound paths from each currency).
 */
export async function buildTransferGraph(
  supabase: SupabaseClient,
): Promise<TransferGraph> {
  const { data } = await supabase
    .from('programs')
    .select('slug, transfer_partners')
    .not('transfer_partners', 'is', null)

  const graph: TransferGraph = {}
  for (const p of (data ?? []) as Array<{ slug: string; transfer_partners: TransferPartnerRow[] | null }>) {
    if (!Array.isArray(p.transfer_partners)) continue
    for (const tp of p.transfer_partners) {
      if (!tp.from_slug) continue
      if (!graph[tp.from_slug]) graph[tp.from_slug] = []
      graph[tp.from_slug].push({
        to: p.slug,
        ratio: tp.ratio ?? null,
        notes: tp.notes ?? null,
      })
    }
  }
  return graph
}

/**
 * Given a wallet + transfer graph, compute the "effective balances" — the
 * miles the user could reach in each destination program via direct holding
 * OR via a single 1:1 transfer (for transferable currencies).
 *
 * Multi-hop transfers + non-1:1 ratios are NOT computed for v1 — users get
 * confused if we tell them they "have" 60k Hyatt because they have 60k Bilt.
 * We surface those as "one transfer away" only when a direct redemption is
 * possible.
 */
export interface ReachInfo {
  direct: number // miles the user holds in this program directly
  oneTransferFrom?: { fromSlug: string; ratio: string | null; transferable: number }
}

export function computeReach(
  wallet: Wallet,
  graph: TransferGraph,
  destinationSlug: string,
): ReachInfo {
  const direct = wallet[destinationSlug] ?? 0

  // Find sources in the wallet that can transfer to this destination
  let bestOneTransfer: ReachInfo['oneTransferFrom'] | undefined
  for (const [sourceSlug, balance] of Object.entries(wallet)) {
    if (!balance) continue
    if (sourceSlug === destinationSlug) continue
    const edges = graph[sourceSlug] ?? []
    const edge = edges.find((e) => e.to === destinationSlug)
    if (!edge) continue

    // Parse the ratio (e.g. '1:1' → 1, '60000:25000' → 25000/60000 ≈ 0.42)
    let multiplier = 1
    if (edge.ratio) {
      const m = edge.ratio.match(/(\d+(?:[,.]\d+)?)\s*:\s*(\d+(?:[,.]\d+)?)/)
      if (m) {
        const from = parseFloat(m[1].replace(/,/g, ''))
        const to = parseFloat(m[2].replace(/,/g, ''))
        if (from > 0) multiplier = to / from
      }
    }
    const transferable = Math.floor(balance * multiplier)
    if (!bestOneTransfer || transferable > bestOneTransfer.transferable) {
      bestOneTransfer = { fromSlug: sourceSlug, ratio: edge.ratio, transferable }
    }
  }

  return { direct, oneTransferFrom: bestOneTransfer }
}

/**
 * A scored redemption result for the Where Can My Points Take Me? tool.
 */
export interface WalletRedemption {
  row: PartnerRedemptionWithPrograms
  tier: 'ready' | 'one_transfer_away' | 'unreachable'
  reach: ReachInfo
  miles_needed: number // cheapest cost cell
}

/**
 * Pull all sweet-spot redemptions (rows with availability_reality set to
 * excellent/good — actually bookable) and score them against the user's
 * wallet. Returns rows split into tiers.
 */
export async function getWalletRedemptions(
  supabase: SupabaseClient,
  wallet: Wallet,
  graph: TransferGraph,
): Promise<WalletRedemption[]> {
  const { data } = await supabase
    .from('partner_redemptions')
    .select(`
      *,
      currency_program:programs!partner_redemptions_currency_program_id_fkey(slug, name, alliance),
      operating_carrier:programs!partner_redemptions_operating_carrier_id_fkey(slug, name, alliance)
    `)
    .eq('is_active', true)
    .in('availability_reality', ['excellent', 'good', 'mixed'])
    .not('cost_miles_low', 'is', null)
    .order('cost_miles_low', { ascending: true })

  const rows = (data ?? []) as unknown as PartnerRedemptionWithPrograms[]

  const out: WalletRedemption[] = []
  for (const r of rows) {
    if (!r.currency_program?.slug || r.cost_miles_low == null) continue
    const miles_needed = r.cost_miles_low
    const reach = computeReach(wallet, graph, r.currency_program.slug)

    let tier: WalletRedemption['tier']
    if (reach.direct >= miles_needed) tier = 'ready'
    else if ((reach.oneTransferFrom?.transferable ?? 0) >= miles_needed) tier = 'one_transfer_away'
    else tier = 'unreachable'

    out.push({ row: r, tier, reach, miles_needed })
  }

  return out
}

/**
 * The set of programs we'd ever want to suggest as wallet currencies in
 * the form. Includes the 5 big transferable currencies + airline/hotel
 * programs that have at least one partner_redemption row authored.
 */
export async function getWalletPickerOptions(
  supabase: SupabaseClient,
): Promise<Program[]> {
  // Transferable currencies always show
  const transferableSlugs = ['amex', 'chase', 'citi', 'capital_one', 'bilt']

  const { data: transferable } = await supabase
    .from('programs')
    .select('*')
    .in('slug', transferableSlugs)

  // Plus any airline / hotel / loyalty_program that has a partner_redemption
  // as currency_program (i.e., someone can use it to book something)
  const { data: usedCurrencies } = await supabase
    .from('partner_redemptions')
    .select('currency_program_id')
    .eq('is_active', true)
    .not('currency_program_id', 'is', null)

  const usedIds = new Set((usedCurrencies ?? []).map((r) => r.currency_program_id))

  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .in('type', ['airline', 'hotel', 'loyalty_program'])
    .order('name')

  const seen = new Set<string>()
  const out: Program[] = []
  for (const p of (transferable ?? []) as Program[]) {
    if (seen.has(p.id)) continue
    seen.add(p.id)
    out.push(p)
  }
  for (const p of (programs ?? []) as Program[]) {
    if (seen.has(p.id)) continue
    if (!usedIds.has(p.id)) continue
    seen.add(p.id)
    out.push(p)
  }
  return out
}
