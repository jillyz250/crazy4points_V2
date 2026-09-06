import type { Metadata } from 'next'
import PreviewHomeMock, { type FlightBonus, type FlightSweetSpot, type PromoAlert } from '@/components/preview/PreviewHomeMock'
import { createAdminClient } from '@/utils/supabase/server'
import { getHomeExperiences } from '@/utils/experiences/getHomeExperiences'
import { selectAlertViewFromVariants, type AlertViewWithPrograms } from '@/utils/content/alertView'
import { isAlertActiveET } from '@/lib/alerts/expiry'

export const metadata: Metadata = { title: 'Homepage v2 — Concierge Index (preview)', robots: { index: false } }
export const dynamic = 'force-dynamic'

const CURRENCY_LABEL: Record<string, string> = { amex: 'Amex', chase: 'Chase', citi: 'Citi', 'capital-one': 'Capital One', bilt: 'Bilt' }

export default async function Page() {
  const supabase = createAdminClient()
  const experiences = await getHomeExperiences(supabase, 3)

  // Program name/type maps.
  const { data: progs } = await supabase.from('programs').select('slug, name, type')
  const airlineName = new Map<string, string>()
  const hotelSlugs = new Set<string>()
  for (const p of progs ?? []) {
    if (p.type === 'airline') airlineName.set(p.slug as string, p.name as string)
    if (p.type === 'hotel') hotelSlugs.add(p.slug as string)
  }

  // ---- Flight Deals ----
  // Lane 1: active transfer bonuses whose destination is an airline.
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

  // ---- Hotel Deals ----
  // Lane 1: current hotel promos (published, active, a hotel program attached).
  const allPublished = (await selectAlertViewFromVariants(supabase, { status: 'published', withPrograms: true })) as AlertViewWithPrograms[]
  const activeAlerts = allPublished.filter((a) => isAlertActiveET(a.end_date))
  const byPublished = (a: AlertViewWithPrograms, b: AlertViewWithPrograms) =>
    (b.published_at ? new Date(b.published_at).getTime() : 0) - (a.published_at ? new Date(a.published_at).getTime() : 0)
  const hotelPromos: PromoAlert[] = activeAlerts
    .filter((a) => a.programs?.some((p) => p.type === 'hotel'))
    .sort(byPublished)
    .slice(0, 3)
    .map((a) => ({ title: a.title, summary: a.summary ?? null, type: a.type ?? null, slug: a.short_slug || a.slug }))

  // ---- Sweet spots (both sections) ----
  const { data: ssRows } = await supabase
    .from('sweet_spots')
    .select('id, title, route, points, cabin, program_slug, operating_partner')
    .eq('status', 'active')
    .limit(300)
  const ss = (ssRows ?? []) as (FlightSweetSpot & { program_slug: string | null; operating_partner: string | null })[]
  const flightSweetSpots = ss.filter((s) => s.cabin && s.title).sort((a, b) => (a.points ?? 9e9) - (b.points ?? 9e9)).slice(0, 3)
  const hotelSweetSpots = ss.filter((s) => s.title && ((s.program_slug && hotelSlugs.has(s.program_slug)) || (s.operating_partner && hotelSlugs.has(s.operating_partner)))).slice(0, 3)

  return (
    <PreviewHomeMock
      variant="index"
      experiences={experiences}
      flightBonuses={flightBonuses.slice(0, 3)}
      flightSweetSpots={flightSweetSpots}
      hotelPromos={hotelPromos}
      hotelSweetSpots={hotelSweetSpots}
    />
  )
}
