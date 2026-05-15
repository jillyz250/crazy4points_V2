import { redirect } from 'next/navigation'

/**
 * Legacy refresh-queue route — replaced by the unified Extractions hub.
 * Permanently redirects to /admin/extractions with stale-only filter on.
 * Old bookmarks and external links keep working.
 */
export default async function RefreshQueueLegacyPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const sp = await searchParams
  const qs = new URLSearchParams()
  if (sp.type) qs.set('type', sp.type)
  qs.set('stale', 'true')
  redirect(`/admin/extractions?${qs.toString()}`)
}
