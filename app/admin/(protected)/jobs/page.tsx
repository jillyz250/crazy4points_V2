import JobsPanel from './JobsPanel'

export const dynamic = 'force-dynamic'

export default function JobsPage() {
  return (
    <div>
      <h1 style={{ margin: 0 }}>Jobs</h1>
      <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
        Manually trigger scheduled jobs. Useful for testing a new source without waiting for the daily cron.
      </p>
      <JobsPanel />
    </div>
  )
}
