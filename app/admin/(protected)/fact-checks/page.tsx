import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { listAlertsWithFactChecks } from '@/utils/supabase/queries'
import { ReverifyButton } from './ReverifyButton'
import { ReviseButton } from './ReviseButton'

export const dynamic = 'force-dynamic'

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

  return (
    <div>
      <h1 style={{ margin: 0 }}>Fact Checks</h1>
      <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
        Claim-level fact-check results over the last 30 days. Use to spot whether flag rates come from checker noise or upstream data.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <Stat label="Alerts checked" value={totals.alerts} />
        <Stat label="Flagged (any unsupported)" value={totals.flagged} accent="#b45309" />
        <Stat label="Clean" value={totals.clean} accent="#1e7e34" />
        <Stat
          label="Approve flag rate"
          value={`${chipRate}%`}
          sublabel={`${totals.approvesFlagged} / ${totals.approvesTotal} published`}
          accent={chipRate >= 40 ? '#c0392b' : chipRate >= 20 ? '#b45309' : '#1e7e34'}
        />
        <Stat label="'Likely wrong' total" value={totals.likelyWrong} accent={totals.likelyWrong > 0 ? '#c0392b' : undefined} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', fontFamily: 'var(--font-ui)', fontSize: '0.875rem' }}>
        {(['all', 'flagged', 'clean', 'published'] as StatusFilter[]).map((s) => (
          <Link
            key={s}
            href={`/admin/fact-checks?status=${s}`}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-ui)',
              background: status === s ? 'var(--color-primary)' : 'transparent',
              color: status === s ? '#fff' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-soft)',
              fontWeight: 600,
              textDecoration: 'none',
              textTransform: 'capitalize',
            }}
          >
            {s}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
          No fact-checked alerts match this filter.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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

function Stat({ label, value, sublabel, accent }: { label: string; value: number | string; sublabel?: string; accent?: string }) {
  return (
    <div
      style={{
        padding: '0.75rem 0.875rem',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-background-soft)',
      }}
    >
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: accent ?? 'var(--color-primary)', lineHeight: 1.1, marginTop: '0.25rem' }}>
        {value}
      </div>
      {sublabel && (
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
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
      style={{
        border: '1px solid var(--color-border-soft)',
        borderLeft: `3px solid ${hasFlags ? '#b45309' : '#1e7e34'}`,
        borderRadius: 'var(--radius-card)',
        padding: '1rem 1.125rem',
        background: 'var(--color-background)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '999px', background: 'var(--color-background-soft)', color: 'var(--color-primary)' }}>
            {statusLabel}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            {factCheckAt ? formatTime(factCheckAt) : '—'}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: hasFlags ? '#b45309' : '#1e7e34', fontWeight: 600 }}>
            {claims.length} claim{claims.length !== 1 ? 's' : ''} · {unsupported.length} unsupported
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {hasFlags && <ReverifyButton alertId={alertId} />}
          {hasLikelyWrong && <ReviseButton alertId={alertId} />}
          <Link
            href={`/admin/alerts/${alertId}/edit`}
            style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-ui)', color: 'var(--color-primary)' }}
          >
            Open alert →
          </Link>
        </div>
      </div>
      <div style={{ marginTop: '0.375rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{title}</div>

      {claims.length > 0 && (
        <details style={{ marginTop: '0.625rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)' }}>
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
  const supportedLabel = claim.supported ? '✓ supported' : '✗ unsupported'
  const supportedBg = claim.supported ? '#e6f4ea' : '#fdecea'
  const supportedFg = claim.supported ? '#1e5c2e' : '#7a1f1f'

  return (
    <li
      style={{
        padding: '0.5rem 0.625rem',
        borderRadius: 'var(--radius-ui)',
        border: `1px solid var(--color-border-soft)`,
        background: 'var(--color-background)',
        fontSize: '0.8125rem',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span style={{ padding: '0.125rem 0.4rem', background: supportedBg, color: supportedFg, borderRadius: '3px', fontSize: '0.6875rem', fontFamily: 'var(--font-ui)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {supportedLabel}
        </span>
        {claim.web_verdict && (
          <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-ui)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            web: {claim.web_verdict.replace('_', ' ')}
          </span>
        )}
        {claim.acknowledged && (
          <span style={{ fontSize: '0.6875rem', color: '#1e5c2e', fontFamily: 'var(--font-ui)' }}>
            · acknowledged
          </span>
        )}
      </div>
      <div style={{ marginTop: '0.25rem', fontFamily: 'var(--font-body)' }}>{claim.claim}</div>
      {claim.web_evidence && (
        <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
          {claim.web_evidence}
        </div>
      )}
      {claim.web_url && (
        <a
          href={claim.web_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.75rem', color: 'var(--color-primary)', wordBreak: 'break-all' }}
        >
          {claim.web_url}
        </a>
      )}
    </li>
  )
}
