/**
 * Builds a compact, prompt-friendly reference string from `hotel_properties`
 * for use as authoritative fact-check grounding.
 *
 * Only emits rows the draft actually mentions (substring match on name) to
 * keep token cost flat. Programs with thousands of properties don't blow
 * up the prompt unless the draft names a property by name.
 *
 * Returns null when:
 *   - The program isn't a hotel
 *   - The program has no rows in hotel_properties
 *   - No property name appears in the draft text
 *
 * Used by `verifyAlertDraft` (and callers of it) to surface contradictions
 * like "Park Hyatt Tokyo is Cat 8" when the DB says Cat 7.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { HotelProperty } from '@/utils/supabase/queries'
import { getPropertiesForProgram } from '@/utils/supabase/queries'

/**
 * Pull every hotel_properties row for a program. Returns [] when the program
 * is not type='hotel' (avoids spending a query on airlines that will never
 * have property rows).
 */
async function loadHotelProperties(
  supabase: SupabaseClient,
  programId: string
): Promise<HotelProperty[]> {
  const { data: program, error } = await supabase
    .from('programs')
    .select('type')
    .eq('id', programId)
    .maybeSingle()
  if (error || !program || program.type !== 'hotel') return []
  return getPropertiesForProgram(supabase, programId)
}

/**
 * Filter properties to those the draft text mentions by name (case-insensitive
 * substring). Skips any with a name shorter than 6 characters to avoid false
 * positives on common words. (E.g. a property literally named "Hyatt" — there
 * is one — would match every Hyatt mention.)
 */
function filterMentionedProperties(
  draftText: string,
  properties: HotelProperty[]
): HotelProperty[] {
  const lower = draftText.toLowerCase()
  return properties.filter((p) => {
    if (p.name.length < 6) return false
    return lower.includes(p.name.toLowerCase())
  })
}

/**
 * Format a property as one compact reference line for the prompt. Skips
 * blank fields; format is roughly:
 *   "Park Hyatt Tokyo — Cat 7 — Tokyo, Japan — 25K/30K/35K"
 *
 * Brand isn't included because the name almost always already starts with
 * it; region is dropped in favor of city/country which is more useful.
 */
function formatPropertyLine(p: HotelProperty): string {
  const parts: string[] = [p.name]
  parts.push(`Cat ${p.category ?? '?'}`)
  const loc = [p.city, p.country].filter(Boolean).join(', ')
  if (loc) parts.push(loc)
  if (p.off_peak_points && p.standard_points && p.peak_points) {
    const k = (n: number) => `${Math.round(n / 1000)}K`
    parts.push(`${k(p.off_peak_points)}/${k(p.standard_points)}/${k(p.peak_points)}`)
  }
  if (p.all_inclusive) parts.push('all-inclusive')
  return parts.join(' — ')
}

/**
 * Build a reference block to inject into the fact-check prompt. Returns null
 * when nothing should be injected (non-hotel program, no rows, no matches).
 *
 * The draft text passed in should be title + summary + description joined,
 * so the substring match catches mentions anywhere in the draft.
 */
export async function buildProgramReferenceForDraft(
  supabase: SupabaseClient,
  programId: string | null,
  draftText: string
): Promise<string | null> {
  if (!programId) return null
  const all = await loadHotelProperties(supabase, programId)
  if (all.length === 0) return null
  const matched = filterMentionedProperties(draftText, all)
  if (matched.length === 0) return null
  return matched.map(formatPropertyLine).join('\n')
}
