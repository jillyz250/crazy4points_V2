import JobsPanel from './JobsPanel'
import { PageHeader } from '@/components/admin/ui/PageHeader'

export const dynamic = 'force-dynamic'

export default function JobsPage() {
  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Manually trigger scheduled jobs. Useful for testing a new source without waiting for the daily cron."
      />
      <JobsPanel />
    </div>
  )
}
