import type { Metadata } from 'next'
import PreviewHomeMock from '@/components/preview/PreviewHomeMock'
import { createAdminClient } from '@/utils/supabase/server'
import { getHomeExperiences } from '@/utils/experiences/getHomeExperiences'
import { selectAlertViewFromVariants, type AlertViewWithPrograms } from '@/utils/content/alertView'
import { isAlertActiveET } from '@/lib/alerts/expiry'

export const metadata: Metadata = { title: 'Homepage v2 — Concierge Index (preview)', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = createAdminClient()
  const experiences = await getHomeExperiences(supabase, 3)

  const allPublished = (await selectAlertViewFromVariants(supabase, { status: 'published', withPrograms: true })) as AlertViewWithPrograms[]
  const active = allPublished.filter((a) => isAlertActiveET(a.end_date))
  const byPublished = (a: AlertViewWithPrograms, b: AlertViewWithPrograms) =>
    (b.published_at ? new Date(b.published_at).getTime() : 0) - (a.published_at ? new Date(a.published_at).getTime() : 0)
  const flightDeals = active
    .filter((a) => a.programs?.some((p) => p.type === 'airline'))
    .sort(byPublished)
    .slice(0, 3)

  return <PreviewHomeMock variant="index" experiences={experiences} flightDeals={flightDeals} />
}
