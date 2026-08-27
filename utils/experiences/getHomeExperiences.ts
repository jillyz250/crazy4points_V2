import type { SupabaseClient } from '@supabase/supabase-js'
import {
  groupExperiences,
  isPointsExperience,
  tierOf,
  marqueeScore,
  type MarqueeListing,
  type ExperienceGroup,
} from '@/lib/experiences/marquee'
import { categoryBucket } from '@/lib/experiences/categories'

// Fields the marquee grouping needs. Mirrors the /experiences page query, but
// filtered to listings that actually have a hero image so the home block is
// always photo-rich.
const SELECT =
  'id, title, category, location, format, program_slug, source_platform, points_required, current_bid, minimum_bid, event_date, close_date, detail_url, image_url, featured, first_seen_at'

/**
 * The homepage's showcase experiences: photo-rich, US-first, and deliberately
 * spread across CATEGORIES (Travel, Music, Sports, Culinary, Culture...) so the
 * homepage advertises the RANGE of what points unlock — not three lookalikes.
 *
 * Selection order:
 *   1. Editorial ⭐ picks first (the same flag that drives /experiences), so one
 *      curation surface feeds both pages.
 *   2. Then fill by category, one per bucket, freshest-first, US-first — so the
 *      set spans distinct categories before it doubles up on any.
 *   3. Backfill from the remainder if we still need more.
 *
 * Decoupled from buildMarqueeSections' top-4 featured cap on purpose: the home
 * grid draws from the whole photographed pool, not just the hero four.
 */
export async function getHomeExperiences(supabase: SupabaseClient, limit = 6): Promise<ExperienceGroup[]> {
  const nowIso = new Date().toISOString()
  const { data } = await supabase
    .from('experience_listings')
    .select(SELECT)
    .eq('status', 'active')
    .not('image_url', 'is', null)
    .or(`close_date.is.null,close_date.gte.${nowIso}`)
    .order('first_seen_at', { ascending: false })
    .limit(300)

  const all = (data ?? []) as MarqueeListing[]
  // Group the real, photographed points experiences (drop the non-experiences).
  const groups = groupExperiences(
    all.filter((l) => isPointsExperience(l) && !!l.image_url && tierOf(l.title) !== 'hide'),
  ).filter((g) => g.image_url)

  // Order the pool: ⭐ featured first, then MOST MARQUEE (so the auto set is
  // exciting, not just cheap/fresh), then US before international (audience skews
  // NY). Freshness is the final tiebreak (query already returned newest-first).
  const pool = groups.sort((a, b) => {
    const fa = a.featured ? 0 : 1
    const fb = b.featured ? 0 : 1
    if (fa !== fb) return fa - fb
    const ms = marqueeScore(b.title, b.category) - marqueeScore(a.title, a.category)
    if (ms !== 0) return ms
    const ra = a.region === 'US' ? 0 : 1
    const rb = b.region === 'US' ? 0 : 1
    return ra - rb
  })

  // First pass: one per CATEGORY bucket, so the set spans distinct categories.
  const picked: ExperienceGroup[] = []
  const usedBuckets = new Set<string>()
  for (const g of pool) {
    const bucket = categoryBucket(g.category)?.key ?? 'uncategorized'
    if (usedBuckets.has(bucket)) continue
    usedBuckets.add(bucket)
    picked.push(g)
    if (picked.length >= limit) return picked
  }
  // Backfill from the remainder (allowing repeat categories) to reach `limit`.
  for (const g of pool) {
    if (picked.includes(g)) continue
    picked.push(g)
    if (picked.length >= limit) break
  }
  return picked
}
