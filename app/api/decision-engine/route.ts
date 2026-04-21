import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

// Strict-AND filter matching. Returns up to 3 destinations, shuffled,
// so re-spinning with the same filters varies the winner.

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
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function POST(request: Request) {
  const filters: Filters = await request.json().catch(() => ({}))
  const supabase = createAdminClient()

  let query = supabase
    .from('destinations')
    .select('title, slug, country, continent, vibe, summary_short, weather_by_month, trip_length, who_is_going')

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
  }))

  return NextResponse.json({ destinations })
}
