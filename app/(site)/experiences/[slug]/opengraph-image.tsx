import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/utils/supabase/server'
import { getExperienceBySlug } from '@/utils/supabase/queries'
import { OG_SIZE, toDataUri, loadPlayfair, renderShareCard } from '@/lib/og/card'

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Crazy4Points experiences'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()
  const exp = await getExperienceBySlug(supabase, slug).catch(() => null)
  const name = (exp?.name as string) ?? 'Experiences'

  // Badge = the parent program (with its logo) when we have one.
  let logo: string | null = null
  let badge = 'Experiences'
  const parentSlug = (exp as unknown as { parent_program_slug?: string | null })?.parent_program_slug
  if (parentSlug) {
    const { data: prog } = await supabase.from('programs').select('name, logo_url').eq('slug', parentSlug).maybeSingle()
    if (prog?.logo_url) logo = await toDataUri(prog.logo_url as string)
    badge = prog?.name ? `${prog.name} · Experiences` : 'Experiences'
  }
  const font = await loadPlayfair()

  return new ImageResponse(
    renderShareCard({ logo, badgeText: badge, headline: name, footRight: 'Experiences', hasFont: !!font }),
    { ...OG_SIZE, fonts: font ? [{ name: 'Playfair', data: font, style: 'normal', weight: 700 }] : [] },
  )
}
