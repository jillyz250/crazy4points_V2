import type { SupabaseClient } from '@supabase/supabase-js'
import type { HotelProperty } from '@/utils/supabase/queries'

/**
 * Look up the program id for a given slug. Returns null if not found.
 */
export async function getProgramIdBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('programs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  return (data?.id as string | undefined) ?? null
}

/**
 * Fuzzy-search hotel properties within a program by name or city.
 * Returns up to `limit` matches ordered by alpha on name.
 */
export async function searchProperties(
  supabase: SupabaseClient,
  programId: string,
  query: string,
  limit = 8,
): Promise<HotelProperty[]> {
  const q = query.trim()
  if (!q) return []
  const { data } = await supabase
    .from('hotel_properties')
    .select('*')
    .eq('program_id', programId)
    .or(`name.ilike.%${q}%,city.ilike.%${q}%`)
    .order('name')
    .limit(limit)
  return (data ?? []) as HotelProperty[]
}

/**
 * Pull a single property by id.
 */
export async function getPropertyById(
  supabase: SupabaseClient,
  id: string,
): Promise<HotelProperty | null> {
  const { data } = await supabase
    .from('hotel_properties')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return (data as HotelProperty | null) ?? null
}

/**
 * Find up to `limit` alternative properties in the same program / city /
 * brand whose category or standard_points falls within the cert's
 * envelope. Used when the selected property doesn't fit and we want to
 * surface nearby alternatives.
 */
export async function findAlternatives(
  supabase: SupabaseClient,
  programId: string,
  property: HotelProperty,
  capacity: { matchModel: 'points' | 'category'; maxPoints?: number; maxCategory?: number; topupMax?: number },
  limit = 5,
): Promise<HotelProperty[]> {
  let q = supabase
    .from('hotel_properties')
    .select('*')
    .eq('program_id', programId)
    .neq('id', property.id)
    .order('standard_points', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (property.city) q = q.eq('city', property.city)
  else if (property.country) q = q.eq('country', property.country)

  if (capacity.matchModel === 'category' && capacity.maxCategory != null) {
    // Hyatt categories are strings like '1'..'7' in our schema; lexically
    // safe for single-digit values.
    q = q.lte('category', String(capacity.maxCategory))
  } else if (capacity.matchModel === 'points' && capacity.maxPoints != null) {
    const ceiling = capacity.maxPoints + (capacity.topupMax ?? 0)
    q = q.lte('standard_points', ceiling).not('standard_points', 'is', null)
  }

  const { data } = await q
  return (data ?? []) as HotelProperty[]
}
