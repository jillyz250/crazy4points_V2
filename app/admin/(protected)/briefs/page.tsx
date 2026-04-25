import { createAdminClient } from '@/utils/supabase/server'
import { RebuildButton } from './RebuildButton'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { LinkButton } from '@/components/admin/ui/Button'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

export const dynamic = 'force-dynamic'

interface BriefRow {
  id: string
  brief_date: string
  intel_count: number | null
  sent_at: string | null
  brief_html: string | null
}

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function BriefsPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('daily_briefs')
    .select('id, brief_date, intel_count, sent_at, brief_html')
    .order('brief_date', { ascending: false })
    .limit(30)

  if (error) {
    return (
      <div>
        <PageHeader title="Daily Briefs" />
        <p style={{ color: 'var(--admin-danger)' }}>Failed to load briefs: {error.message}</p>
      </div>
    )
  }

  const briefs = (data ?? []) as BriefRow[]

  return (
    <div>
      <PageHeader
        title="Daily Briefs"
        description="Today's intel review and action queue. Click a date to read the brief and approve/reject in place."
      />

      {briefs.length === 0 ? (
        <EmptyState
          title="No briefs yet"
          description="Run the build-brief job to generate one."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {briefs.map((b) => {
            const hasHtml = Boolean(b.brief_html)
            return (
              <div
                key={b.id}
                className="admin-card"
                style={{
                  padding: '0.75rem 1rem',
                  borderLeft: `3px solid ${hasHtml ? 'var(--admin-accent)' : 'var(--admin-warning)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--admin-text)' }}>
                    {formatDate(b.brief_date)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.125rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Badge tone="neutral">{b.intel_count ?? 0} intel</Badge>
                    <span>built {formatTime(b.sent_at)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                  {hasHtml && (
                    <LinkButton href={`/admin/briefs/${b.id}`} variant="primary" size="sm">
                      Preview
                    </LinkButton>
                  )}
                  <RebuildButton briefId={b.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
