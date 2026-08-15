import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/utils/supabase/server'
import { OG_SIZE, toDataUri, loadPlayfair, renderShareCard } from '@/lib/og/card'

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Crazy4Points program guide'

const TYPE_LABEL: Record<string, string> = {
  airline: 'Airline',
  hotel: 'Hotel',
  bank_currency: 'Transferable Points',
  card_network: 'Card Network',
  alliance: 'Alliance',
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: prog } = await supabase
    .from('programs')
    .select('name, logo_url, type')
    .eq('slug', slug)
    .maybeSingle()

  const name = (prog?.name as string) ?? 'Crazy4Points'
  const logo = prog?.logo_url ? await toDataUri(prog.logo_url as string) : null
  const badge = TYPE_LABEL[(prog?.type as string) ?? ''] ?? 'Program Guide'
  const font = await loadPlayfair()

  return new ImageResponse(
    renderShareCard({ logo, badgeText: badge, headline: name, footRight: 'Points & Miles', hasFont: !!font }),
    { ...OG_SIZE, fonts: font ? [{ name: 'Playfair', data: font, style: 'normal', weight: 700 }] : [] },
  )
}
