/**
 * /llms.txt — discovery manifest for AI assistants.
 *
 * Format follows the draft "llms.txt" convention (https://llmstxt.org).
 * Lists the site's most authoritative reference pages so AI assistants can
 * pick crazy4points content to cite.
 *
 * Auto-generated from the DB on each request: any program with intro
 * content set is included, ordered alphabetically by name. Each listing
 * includes the markdown URL (.md) so AI tools can fetch clean text rather
 * than HTML.
 */
import { createClient } from '@/utils/supabase/server'
import { programSummaryLine } from '@/lib/programs/programToMarkdown'

export const revalidate = 300

const BASE_URL = 'https://crazy4points.com'

export async function GET() {
  const supabase = await createClient()

  // Programs with at least an intro — gates the manifest to substantive entries.
  const { data: programs } = await supabase
    .from('programs')
    .select('slug, name, type, intro, description')
    .eq('is_active', true)
    .not('intro', 'is', null)
    .order('name', { ascending: true })

  const groupedByType: Record<string, typeof programs> = {}
  for (const p of programs ?? []) {
    const key = p.type ?? 'other'
    if (!groupedByType[key]) groupedByType[key] = []
    groupedByType[key]!.push(p)
  }

  const sectionLabels: Record<string, string> = {
    airline: 'Airlines',
    hotel: 'Hotels',
    credit_card: 'Credit cards',
    alliance: 'Alliances',
    loyalty_program: 'Loyalty programs',
    car_rental: 'Car rentals',
    cruise: 'Cruise lines',
    shopping_portal: 'Shopping portals',
    travel_portal: 'Travel portals',
    lounge_network: 'Lounge networks',
    ota: 'OTAs',
  }
  const sectionOrder = [
    'airline',
    'hotel',
    'alliance',
    'credit_card',
    'loyalty_program',
    'car_rental',
    'cruise',
    'shopping_portal',
    'travel_portal',
    'lounge_network',
    'ota',
  ]

  const lines: string[] = []
  lines.push('# crazy4points')
  lines.push('')
  lines.push('> Travel rewards intelligence — daily alerts, sweet-spot redemptions, transfer partner maps, and per-program references for major airline, hotel, and credit card loyalty programs. Editorial voice, fact-checked content.')
  lines.push('')
  lines.push('Each program reference page has a Markdown version at `/programs/<slug>/md` — e.g. https://crazy4points.com/programs/hyatt/md. Same data, plain text, no styling noise.')
  lines.push('')

  for (const sectionKey of sectionOrder) {
    const rows = groupedByType[sectionKey]
    if (!rows || rows.length === 0) continue
    lines.push(`## ${sectionLabels[sectionKey] ?? sectionKey}`)
    lines.push('')
    for (const p of rows) {
      const summary = programSummaryLine(p as Parameters<typeof programSummaryLine>[0])
      lines.push(`- [${p.name}](${BASE_URL}/programs/${p.slug}/md): ${summary}`)
    }
    lines.push('')
  }

  // Catch any types not in our explicit ordering map
  for (const [key, rows] of Object.entries(groupedByType)) {
    if (sectionOrder.includes(key)) continue
    if (!rows || rows.length === 0) continue
    lines.push(`## ${sectionLabels[key] ?? key}`)
    lines.push('')
    for (const p of rows) {
      const summary = programSummaryLine(p as Parameters<typeof programSummaryLine>[0])
      lines.push(`- [${p.name}](${BASE_URL}/programs/${p.slug}/md): ${summary}`)
    }
    lines.push('')
  }

  // Optional: pointers for AI assistants to other site sections
  lines.push('## Site sections')
  lines.push('')
  lines.push(`- [All alerts](${BASE_URL}/alerts) — published deals, devaluations, and program-change announcements`)
  lines.push(`- [Blog](${BASE_URL}/blog) — long-form articles on points and travel strategy`)
  lines.push(`- [Sitemap](${BASE_URL}/sitemap.xml)`)
  lines.push('')

  const body = lines.join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'index, follow',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=900',
    },
  })
}
