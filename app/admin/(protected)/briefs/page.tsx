import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'

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
        <h1 style={{ margin: 0 }}>Daily Briefs</h1>
        <p style={{ color: '#c0392b' }}>Failed to load briefs: {error.message}</p>
      </div>
    )
  }

  const briefs = (data ?? []) as BriefRow[]

  return (
    <div>
      <h1 style={{ margin: 0 }}>Daily Briefs</h1>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text-secondary)',
          marginTop: '0.25rem',
          marginBottom: '1.25rem',
        }}
      >
        Preview any past daily brief in-app. Useful to check a brief without waiting for email delivery.
      </p>

      {briefs.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
          No briefs yet. Run the build-brief job to generate one.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {briefs.map((b) => {
            const hasHtml = Boolean(b.brief_html)
            return (
              <div
                key={b.id}
                style={{
                  border: '1px solid var(--color-border-soft)',
                  borderLeft: `3px solid ${hasHtml ? 'var(--color-primary)' : '#b45309'}`,
                  borderRadius: 'var(--radius-card)',
                  padding: '0.875rem 1rem',
                  background: 'var(--color-background)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.125rem',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {formatDate(b.brief_date)}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-secondary)',
                      marginTop: '0.125rem',
                    }}
                  >
                    {b.intel_count ?? 0} intel · built {formatTime(b.sent_at)}
                  </div>
                </div>
                {hasHtml ? (
                  <Link
                    href={`/admin/briefs/${b.id}`}
                    className="rg-btn-primary"
                    style={{ display: 'inline-block' }}
                  >
                    Preview
                  </Link>
                ) : (
                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.75rem',
                      color: '#b45309',
                    }}
                  >
                    No HTML stored (pre-migration)
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
