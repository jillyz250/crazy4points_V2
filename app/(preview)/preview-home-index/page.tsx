import type { Metadata } from 'next'
import PreviewHomeMock, { type FlightBonus, type FlightSweetSpot } from '@/components/preview/PreviewHomeMock'
import { createAdminClient } from '@/utils/supabase/server'
import { getHomeExperiences } from '@/utils/experiences/getHomeExperiences'

export const metadata: Metadata = { title: 'Homepage v2 — Concierge Index (preview)', robots: { index: false } }
export const dynamic = 'force-dynamic'

const CURRENCY_LABEL: Record<string, string> = { amex: 'Amex', chase: 'Chase', citi: 'Citi', 'capital-one': 'Capital One', bilt: 'Bilt' }

export default async function Page() {
  const supabase = createAdminClient()
  const experiences = await getHomeExperiences(supabase, 3)

  // Flight Deals — Lane 1: active transfer bonuses whose DESTINATION is an airline.
  const { data: airlines } = await supabase.from('programs').select('slug, name').eq('type', 'airline')
  const airlineName = new Map((airlines ?? []).map((p) => [p.slug as string, p.name as string]))
  const { data: currencies } = await supabase.from('programs').select('slug, transfer_partners_outbound').in('slug', Object.keys(CURRENCY_LABEL))
  const today = new Date().toISOString().slice(0, 10)
  const flightBonuses: FlightBonus[] = []
  for (const c of currencies ?? []) {
    const card = CURRENCY_LABEL[c.slug as string] ?? (c.slug as string)
    for (const p of ((c.transfer_partners_outbound as { from_slug?: string; bonus_active?: boolean; bonus_pct?: number; bonus_end_date?: string; bonus_alert_slug?: string }[] | null) ?? [])) {
      if (p?.bonus_active && p?.from_slug && airlineName.has(p.from_slug) && (!p.bonus_end_date || p.bonus_end_date >= today)) {
        flightBonuses.push({ card, dest: airlineName.get(p.from_slug) as string, pct: p.bonus_pct ?? null, end: p.bonus_end_date ?? null, slug: p.bonus_alert_slug ?? null })
      }
    }
  }
  flightBonuses.sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))
  const topFlightBonuses = flightBonuses.slice(0, 3)

  // Flight Deals — Lane 2: best flight sweet spots (cabin set = a flight redemption).
  const { data: ssRows } = await supabase
    .from('sweet_spots')
    .select('id, title, route, points, cabin, program_slug')
    .eq('status', 'active')
    .not('cabin', 'is', null)
    .order('points', { ascending: true, nullsFirst: false })
    .limit(60)
  const flightSweetSpots = ((ssRows ?? []) as FlightSweetSpot[]).filter((s) => s.title).slice(0, 3)

  return <PreviewHomeMock variant="index" experiences={experiences} flightBonuses={topFlightBonuses} flightSweetSpots={flightSweetSpots} />
}
