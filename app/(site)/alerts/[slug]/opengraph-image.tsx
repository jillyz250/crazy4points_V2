import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/utils/supabase/server'
import { getAlertBySlug } from '@/utils/supabase/queries'
import { OG_SIZE, toDataUri, loadPlayfair, renderShareCard } from '@/lib/og/card'

// Node runtime: reads Supabase (service role) for the alert + its program logo.
// Next.js auto-injects the og:image meta from this file — every shared alert
// link gets a branded card, no per-page wiring.
export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Crazy4Points alert'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()
  const alert = await getAlertBySlug(supabase, slug).catch(() => null)
  const title = alert?.title ?? 'Crazy4Points'

  // Program from the alert_programs junction (role 'primary') — the mirror's
  // primary_program_id column isn't reliably synced.
  const links = ((alert as unknown as { alert_programs?: unknown[] })?.alert_programs ?? []) as Array<{
    role?: string | null
    programs?: { name?: string | null; logo_url?: string | null } | null
  }>
  const prog = (links.find((l) => l.role === 'primary') ?? links[0])?.programs
  const logo = prog?.logo_url ? await toDataUri(prog.logo_url as string) : null
  const font = await loadPlayfair()

  return new ImageResponse(
    renderShareCard({ logo, badgeText: (prog?.name as string) ?? 'Crazy4Points', headline: title, hasFont: !!font }),
    { ...OG_SIZE, fonts: font ? [{ name: 'Playfair', data: font, style: 'normal', weight: 700 }] : [] },
  )
}
