/**
 * /programs/[slug].md — markdown export of any program page.
 *
 * Same data as the HTML page, formatted as clean markdown for AI assistants
 * and any reader who prefers plain text. Generated on demand from the DB
 * row; no file is stored. Adding a new program in admin makes its .md URL
 * work immediately.
 */
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { programToMarkdown } from '@/lib/programs/programToMarkdown'

export const revalidate = 60

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('programs')
    .select(
      'name, slug, type, description, intro, award_chart, sweet_spots, how_to_spend, quirks, lounge_access, transfer_partners, tier_benefits, member_programs, alliance, hubs, program_url, content_updated_at'
    )
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) notFound()

  const md = programToMarkdown(data)

  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Robots-Tag': 'index, follow',
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
