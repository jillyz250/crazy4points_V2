import { redirect, notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Short-link redirect endpoint. Resolves /a/<short_slug> to the canonical
 * /alerts/<slug> via a permanent redirect (default 307 from Next.js
 * redirect(); we use status 308 for crawlers / SEO via the next.config).
 *
 * Only published alerts resolve — unpublished short_slugs go to /alerts.
 */
export default async function ShortLinkRedirect({
  params,
}: {
  params: Promise<{ short: string }>
}) {
  const { short } = await params
  if (!short) notFound()

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('alerts')
    .select('slug, status')
    .eq('short_slug', short.toLowerCase())
    .maybeSingle()

  if (!data || data.status !== 'published') {
    redirect('/alerts')
  }

  redirect(`/alerts/${data.slug}`)
}

// Don't cache the redirect endpoint — short_slugs can be unpublished /
// re-pointed and we want the latest mapping every request.
export const dynamic = 'force-dynamic'
