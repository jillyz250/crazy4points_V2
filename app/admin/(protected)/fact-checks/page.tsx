import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { listAlertsWithFactChecks } from '@/utils/supabase/queries'
import { ReverifyButton } from './ReverifyButton'
import { ReviseButton } from './ReviseButton'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

export const dynamic = 'force-dynamic'

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'info'

interface Claim {
  claim: string
  supported: boolean
  severity?: string
  source_excerpt?: string | null
  web_verdict?: 'likely_correct' | 'likely_wrong' | 'unverifiable' | null
  web_evidence?: string | null
  web_url?: string | null
  acknowledged?: boolean
}

type StatusFilter = 'all' | 'flagged' | 'clean' | 'published'

function parseClaims(raw: unknown): Claim[] {
  return Array.isArray(raw) ? (raw as Claim[]) : []
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

type SearchParams = { [key: string]: string | string[] | undefined }

export default async function FactChecksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const statusRaw = Array.isArray(sp.status) ? sp.status[0] : sp.status
  const status: StatusFilter = (['all', 'flagged', 'clean', 'published'].includes(statusRaw ?? '') ? statusRaw : 'all') as StatusFilter

  const supabase = createAdminClient()
  const alerts = await listAlertsWithFactChecks(supabase, { days: 30 })

  const enriched = alerts.map((a) => {
    const claims = parseClaims(a.fact_check_claims)
    const unsupported = claims.filter((c) => !c.supported)
    const open = unsupported.filter((c) => !c.acknowledged)
    const likelyWrong = unsupported.filter((c) => c.web_verdict === 'likely_wrong')
    return { alert: a, claims, unsupported, open, likelyWrong }
  })

  const filtered = enriched.filter((e) => {
    if (status === 'flagged') return e.unsupported.length > 0
    if (status === 'clean') return e.unsupported.length === 0
    if (status === 'published') return e.alert.status === 'published'
    return true
  })

  const totals = {
    alerts: enriched.length,
    flagged: enriched.filter((e) => e.unsupported.length > 0).length,
    clean: enriched.filter((e) => e.unsupported.length === 0).length,
    approvesFlagged: enriched.filter((e) => e.alert.status === 'published' && e.unsupported.length > 0).length,
    approvesTotal: enriched.filter((e) => e.alert.status === 'published').length,
    likelyWrong: enriched.reduce((n, e) => n + e.likelyWrong.length, 0),
  }
  const chipRate = totals.approvesTotal > 0 ? Math.round((totals.approvesFlagged / totals.approvesTotal) * 100) : 0
  const chipRateTone: Tone = chipRate >= 40 ? 'danger' : chipRate >= 20 ? 'warning' : 'success'

  return (
    <div>
      <PageHeader
        title="Fact Checks"
        description="Claim-level fact-check results over the last 30 days. Spot whether flag rates come from checker noise or upstream data."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.625rem',
          marginBottom: '1rem',
        }}
      >
        <Stat label="Alerts checked" value={totals.alerts} tone="neutral" />
        <Stat label="Flagged" value={totals.flagged} tone="warning" />
        <Stat label="Clean" value={totals.clean} tone="success" />
        <Stat
          label="Approve flag rate"
          value={`${chipRate}%`}
          sublabel={`${totals.approvesFlagged} / ${totals.approvesTotal} published`}
          tone={chipRateTone}
        />
        <Stat label="'Likely wrong' total" value={totals.likelyWrong} tone={totals.likelyWrong > 0 ? 'danger' : 'neutral'} />
      </div>

      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {(['all', 'flagged', 'clean', 'published'] as StatusFilter[]).map((s) => (
          <Link
            key={s}
            href={`/admin/fact-checks?status=${s}`}
            className={`admin-btn admin-btn-sm ${status === s ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            style={{ textTransform: 'capitalize' }}
          >
            {s}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No fact-checked alerts" description="No alerts match this filter." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {filtered.map((e) => (
            <AlertCard
              key={e.alert.id}
              alertId={e.alert.id}
              title={e.alert.title}
              statusLabel={e.alert.status}
              factCheckAt={e.alert.fact_check_at}
              claims={e.claims}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, sublabel, tone = 'neutral' }: { label: string; value: number | string; sublabel?: string; tone?: Tone }) {
  const color = `var(--admin-${tone === 'neutral' ? 'text' : tone})`
  return (
    <div className="admin-card" style={{ padding: '0.75rem 0.875rem' }}>
      <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 600, color, lineHeight: 1.1, marginTop: '0.25rem' }}>
        {value}
      </div>
      {sublabel && (
        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.125rem' }}>
          {sublabel}
        </div>
      )}
    </div>
  )
}

function AlertCard({
  alertId,
  title,
  statusLabel,
  factCheckAt,
  claims,
}: {
  alertId: string
  title: string
  statusLabel: string
  factCheckAt: string | null
  claims: Claim[]
}) {
  const unsupported = claims.filter((c) => !c.supported)
  const hasFlags = unsupported.length > 0
  const hasLikelyWrong = claims.some((c) => c.web_verdict === 'likely_wrong')

  return (
    <div
      className="admin-card"
      style={{
        borderLeft: `3px solid ${hasFlags ? 'var(--admin-warning)' : 'var(--admin-success)'}`,
        padding: '0.875rem 1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge tone="accent">{statusLabel}</Badge>
          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            {factCheckAt ? formatTime(factCheckAt) : '—'}
          </span>
          <Badge tone={hasFlags ? 'warning' : 'success'}>
            {claims.length} claim{claims.length !== 1 ? 's' : ''} · {unsupported.length} unsupported
          </Badge>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {hasFlags && <ReverifyButton alertId={alertId} />}
          {hasLikelyWrong && <ReviseButton alertId={alertId} />}
          <Link href={`/admin/alerts/${alertId}/edit`} className="admin-btn admin-btn-ghost admin-btn-sm">
            Open alert →
          </Link>
        </div>
      </div>
      <div style={{ marginTop: '0.5rem', fontWeight: 600, color: 'var(--admin-text)' }}>{title}</div>

      {claims.length > 0 && (
        <details style={{ marginTop: '0.625rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            Claims ({claims.length})
          </summary>
          <ul style={{ margin: '0.5rem 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {claims.map((c, i) => (
              <ClaimRow key={i} claim={c} />
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function ClaimRow({ claim }: { claim: Claim }) {
  return (
    <li
      style={{
        padding: '0.5rem 0.625rem',
        borderRadius: 'var(--admin-radius)',
        border: '1px solid var(--admin-border)',
        background: 'var(--admin-surface)',
        fontSize: '0.8125rem',
      }}
    >
      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Badge tone={claim.supported ? 'success' : 'danger'}>
          {claim.supported ? '✓ supported' : '✗ unsupported'}
        </Badge>
        {claim.web_verdict && (
          <Badge tone="neutral">web: {claim.web_verdict.replace('_', ' ')}</Badge>
        )}
        {claim.acknowledged && (
          <span style={{ fontSize: '0.75rem', color: 'var(--admin-success)' }}>· acknowledged</span>
        )}
      </div>
      <div style={{ marginTop: '0.25rem' }}>{claim.claim}</div>
      {claim.web_evidence && (
        <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--admin-text-muted)' }}>
          {claim.web_evidence}
        </div>
      )}
      {claim.web_url && (
        <a
          href={claim.web_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}
        >
          {claim.web_url}
        </a>
      )}
    </li>
  )
}
