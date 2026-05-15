import { redirect } from 'next/navigation'

/**
 * Legacy card-extractions route — replaced by the unified Extractions hub.
 * Permanently redirects to /admin/extractions?tab=history.
 */
export default async function CardExtractionsLegacyPage() {
  redirect('/admin/extractions?tab=history')
}
