import type { SupabaseClient } from '@supabase/supabase-js'
import type { Program, Alert, TransferPartnerRow } from '@/utils/supabase/queries'
import { isBonusActive } from '@/utils/programs/transferBonus'

export type EarnSortMode = 'fastest' | 'cheapest' | 'easiest'

/**
 * One earn-path option — direct co-brand card SUB, transferable-points
 * inbound, or an active transfer-bonus alert.
 */
export type EarnOption =
  | {
      kind: 'co_brand_card'
      cardId: string
      cardName: string
      issuerName: string | null
      welcomeBonusMiles: number | null
      welcomeBonusSpendReq: number | null
      annualFee: number | null
      affiliateUrl: string | null
      slug: string | null
    }
  | {
      kind: 'transferable_inbound'
      fromProgramName: string
      fromProgramSlug: string
      ratio: string | null
      notes: string | null
      bonusActive: boolean | null
    }
  | {
      kind: 'transfer_bonus'
      alert: Alert
      bonusPct: number | null
      endDate: string | null
    }

/**
 * Pull every meaningful path to earn miles in the target program:
 *   1. Co-brand cards (credit_cards.co_brand_program_id = target)
 *   2. Transferable currencies inbound (target's transfer_partners JSON)
 *   3. Active transfer-bonus alerts where target is primary_program_id
 */
export async function getEarnPathOptions(
  supabase: SupabaseClient,
  target: Program,
): Promise<EarnOption[]> {
  const out: EarnOption[] = []

  // 1. Direct co-brand cards
  const { data: cards } = await supabase
    .from('credit_cards')
    .select(`
      id, name, slug, annual_fee, affiliate_url,
      issuer:issuers(name),
      welcome_bonus:credit_card_welcome_bonuses(bonus_amount, spend_requirement, end_date)
    `)
    .eq('co_brand_program_id', target.id)
    .eq('is_active', true)
    .limit(20)

  for (const c of (cards ?? []) as unknown as Array<{
    id: string
    name: string
    slug: string | null
    annual_fee: number | null
    affiliate_url: string | null
    issuer: { name: string } | { name: string }[] | null
    welcome_bonus: Array<{ bonus_amount: number | null; spend_requirement: number | null; end_date: string | null }> | null
  }>) {
    const wb = c.welcome_bonus?.[0]
    const issuerObj = Array.isArray(c.issuer) ? c.issuer[0] : c.issuer
    out.push({
      kind: 'co_brand_card',
      cardId: c.id,
      cardName: c.name,
      issuerName: issuerObj?.name ?? null,
      welcomeBonusMiles: wb?.bonus_amount ?? null,
      welcomeBonusSpendReq: wb?.spend_requirement ?? null,
      annualFee: c.annual_fee,
      affiliateUrl: c.affiliate_url,
      slug: c.slug,
    })
  }

  // 2. Transferable inbound (the target's transfer_partners JSON)
  if (Array.isArray(target.transfer_partners)) {
    for (const tp of target.transfer_partners as TransferPartnerRow[]) {
      // Look up the from_slug program's name for nicer display
      let fromName = tp.from_slug
      if (tp.from_slug) {
        const { data: fromProg } = await supabase
          .from('programs')
          .select('name')
          .eq('slug', tp.from_slug)
          .maybeSingle()
        if (fromProg?.name) fromName = fromProg.name
      }
      out.push({
        kind: 'transferable_inbound',
        fromProgramName: fromName,
        fromProgramSlug: tp.from_slug,
        ratio: tp.ratio ?? null,
        notes: tp.notes ?? null,
        bonusActive: isBonusActive(tp),
      })
    }
  }

  // 3. Active transfer-bonus alerts ending at this program
  const today = new Date().toISOString().slice(0, 10)
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('type', 'transfer_bonus')
    .eq('status', 'published')
    .eq('primary_program_id', target.id)
    .or(`end_date.gte.${today},end_date.is.null`)

  for (const a of (alerts ?? []) as Alert[]) {
    const m = a.title.match(/(\d{1,3})%/)
    const bonusPct = m ? parseInt(m[1], 10) : null
    out.push({
      kind: 'transfer_bonus',
      alert: a,
      bonusPct: isNaN(bonusPct ?? NaN) ? null : bonusPct,
      endDate: a.end_date,
    })
  }

  return out
}

/**
 * Reorder/filter options by the user's selected mode.
 *   - fastest: transfer bonuses + instant transfers up top; cards last
 *   - cheapest: 1:1 ratios + no-AF cards up top
 *   - easiest: transferable inbounds first (single-step), cards last
 */
export function sortEarnOptions(
  options: EarnOption[],
  mode: EarnSortMode,
): EarnOption[] {
  const sorted = [...options]
  if (mode === 'fastest') {
    sorted.sort((a, b) => {
      const score = (o: EarnOption): number => {
        if (o.kind === 'transfer_bonus') return 0
        if (o.kind === 'transferable_inbound') return 1
        return 2 // cards last (SUB requires spend + approval time)
      }
      return score(a) - score(b)
    })
  } else if (mode === 'cheapest') {
    sorted.sort((a, b) => {
      const score = (o: EarnOption): number => {
        if (o.kind === 'transferable_inbound' && o.ratio === '1:1') return 0
        if (o.kind === 'transfer_bonus') return 1
        if (o.kind === 'co_brand_card' && (o.annualFee ?? 0) === 0) return 2
        if (o.kind === 'transferable_inbound') return 3
        return 4
      }
      return score(a) - score(b)
    })
  } else {
    // easiest = single-step transfers first, then bonuses, then cards
    sorted.sort((a, b) => {
      const score = (o: EarnOption): number => {
        if (o.kind === 'transferable_inbound') return 0
        if (o.kind === 'transfer_bonus') return 1
        return 2
      }
      return score(a) - score(b)
    })
  }
  return sorted
}

/**
 * Programs that are actually earnable — only include those with at least
 * one co-brand card OR at least one transfer partner. Used to populate
 * the target-currency picker.
 */
export async function getEarnableTargets(
  supabase: SupabaseClient,
): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .in('type', ['airline', 'hotel', 'loyalty_program'])
    .order('name')
  if (error) throw error
  const all = (data ?? []) as Program[]
  return all.filter((p) => {
    const tpCount = Array.isArray(p.transfer_partners) ? p.transfer_partners.length : 0
    return tpCount > 0
  })
}
