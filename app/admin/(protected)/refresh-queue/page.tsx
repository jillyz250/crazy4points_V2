import { redirect } from 'next/navigation'

// Merged into the Accuracy hub (Stage 1). The tool now lives as a tab; this
// route stays alive so old links/bookmarks land on the right tab instead of 404.
// The `type` filter is preserved across the redirect so deep links keep working.
export default async function RefreshQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const q = type ? `&type=${encodeURIComponent(type)}` : ''
  redirect(`/admin/accuracy?tab=refresh-queue${q}`)
}
