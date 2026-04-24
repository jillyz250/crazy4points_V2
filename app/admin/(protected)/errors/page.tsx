import { createAdminClient } from '@/utils/supabase/server'
import { listSystemErrors } from '@/utils/supabase/queries'
import { resolveErrorAction } from './actions'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

export const dynamic = 'force-dynamic'

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function ErrorsPage() {
  const supabase = createAdminClient()
  const errors = await listSystemErrors(supabase, { limit: 100 })
  const unresolved = errors.filter((e) => !e.resolved_at)
  const resolved = errors.filter((e) => e.resolved_at)

  return (
    <div>
      <PageHeader
        title="System Errors"
        description="Background-job failures (scout, brief, summarize, etc.). Resolve once you've investigated."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Badge tone={unresolved.length > 0 ? 'danger' : 'neutral'}>
              {unresolved.length} unresolved
            </Badge>
            <Badge tone="neutral">{resolved.length} resolved</Badge>
          </div>
        }
      />

      {errors.length === 0 ? (
        <EmptyState title="No errors logged" description="You're in the clear." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {errors.map((e) => (
            <ErrorCard key={e.id} err={e} />
          ))}
        </div>
      )}
    </div>
  )
}

function ErrorCard({ err }: { err: Awaited<ReturnType<typeof import('@/utils/supabase/queries').listSystemErrors>>[number] }) {
  const isResolved = !!err.resolved_at
  return (
    <div
      className="admin-card"
      style={{
        padding: '0.875rem 1rem',
        borderLeft: `3px solid ${isResolved ? 'var(--admin-border)' : 'var(--admin-danger)'}`,
        opacity: isResolved ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge tone={isResolved ? 'neutral' : 'danger'}>{err.source}</Badge>
          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle)' }}>
            {formatTime(err.created_at)}
          </span>
          {isResolved && (
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-success)' }}>
              ✓ resolved {formatTime(err.resolved_at!)}
            </span>
          )}
        </div>
        {!isResolved && (
          <form action={resolveErrorAction.bind(null, err.id)}>
            <button type="submit" className="admin-btn admin-btn-secondary admin-btn-sm">
              Resolve
            </button>
          </form>
        )}
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--admin-text)', fontFamily: 'var(--font-body)' }}>
        {err.message}
      </div>
      {err.stack && (
        <details style={{ marginTop: '0.5rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            Stack trace
          </summary>
          <pre style={{
            marginTop: '0.5rem',
            padding: '0.625rem',
            background: 'var(--admin-surface-alt)',
            borderRadius: 'var(--admin-radius)',
            fontSize: '0.6875rem',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}>
            {err.stack}
          </pre>
        </details>
      )}
      {err.context != null && (
        <details style={{ marginTop: '0.375rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            Context
          </summary>
          <pre style={{
            marginTop: '0.5rem',
            padding: '0.625rem',
            background: 'var(--admin-surface-alt)',
            borderRadius: 'var(--admin-radius)',
            fontSize: '0.6875rem',
            overflow: 'auto',
          }}>
            {JSON.stringify(err.context, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}
