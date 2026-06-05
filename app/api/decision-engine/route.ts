import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { isComingSoon } from '@/components/programs/hyattRegions'

// Strict-AND filter matching. Returns up to 3 destinations, shuffled,
// so re-spinning with the same filters varies the winner.
//
// Each destination is enriched with sample hotels from hotel_properties
// where the property's country matches the destination's country. We
// sample 1-2 per program per destination so a reader sees a variety of
// loyalty options (Hyatt today; Marriott / Hilton / IHG once seeded).
//
// Coming-soon properties are excluded — readers can't book them.
//
// EGRESS: the destinations table and per-country hotel rosters are CACHED
// (daily revalidate) and filtered/sampled in memory, so a spin no longer
// pulls ~1,500 hotel rows from Supabase on every click. The whole per-country
// set is cached, which also fixes a latent bug — the old `.limit(1500)` could
// return an arbitrary slice that missed the spun city's hotels entirely.

type Filters = {
  month?: string | null
  continent?: string | null
  vibe?: string | null
  tripLength?: string | null
  whoIsGoing?: string | null
}

type DestinationRow = {
  title: string
  slug: string
  country: string | null
  continent: string | null
  vibe: string[] | null
  summary_short: string | null
  weather_by_month: Record<string, string> | null
  trip_length: string[] | null
  who_is_going: string[] | null
  image_url: string | null
  advisory_level: number | null
  advisory_url: string | null
  advisory_summary: string | null
}

interface SampleHotel {
  id: string
  name: string
  brand: string | null
  city: string | null
  country: string | null
  category: string | null
  off_peak_points: number | null
  standard_points: number | null
  peak_points: number | null
  hotel_url: string | null
  all_inclusive: boolean
  program_slug: string
  program_name: string
}

interface HotelRowWithProgram {
  id: string
  name: string
  brand: string | null
  city: string | null
  country: string | null
  category: string | null
  off_peak_points: number | null
  standard_points: number | null
  peak_points: number | null
  hotel_url: string | null
  all_inclusive: boolean
  notes: string | null
  programs: { slug: string; name: string } | { slug: string; name: string }[] | null
}

// Max hotels we'll list per program per destination. Two = enough to feel
// substantive without overwhelming when many programs are seeded.
const SAMPLES_PER_PROGRAM = 2

// Continents most US-based readers consider for vacation. Used as the default
// scope when the user hasn't explicitly picked a continent. Level 3/4 advisory
// destinations are always hidden (editorial decision), regardless of filter.
const SAFER_DEFAULT_CONTINENTS = ['north_america', 'central_america', 'caribbean', 'europe']

const DEST_SELECT =
  'title, slug, country, continent, vibe, summary_short, weather_by_month, trip_length, who_is_going, image_url, advisory_level, advisory_url, advisory_summary'
const HOTEL_SELECT =
  'id, name, brand, city, country, category, off_peak_points, standard_points, peak_points, hotel_url, all_inclusive, notes, programs!inner(slug, name)'

// Per-country cache cap. The US has ~4,500 hotels; capping keeps each cache
// entry comfortably under the data-cache size limit (so caching actually
// engages) while covering far more than the old combined 1,500 limit.
const HOTELS_PER_COUNTRY_CAP = 3000

const CACHE_DAY = 86400

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function flattenProgram(programs: HotelRowWithProgram['programs']): { slug: string; name: string } | null {
  if (!programs) return null
  if (Array.isArray(programs)) return programs[0] ?? null
  return programs
}

// --- Cached source reads (the egress fix) ----------------------------------
// Destinations rarely change; cache the whole (small) table once/day and filter
// in memory. Hotels are cached per country once/day so a spin reads from cache
// instead of hitting Supabase. Both use the service-role client (no cookies),
// which is safe inside unstable_cache.

const getCachedDestinations = unstable_cache(
  async (): Promise<DestinationRow[]> => {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('destinations').select(DEST_SELECT)
    if (error) {
      console.error('[decision-engine] destinations fetch failed:', error)
      return []
    }
    return (data ?? []) as DestinationRow[]
  },
  ['de-destinations-v1'],
  { revalidate: CACHE_DAY },
)

function getCachedHotelsForCountry(country: string): Promise<HotelRowWithProgram[]> {
  return unstable_cache(
    async (): Promise<HotelRowWithProgram[]> => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('hotel_properties')
        .select(HOTEL_SELECT)
        .eq('country', country)
        .limit(HOTELS_PER_COUNTRY_CAP)
      if (error) {
        console.error(`[decision-engine] hotels fetch failed for ${country}:`, error)
        return []
      }
      // Pre-filter coming-soon and drop `notes` from the cached payload to keep
      // the entry small (notes is only needed for the coming-soon check).
      return ((data ?? []) as unknown as HotelRowWithProgram[])
        .filter((r) => !isComingSoon(r.notes))
        .map((r) => ({ ...r, notes: null }))
    },
    ['de-hotels-v1', country],
    { revalidate: CACHE_DAY },
  )()
}

