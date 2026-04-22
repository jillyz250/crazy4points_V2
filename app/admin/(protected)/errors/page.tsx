import { createAdminClient } from '@/utils/supabase/server'
import { listSystemErrors } from '@/utils/supabase/queries'
import { resolveErrorAction } from './actions'

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>System Errors</h1>
        <div style={{ display: 'flex', gap: '1.25rem', fontFamily: 'var(--font-ui)', fontSize: '0.875rem' }}>
          <span>
            <strong style={{ color: '#7a1f1f' }}>{unresolved.length}</strong>{' '}
            <span style={{ color: 'var(--color-text-secondary)' }}>unresolved</span>
          </span>
          <span>
            <strong style={{ color: 'var(--color-text-secondary)' }}>{resolved.length}</strong>{' '}
            <span style={{ color: 'var(--color-text-secondary)' }}>resolved</span>
          </span>
        </div>
      </div>
      <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
        Background-job failures (scout, brief, summarize, etc.). Resolve once you&rsquo;ve investigated.
      </p>

      {errors.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
          No errors logged. 🎉
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
      style={{
        border: '1px solid var(--color-border-soft)',
        borderLeft: `3px solid ${isResolved ? 'var(--color-border-soft)' : '#7a1f1f'}`,
        borderRadius: 'var(--radius-card)',
        padding: '1rem 1.125rem',
        background: 'var(--color-background)',
        opacity: isResolved ? 0.65 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '0.125rem 0.5rem',
              borderRadius: '999px',
              background: 'var(--color-background-soft)',
              color: 'var(--color-primary)',
            }}
          >
            {err.source}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            {formatTime(err.created_at)}
          </span>
          {isResolved && (
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: '#2E7D32' }}>
              ✓ resolved {formatTime(err.resolved_at!)}
            </span>
          )}
        </div>
        {!isResolved && (
          <form action={resolveErrorAction.bind(null, err.id)}>
            <button
              type="submit"
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-ui)',
                padding: '0.25rem 0.625rem',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              Resolve
            </button>
          </form>
        )}
      </div>
      <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
        {err.message}
      </div>
      {err.stack && (
        <details style={{ marginTop: '0.5rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)' }}>
            Stack trace
          </summary>
          <pre style={{
            marginTop: '0.5rem',
            padding: '0.625rem',
            background: 'var(--color-background-soft)',
            borderRadius: 'var(--radius-ui)',
            fontSize: '0.75rem',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}>
            {err.stack}
          </pre>
        </details>
      )}
      {err.context != null && (
        <details style={{ marginTop: '0.375rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)' }}>
            Context
          </summary>
          <pre style={{
            marginTop: '0.5rem',
            padding: '0.625rem',
            background: 'var(--color-background-soft)',
            borderRadius: 'var(--radius-ui)',
            fontSize: '0.75rem',
            overflow: 'auto',
          }}>
            {JSON.stringify(err.context, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}
