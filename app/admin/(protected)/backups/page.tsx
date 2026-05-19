import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { takeSnapshotNow } from './actions'
import DownloadSnapshotLink from './DownloadSnapshotLink'

export const dynamic = 'force-dynamic'

interface BackupSnapshotRow {
  id: string
  taken_at: string
  label: string
  storage_path: string
  size_bytes: number
  tables_included: string[] | null
  row_counts: Record<string, number> | null
  taken_by: string | null
  notes: string | null
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

export default async function BackupsPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('backup_snapshots')
    .select('*')
    .order('taken_at', { ascending: false })
    .limit(100)

  const snapshots = (data as BackupSnapshotRow[] | null) ?? []
  const mostRecent = snapshots[0]
  const daysSinceLast = mostRecent ? daysSince(mostRecent.taken_at) : null
  const stale = daysSinceLast == null || daysSinceLast > 7

  return (
    <div>
      <PageHeader
        title="Backups"
        description="Database snapshots — your safety net before risky operations. Manual + nightly cron. Stored in Supabase Storage."
        actions={
          mostRecent ? (
            <Badge tone={stale ? 'danger' : 'success'}>
              {daysSinceLast === 0 ? 'Today' : `${daysSinceLast}d ago`}
            </Badge>
          ) : (
            <Badge tone="danger">Never</Badge>
          )
        }
      />

      {stale && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '0.875rem 1rem',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            borderRadius: 'var(--radius-card)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
          }}
        >
          ⚠️ {mostRecent
            ? `Last snapshot was ${daysSinceLast} days ago.`
            : 'No snapshots yet.'} Recommended cadence is at least weekly,
          or right before any bulk operation (re-extractions, migrations, SQL edits across many rows).
        </div>
      )}

      {/* Take snapshot now */}
      <section
        style={{
          marginBottom: '2rem',
          padding: '1.25rem',
          border: '1px solid var(--color-border-soft)',
          borderRadius: 'var(--radius-card)',
          background: 'var(--color-background-soft)',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
          📸 Take a snapshot now
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Pulls every editorial table (programs, cards, alerts, topics, etc.), gzips
          to JSON, uploads to the private <code>db-backups</code> Storage bucket.
          Takes ~10 seconds. Free.
        </p>
        <form action={takeSnapshotNow} style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Label
            </label>
            <input
              type="text"
              name="label"
              defaultValue="manual"
              placeholder="manual, pre-marriott-cleanup, etc."
              maxLength={60}
              style={{
                flex: '1 1 16rem',
                padding: '0.5rem 0.75rem',
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-ui)',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <label style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
              Notes
            </label>
            <textarea
              name="notes"
              placeholder="What are you about to do? (helps you find this snapshot later)"
              rows={2}
              style={{
                flex: '1 1 100%',
                padding: '0.5rem 0.75rem',
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-ui)',
                resize: 'vertical',
              }}
            />
          </div>
          <button type="submit" className="rg-btn-primary" style={{ alignSelf: 'flex-start' }}>
            Take snapshot
          </button>
        </form>
      </section>

      {/* History */}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
        Recent snapshots
      </h2>

      {error && (
        <div style={{ color: 'var(--color-danger, #b00020)', marginBottom: '1rem' }}>
          Failed to load snapshots: {error.message}
        </div>
      )}

      {snapshots.length === 0 ? (
        <EmptyState
          title="No snapshots yet"
          description="Click Take snapshot above to create your first one."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {snapshots.map((s) => {
            const tableCount = s.tables_included?.length ?? 0
            const totalRows = s.row_counts
              ? Object.values(s.row_counts).reduce((a, b) => a + b, 0)
              : 0
            return (
              <article
                key={s.id}
                style={{
                  padding: '0.875rem 1rem',
                  border: '1px solid var(--color-border-soft)',
                  borderRadius: 'var(--radius-card)',
                  background: '#fff',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: '0.75rem',
                  alignItems: 'start',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontFamily: 'var(--font-ui)', fontSize: '0.9375rem' }}>
                      {s.label}
                    </strong>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      {formatTime(s.taken_at)}
                    </span>
                    <Badge tone="neutral">{formatSize(s.size_bytes)}</Badge>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    {tableCount} tables · {totalRows.toLocaleString()} rows
                    {s.taken_by ? ` · ${s.taken_by}` : ''}
                  </div>
                  {s.notes && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-text-primary)', marginTop: '0.375rem', fontStyle: 'italic' }}>
                      &ldquo;{s.notes}&rdquo;
                    </div>
                  )}
                </div>
                <DownloadSnapshotLink storagePath={s.storage_path} />
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
