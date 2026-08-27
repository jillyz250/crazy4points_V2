import type { SupabaseClient } from '@supabase/supabase-js'
import { buildMarqueeSections, type MarqueeListing, type ExperienceGroup } from '@/lib/experiences/marquee'

// Fields the marquee grouping needs. Mirrors the /experiences page query, but
// filtered to listings that actually have a hero image so the home block is
// always photo-rich.
const SELECT =
  'id, title, category, location, format, program_slug, source_platform, points_required, current_bid, minimum_bid, event_date, close_date, detail_url, image_url, featured, first_seen_at'

/**
 * The 3 (default) freshest, US-first, feature-tier experiences that have a real
 * photo — for the homepage Experiences block. Reuses the same grouping/curation
 * as the full /experiences page so a card here reads identically to one there.
 */
export async function getHomeExperiences(supabase: SupabaseClient, limit = 3): Promise<ExperienceGroup[]> {
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
  const { us, intl } = buildMarqueeSections(all)
  // US-first (our audience skews NY), then international; only real photos.
  const pool = [...us, ...intl].filter((g) => g.image_url);

  // Showcase for variety: at most one per program so the trio spans different
  // programs/categories (freshness alone tends to clump one program's batch).
  // Backfill from the remainder if we can't fill `limit` with distinct programs.
  const picked: ExperienceGroup[] = [];
  const usedPrograms = new Set<string>();
  for (const g of pool) {
    const prog = g.program_slug ?? g.key;
    if (usedPrograms.has(prog)) continue;
    usedPrograms.add(prog);
    picked.push(g);
    if (picked.length >= limit) return picked;
  }
  for (const g of pool) {
    if (picked.includes(g)) continue;
    picked.push(g);
    if (picked.length >= limit) break;
  }
  return picked;
}
