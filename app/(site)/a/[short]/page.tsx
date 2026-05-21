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
  // Phase 3 Wave 2 flip #2: resolve short_slug via content_variants instead
  // of alerts. variant.metadata.short_slug is preserved by the dual-write
  // trigger (migration 319). Only published alert-variants with an active
  // topic resolve; everything else lands on /alerts.
  const { data } = await supabase
    .from('content_variants')
    .select('status, topics:topics!inner(slug, status, end_date)')
    .eq('format', 'alert')
    .eq('status', 'published')
    .eq('metadata->>short_slug', short.toLowerCase())
    .maybeSingle()

  const topic = data?.topics as { slug: string; status: string; end_date: string | null } | null
  if (!topic) redirect('/alerts')

  redirect(`/alerts/${topic.slug}`)
}

// Don't cache the redirect endpoint — short_slugs can be unpublished /
// re-pointed and we want the latest mapping every request.
export const dynamic = 'force-dynamic'
