import { NextRequest, NextResponse } from 'next/server'
import { sanityFetch } from '@/lib/sanityClient'

type SanityDestination = {
  title: string
  slug: string
  country: string | null
  continent: string | null
  vibe: string[] | null
  summary: string | null
  tripLength: string[] | null
  whoIsGoing: string[] | null
  weatherByMonth: Record<string, string> | null
}

type ResultDestination = {
  title: string
  slug: string
  country: string | null
  continent: string | null
  vibe: string[] | null
  summary: string | null
  weatherByMonth: Record<string, string> | null
  tripLength: string[] | null
  whoIsGoing: string[] | null
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { month, continent, vibe, tripLength, whoIsGoing } = body as {
      month?: string
      continent?: string
      vibe?: string
      tripLength?: string
      whoIsGoing?: string
    }

    const all = await sanityFetch<SanityDestination[]>(
      `*[_type == "destination"]{
        title,
        "slug": slug.current,
        country,
        continent,
        vibe,
        summary,
        tripLength,
        whoIsGoing,
        weatherByMonth
      }`
    )

    if (!all || all.length === 0) {
      return NextResponse.json({ destinations: [] })
    }

    // Score each destination
    const scored = all.map((dest) => {
      let score = 0

      // Month → check weatherByMonth
      if (month) {
        const weather = dest.weatherByMonth?.[month]
        if (weather === 'great') score += 3
        else if (weather === 'good') score += 2
        else if (weather === 'mixed') score += 0
        else if (weather === 'poor') score -= 2
      }

      // Continent exact match
      if (continent && dest.continent === continent) score += 3

      // Vibe — destination may have multiple vibes
      if (vibe && dest.vibe?.includes(vibe)) score += 2

      // Trip length
      if (tripLength && dest.tripLength?.includes(tripLength)) score += 2

      // Who's going
      if (whoIsGoing && dest.whoIsGoing?.includes(whoIsGoing)) score += 2

      return { dest, score }
    })

    // Group by score, shuffle within each group for variety
    const maxScore = Math.max(...scored.map((s) => s.score))
    const buckets: Record<number, SanityDestination[]> = {}
    for (const { dest, score } of scored) {
      if (!buckets[score]) buckets[score] = []
      buckets[score].push(dest)
    }

    const sorted: SanityDestination[] = []
    const scores = Object.keys(buckets)
      .map(Number)
      .sort((a, b) => b - a)
    for (const s of scores) {
      sorted.push(...shuffle(buckets[s]))
    }

    const top3: ResultDestination[] = sorted.slice(0, 3).map((d) => ({
      title: d.title,
      slug: d.slug,
      country: d.country,
      continent: d.continent,
      vibe: d.vibe,
      summary: d.summary,
      weatherByMonth: d.weatherByMonth ?? null,
      tripLength: d.tripLength ?? null,
      whoIsGoing: d.whoIsGoing ?? null,
    }))

    return NextResponse.json({ destinations: top3 })
  } catch (err) {
    console.error('[decision-engine]', err)
    return NextResponse.json({ destinations: [] }, { status: 500 })
  }
}
