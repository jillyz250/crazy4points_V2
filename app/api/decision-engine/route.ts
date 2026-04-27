import { NextResponse } from 'next/server'
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

    // Group by program slug, then sample N per program
    const byProgram = new Map<string, HotelRowWithProgram[]>()
    for (const r of inCountry) {
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
  const supabase = createAdminClient()

  let query = supabase
    .from('destinations')
    .select('title, slug, country, continent, vibe, summary_short, weather_by_month, trip_length, who_is_going, image_url')

  if (filters.continent)  query = query.eq('continent', filters.continent)
  if (filters.vibe)       query = query.contains('vibe', [filters.vibe])
  if (filters.tripLength) query = query.contains('trip_length', [filters.tripLength])
  if (filters.whoIsGoing) query = query.contains('who_is_going', [filters.whoIsGoing])

  const { data, error } = await query
  if (error) {
    console.error('[decision-engine] query failed:', error)
    return NextResponse.json({ destinations: [], error: error.message }, { status: 500 })
  }

  let rows = (data ?? []) as DestinationRow[]

  // Month filter: weather must be 'great' or 'good' for the picked month.
  // Done in JS because JSONB key filtering via supabase-js is awkward.
  if (filters.month) {
    rows = rows.filter(r => {
      const w = r.weather_by_month?.[filters.month!]
      return w === 'great' || w === 'good'
    })
  }

  const picked = shuffle(rows).slice(0, 3)

  // Hotels enrichment — one query covering all 3 destination countries
  let hotelsByDest = new Map<string, SampleHotel[]>()
  const countries = [...new Set(picked.map((d) => d.country).filter((c): c is string => !!c))]
  if (countries.length > 0) {
    try {
      const { data: hotelRows } = await supabase
        .from('hotel_properties')
        .select(
          'id, name, brand, city, country, category, off_peak_points, standard_points, peak_points, hotel_url, all_inclusive, notes, programs!inner(slug, name)'
        )
        .in('country', countries)
        .limit(1500)
      hotelsByDest = buildSampleHotels(picked, (hotelRows ?? []) as unknown as HotelRowWithProgram[])
    } catch (err) {
      console.error('[decision-engine] hotels enrichment failed:', err)
    }
  }

  // Map snake_case → camelCase for the frontend contract
  const destinations = picked.map(r => ({
    title:          r.title,
    slug:           r.slug,
    country:        r.country,
    continent:      r.continent,
    vibe:           r.vibe,
    summary:        r.summary_short,
    weatherByMonth: r.weather_by_month,
    tripLength:     r.trip_length,
    whoIsGoing:     r.who_is_going,
    imageUrl:       r.image_url,
    hotels:         hotelsByDest.get(r.slug) ?? [],
  }))

  return NextResponse.json({ destinations })
}
