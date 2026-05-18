/**
 * Experience Programs query — returns every cardholder-exclusive event/dining/
 * access portal that a given card grants entry to.
 *
 * Combines three access patterns:
 *   A. issuer_wide — derived from the card's issuer (Chase Experiences,
 *      Amex Experiences, Citi Entertainment, etc.)
 *   B. loyalty — derived from the card's currency_program (Marriott Bonvoy
 *      Moments, Hyatt FIND, IHG Experiences, etc.)
 *   C. card_specific — junction table (United Card Events, Sapphire Reserved,
 *      By Invitation Only, Resy, Cap One Dining/Lounges)
 *
 * Network-level (Visa Signature Experiences, Mastercard Priceless) is planned
 * for a follow-up once credit_cards.network is added.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface ExperienceProgram {
  id: string
  slug: string
  name: string
  official_url: string
  description: string | null
  category: 'issuer_wide' | 'loyalty' | 'card_specific' | 'network'
  /** For card_specific: access tier (standard / premium / invite_only). Null otherwise. */
  access_tier: 'standard' | 'premium' | 'invite_only' | null
  status: 'active' | 'discontinued' | 'beta'
  /** True when the official_url points at a preview/marketing page and full event
   *  browsing requires cardholder login (Chase Experiences, By Invitation Only,
   *  Resy, Hyatt FIND, etc.). False when the URL is openly browsable (Citi
   *  Entertainment, Capital One Entertainment, BoA Preferred Seating). */
  requires_cardholder_auth: boolean
}

export async function getExperienceProgramsForCard(
  supabase: SupabaseClient,
  card: {
    id: string
    issuer_slug: string | null
    currency_program_slug: string | null
  },
): Promise<ExperienceProgram[]> {
  // Three parallel fetches, dedup at the end (a card could theoretically
  // qualify via more than one path though that's rare).
  const [issuerRes, loyaltyRes, junctionRes] = await Promise.all([
    card.issuer_slug
      ? supabase
          .from('experience_programs')
          .select('id, slug, name, official_url, description, category, status, requires_cardholder_auth')
          .eq('category', 'issuer_wide')
          .eq('issuer_slug', card.issuer_slug)
          .eq('status', 'active')
      : Promise.resolve({ data: [], error: null }),
    card.currency_program_slug
      ? supabase
          .from('experience_programs')
          .select('id, slug, name, official_url, description, category, status, requires_cardholder_auth')
          .eq('category', 'loyalty')
          .eq('currency_program_slug', card.currency_program_slug)
          .eq('status', 'active')
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('credit_card_experience_programs')
      .select('access_tier, experience_programs!inner(id, slug, name, official_url, description, category, status, requires_cardholder_auth)')
      .eq('card_id', card.id)
      .eq('experience_programs.status', 'active'),
  ])

  const out: ExperienceProgram[] = []
  const seen = new Set<string>()

  for (const row of (issuerRes.data ?? []) as Array<Omit<ExperienceProgram, 'access_tier'>>) {
    if (seen.has(row.id)) continue
    seen.add(row.id)
    out.push({ ...row, access_tier: null })
  }
  for (const row of (loyaltyRes.data ?? []) as Array<Omit<ExperienceProgram, 'access_tier'>>) {
    if (seen.has(row.id)) continue
    seen.add(row.id)
    out.push({ ...row, access_tier: null })
  }
  // Supabase's inferred typing collapses the !inner join into an array even
  // though we only ever get a single row per junction entry. Cast through
  // unknown + normalize defensively.
  const junctionRows = (junctionRes.data ?? []) as unknown as Array<{
    access_tier: ExperienceProgram['access_tier']
    experience_programs: Omit<ExperienceProgram, 'access_tier'> | Omit<ExperienceProgram, 'access_tier'>[]
  }>
  for (const row of junctionRows) {
    const ep = row.experience_programs
    const p = Array.isArray(ep) ? ep[0] : ep
    if (!p || seen.has(p.id)) continue
    seen.add(p.id)
    out.push({ ...p, access_tier: row.access_tier })
  }

  return out
}
