import { createClient } from '@/utils/supabase/server'
import { getPublicNewsletters, issueTitle } from '@/utils/content/publicNewsletters'

export const revalidate = 3600

const SITE = 'https://www.crazy4points.com'

function esc(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string))
}

export async function GET() {
  const supabase = await createClient()
  const issues = await getPublicNewsletters(supabase)

  const items = issues
    .map((n) => {
      const url = `${SITE}/newsletter/${n.slug}`
      const pub = n.sent_at ? new Date(n.sent_at).toUTCString() : ''
      return `    <item>
      <title>${esc(issueTitle(n))}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      ${pub ? `<pubDate>${pub}</pubDate>` : ''}
      ${n.hero_kicker ? `<description>${esc(n.hero_kicker)}</description>` : ''}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Crazy4Points Newsletter</title>
    <link>${SITE}/newsletter</link>
    <description>The best points-and-miles deals, transfer bonuses, and award sweet spots.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
