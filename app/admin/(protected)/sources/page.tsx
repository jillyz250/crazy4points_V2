import { createAdminClient } from '@/utils/supabase/server'
import { getSources, getLastFindingBySource } from '@/utils/supabase/queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { LinkButton } from '@/components/admin/ui/Button'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import SourcesTable from './SourcesTable'

export default async function AdminSourcesPage() {
  const supabase = createAdminClient()
  const [sources, lastFindingsMap] = await Promise.all([
    getSources(supabase),
    getLastFindingBySource(supabase),
  ])

  // Map → plain object for the client component
  const lastFindings: Record<string, string> = {}
  for (const [name, iso] of lastFindingsMap.entries()) {
    if (iso) lastFindings[name] = iso
  }

  return (
    <div>
      <PageHeader
        title="Sources"
        description="Intelligence sources scraped by Claude Scout. Control tiers, frequency, and activity."
        actions={<LinkButton href="/admin/sources/new" variant="primary">+ Add Source</LinkButton>}
      />

      {sources.length === 0 ? (
        <EmptyState title="No sources yet" description="Add one to start feeding Scout." />
      ) : (
        <SourcesTable sources={sources} lastFindings={lastFindings} />
      )}
    </div>
  )
}