function buildSampleHotels(
  destinations: DestinationRow[],
  rows: HotelRowWithProgram[]
): Map<string, SampleHotel[]> {
  // Group all rows by country for fast lookup
  const byCountry = new Map<string, HotelRowWithProgram[]>()
  for (const r of rows) {
    if (!r.country) continue
    if (isComingSoon(r.notes)) continue
    const list = byCountry.get(r.country)
    if (list) list.push(r)
    else byCountry.set(r.country, [r])
  }

  const result = new Map<string, SampleHotel[]>()

  for (const d of destinations) {
    if (!d.country) {
      result.set(d.slug, [])
      continue
    }
    const inCountry = byCountry.get(d.country) ?? []

    // Prefer hotels whose city overlaps with the destination's title
    // (case-insensitive substring match in either direction). Catches
    // both "Raleigh-Durham" (destination) ↔ "Raleigh" (hotel city)
    // patterns. Exact match still wins highest priority.
    const titleLower = d.title.trim().toLowerCase()
    const cityMatched = inCountry.filter((r) => {
      if (!r.city) return false
      const cityLower = r.city.trim().toLowerCase()
      return cityLower === titleLower
        || cityLower.includes(titleLower)
        || titleLower.includes(cityLower)
    })

    // Country-fallback only when the country is small enough that random
    // samples are still likely useful. For huge countries (USA, China,
    // India, etc.), random country-wide samples are noise — a "Raleigh"
    // spin shouldn't return hotels in Chicago + Chesapeake Bay just
    // because they're all in the United States. Cutoff is a heuristic;
    // tune later as more programs seed.
    const COUNTRY_FALLBACK_MAX = 25
    const candidates = cityMatched.length > 0
      ? cityMatched
      : (inCountry.length <= COUNTRY_FALLBACK_MAX ? inCountry : [])

    // Group by program slug, then sample N per program
    const byProgram = new Map<string, HotelRowWithProgram[]>()
    for (const r of candidates) {
      const prog = flattenProgram(r.programs)
      if (!prog) continue
      const list = byProgram.get(prog.slug)
      if (list) list.push(r)
      else byProgram.set(prog.slug, [r])
    }

    const samples: SampleHotel[] = []
    for (const [, list] of byProgram) {
      const picked = shuffle(list).slice(0, SAMPLES_PER_PROGRAM)
      for (const r of picked) {
        const prog = flattenProgram(r.programs)
        if (!prog) continue
        samples.push({
          id:               r.id,
          name:             r.name,
          brand:            r.brand,
          city:             r.city,
          country:          r.country,
          category:         r.category,
          off_peak_points:  r.off_peak_points,
          standard_points:  r.standard_points,
          peak_points:      r.peak_points,
          hotel_url:        r.hotel_url,
          all_inclusive:    r.all_inclusive,
          program_slug:     prog.slug,
          program_name:     prog.name,
        })
      }
    }

    // Sort: by program name first (stable across re-spins), then by points asc
    samples.sort((a, b) => {
      if (a.program_name !== b.program_name) return a.program_name.localeCompare(b.program_name)
      const ap = a.standard_points ?? a.off_peak_points ?? Number.POSITIVE_INFINITY
      const bp = b.standard_points ?? b.off_peak_points ?? Number.POSITIVE_INFINITY
      return ap - bp
    })

    result.set(d.slug, samples)
  }

  return result
}

export async function POST(request: Request) {
  const filters: Filters = await request.json().catch(() => ({}))

  // All destination filtering now happens in memory over the cached table.
  const all = await getCachedDestinations()
  const rows = all.filter((r) => {
    if (filters.continent && r.continent !== filters.continent) return false
    if (filters.vibe && !(r.vibe ?? []).includes(filters.vibe)) return false
    if (filters.tripLength && !(r.trip_length ?? []).includes(filters.tripLength)) return false
    if (filters.whoIsGoing && !(r.who_is_going ?? []).includes(filters.whoIsGoing)) return false
    // Default scope when no continent picked.
    if (!filters.continent && !SAFER_DEFAULT_CONTINENTS.includes(r.continent ?? '')) return false
    // Always hide Level 3/4 advisory destinations.
    if (!(r.advisory_level == null || r.advisory_level < 3)) return false
    // Month: weather must be 'great' or 'good' for the picked month.
    if (filters.month) {
      const w = r.weather_by_month?.[filters.month]
      if (w !== 'great' && w !== 'good') return false
    }
    return true
  })

  const picked = shuffle(rows).slice(0, 3)

  // Hotels enrichment — read each picked country's roster from cache.
  let hotelsByDest = new Map<string, SampleHotel[]>()
  const countries = [...new Set(picked.map((d) => d.country).filter((c): c is string => !!c))]
  if (countries.length > 0) {
    try {
      const hotelArrays = await Promise.all(countries.map((c) => getCachedHotelsForCountry(c)))
      hotelsByDest = buildSampleHotels(picked, hotelArrays.flat())
    } catch (err) {
      console.error('[decision-engine] hotels enrichment failed:', err)
    }
  }

  // Map snake_case → camelCase for the frontend contract
  const destinations = picked.map(r => ({
    title:           r.title,
    slug:            r.slug,
    country:         r.country,
    continent:       r.continent,
    vibe:            r.vibe,
    summary:         r.summary_short,
    weatherByMonth:  r.weather_by_month,
    tripLength:      r.trip_length,
    whoIsGoing:      r.who_is_going,
    imageUrl:        r.image_url,
    advisoryLevel:   r.advisory_level,
    advisoryUrl:     r.advisory_url,
    advisorySummary: r.advisory_summary,
    hotels:          hotelsByDest.get(r.slug) ?? [],
  }))

  return NextResponse.json({ destinations })
}
