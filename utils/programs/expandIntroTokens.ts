import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Template substitution for program intros.
 *
 * Lets editors write intros that reference live counts from other programs
 * without hardcoding numbers that drift. Tokens are resolved at render time
 * by reading transfer_partners_outbound on the referenced program + joining
 * to programs.type.
 *
 * SUPPORTED TOKENS
 *   {<slug>_airline_count}   — count of airline partners in slug's transfer_partners_outbound
 *   {<slug>_hotel_count}     — count of hotel partners
 *   {<slug>_partner_count}   — total partners (any type)
 *
 * EXAMPLE
 *   Input:  "...usable across {amex_airline_count} airline and {amex_hotel_count} hotel transfer partners."
 *   Output: "...usable across 18 airline and 3 hotel transfer partners."
 *
 * If a token can't be resolved (slug missing, fetch fails), the token is
 * REPLACED WITH AN EMPTY STRING to avoid leaking `{...}` to the public page.
 * Editor sees malformed copy in admin preview and fixes the slug.
 */

const TOKEN_RE = /\{([a-z0-9_-]+)_(airline|hotel|partner)_count\}/g

type ResolvedCounts = {
  airline: number
  hotel: number
  partner: number
}

export async function expandIntroTokens(
  intro: string | null | undefined,
  supabase: SupabaseClient,
): Promise<string> {
  if (!intro) return ''
  const matches = [...intro.matchAll(TOKEN_RE)]
  if (matches.length === 0) return intro

  const neededSlugs = new Set(matches.map((m) => m[1]))
  const counts = new Map<string, ResolvedCounts>()

  // Fetch each referenced program's outbound partners.
  const { data: progRows } = await supabase
    .from('programs')
    .select('slug, transfer_partners_outbound')
    .in('slug', [...neededSlugs])

  // Collect all partner slugs we need to type-check.
  const allPartnerSlugs = new Set<string>()
  const partnersBySlug = new Map<string, string[]>()
  for (const row of (progRows ?? []) as Array<{ slug: string; transfer_partners_outbound: Array<{ from_slug: string }> | null }>) {
    const partners = (row.transfer_partners_outbound ?? []).map((p) => p.from_slug)
    partnersBySlug.set(row.slug, partners)
    for (const p of partners) allPartnerSlugs.add(p)
  }

  // Look up types for every partner slug in one query.
  const typeBySlug = new Map<string, string>()
  if (allPartnerSlugs.size > 0) {
    const { data: typeRows } = await supabase
      .from('programs')
      .select('slug, type')
      .in('slug', [...allPartnerSlugs])
    for (const r of (typeRows ?? []) as Array<{ slug: string; type: string }>) {
      typeBySlug.set(r.slug, r.type)
    }
  }

  // Tally counts per referenced program.
  for (const [slug, partners] of partnersBySlug.entries()) {
    let airline = 0
    let hotel = 0
    for (const p of partners) {
      const t = typeBySlug.get(p)
      // Treat "loyalty_program" as airline-adjacent for count purposes since
      // it's the airline-side loyalty currency (e.g. flying_blue).
      if (t === 'airline' || t === 'loyalty_program') airline += 1
      else if (t === 'hotel') hotel += 1
    }
    counts.set(slug, { airline, hotel, partner: partners.length })
  }

  return intro.replace(TOKEN_RE, (_full, slug: string, kind: string) => {
    const c = counts.get(slug)
    if (!c) return ''
    const key = kind as keyof ResolvedCounts
    return String(c[key])
  })
}
