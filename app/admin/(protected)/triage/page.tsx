import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { writeAlertFromCandidate, dismissCandidate } from './actions'

export const dynamic = 'force-dynamic'

interface IntelCandidate {
  id: string
  headline: string
  raw_text: string | null
  source_name: string | null
  source_url: string | null
  programs: string[] | null
  type: string | null
  confidence: number | null
  triage_decision: string | null
  triage_reasoning: string | null
  triage_decided_at: string | null
  expires_at: string | null
  alert_id: string | null
  processed: boolean | null
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export default async function TriagePage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>
}) {
  const { show = 'approved' } = await searchParams
  const supabase = createAdminClient()

  // Approved candidates without an alert yet = the inbox
  const { data: approvedData } = await supabase
    .from('intel_items')
    .select('id, headline, raw_text, source_name, source_url, programs, type, confidence, triage_decision, triage_reasoning, triage_decided_at, expires_at, alert_id, processed')
    .eq('triage_decision', 'approved')
    .is('alert_id', null)
    .is('rejected_at', null)
    .order('confidence', { ascending: false, nullsFirst: false })
    .order('triage_decided_at', { ascending: false })
    .limit(50)

  const { data: rejectedData } = await supabase
    .from('intel_items')
    .select('id, headline, raw_text, source_name, source_url, programs, type, confidence, triage_decision, triage_reasoning, triage_decided_at, expires_at, alert_id, processed')
    .eq('triage_decision', 'rejected')
    .order('triage_decided_at', { ascending: false })
    .limit(20)

  const { data: writtenData } = await supabase
    .from('intel_items')
    .select('id, headline, raw_text, source_name, source_url, programs, type, confidence, triage_decision, triage_reasoning, triage_decided_at, expires_at, alert_id, processed')
    .eq('triage_decision', 'approved')
    .not('alert_id', 'is', null)
    .order('triage_decided_at', { ascending: false })
    .limit(20)

  const approved = (approvedData as IntelCandidate[] | null) ?? []
  const rejected = (rejectedData as IntelCandidate[] | null) ?? []
  const written = (writtenData as IntelCandidate[] | null) ?? []

  const tabs: Array<{ key: string; label: string; count: number }> = [
    { key: 'approved', label: 'To write', count: approved.length },
    { key: 'written', label: 'Already written', count: written.length },
    { key: 'rejected', label: 'Planner rejected', count: rejected.length },
  ]

  const rows = show === 'rejected' ? rejected : show === 'written' ? written : approved

  return (
    <div>
      <PageHeader
        title="Triage"
        description="Editorial planner approved these from this morning's intel — click Write on the ones worth drafting. Saves ~80% of API spend vs auto-writing everything."
        actions={<Badge tone={approved.length > 0 ? 'warning' : 'neutral'}>{approved.length} to write</Badge>}
      />

      <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map((t) => {
          const active = t.key === show
          return (
            <Link
              key={t.key}
              href={`/admin/triage?show=${t.key}`}
              style={{
                padding: '0.4rem 0.875rem',
                borderRadius: '9999px',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                background: active ? 'var(--color-primary)' : 'var(--color-background-soft)',
                color: active ? '#fff' : 'var(--color-text-primary)',
                border: '1px solid ' + (active ? 'var(--color-primary)' : 'var(--color-border-soft)'),
              }}
            >
              {t.label} ({t.count})
            </Link>
          )
        })}
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          title={
            show === 'approved'
              ? 'Nothing in the triage inbox'
              : show === 'written'
              ? 'No alerts written from triage yet'
              : 'No rejected items'
          }
          description={
            show === 'approved'
              ? "Run build-brief to populate. Or you're caught up — nice."
              : ''
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {rows.map((c) => (
            <CandidateCard key={c.id} c={c} mode={show} />
          ))}
        </div>
      )}
    </div>
  )
}

function CandidateCard({ c, mode }: { c: IntelCandidate; mode: string }) {
  const slugs = c.programs ?? []
  const isWritten = !!c.alert_id
  const isApproved = mode === 'approved'

  return (
    <article
      style={{
        padding: '1rem 1.125rem',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        background: '#fff',
      }}
    >
      <header style={{ marginBottom: '0.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0, lineHeight: 1.3 }}>
          {c.headline}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem', flexWrap: 'wrap', alignItems: 'center', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {c.source_name && <span>📰 {c.source_name}</span>}
          {c.source_url && (
            <a href={c.source_url} target="_blank" rel="noopener" style={{ color: 'var(--color-primary)' }}>
              source ↗
            </a>
          )}
          {c.type && <Badge tone="neutral">{c.type}</Badge>}
          {c.confidence != null && <span>conf {Math.round(c.confidence * 100)}%</span>}
          {c.expires_at && <span>⏰ ends {new Date(c.expires_at).toLocaleDateString()}</span>}
          {slugs.length > 0 && <span>· {slugs.join(', ')}</span>}
        </div>
      </header>

      {c.triage_reasoning && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '0.625rem', padding: '0.625rem 0.75rem', background: 'var(--color-background-soft)', borderRadius: 'var(--radius-ui)', borderLeft: '3px solid var(--color-primary)' }}>
          <strong style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginRight: '0.5rem' }}>
            Planner says
          </strong>
          {c.triage_reasoning}
        </div>
      )}

      {c.raw_text && (
        <details style={{ marginBottom: '0.75rem' }}>
          <summary style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            Raw intel text
          </summary>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap', color: 'var(--color-text-primary)' }}>
            {c.raw_text}
          </div>
        </details>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        {isWritten && c.alert_id && (
          <Link href={`/admin/alerts/${c.alert_id}`} className="rg-btn-secondary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.875rem' }}>
            Review alert →
          </Link>
        )}
        {isApproved && !isWritten && (
          <>
            <form action={writeAlertFromCandidate}>
              <input type="hidden" name="intel_id" value={c.id} />
              <button type="submit" className="rg-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                ✍️ Write this
              </button>
            </form>
            <form action={dismissCandidate}>
              <input type="hidden" name="intel_id" value={c.id} />
              <button
                type="submit"
                style={{
                  padding: '0.5rem 0.875rem',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: 'transparent',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border-soft)',
                  borderRadius: 'var(--radius-ui)',
                  cursor: 'pointer',
                }}
              >
                Skip
              </button>
            </form>
          </>
        )}
      </div>
    </article>
  )
}
