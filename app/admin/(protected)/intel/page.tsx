import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import {
  listIntelItems,
  listIntelSourceNames,
  type IntelItem,
  type IntelConfidence,
  type IntelStatusFilter,
  type IntelWindow,
} from '@/utils/supabase/queries'
import { rejectIntelAction, unrejectIntelAction } from './actions'

export const dynamic = 'force-dynamic'

const WINDOW_OPTIONS: { value: IntelWindow; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All' },
]

const CONFIDENCE_OPTIONS: { value: 'all' | IntelConfidence; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const STATUS_OPTIONS: { value: IntelStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unprocessed', label: 'Unprocessed' },
  { value: 'staged', label: 'Staged' },
  { value: 'rejected', label: 'Rejected' },
]

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

function parseFilter<T extends string>(value: string | string[] | undefined, allowed: readonly T[], fallback: T): T {
  const v = Array.isArray(value) ? value[0] : value
  return (allowed as readonly string[]).includes(v ?? '') ? (v as T) : fallback
}

type SearchParams = { [key: string]: string | string[] | undefined }

export default async function IntelPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const windowFilter = parseFilter<IntelWindow>(sp.window, ['24h', '7d', '30d', 'all'], '24h')
  const confidence = parseFilter<'all' | IntelConfidence>(sp.confidence, ['all', 'high', 'medium', 'low'], 'all')
  const status = parseFilter<IntelStatusFilter>(sp.status, ['all', 'unprocessed', 'staged', 'rejected'], 'all')
  const source = (Array.isArray(sp.source) ? sp.source[0] : sp.source) ?? 'all'

  const supabase = createAdminClient()
  const [items, sourceNames] = await Promise.all([
    listIntelItems(supabase, { window: windowFilter, confidence, status, source }),
    listIntelSourceNames(supabase),
  ])

  const counts = {
    total: items.length,
    unprocessed: items.filter((i) => !i.processed && !i.rejected_at).length,
    staged: items.filter((i) => i.processed).length,
    rejected: items.filter((i) => !!i.rejected_at).length,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
        <h1 style={{ margin: 0 }}>Intel Items</h1>
        <div style={{ display: 'flex', gap: '1.25rem', fontFamily: 'var(--font-ui)', fontSize: '0.875rem' }}>
          <Count label="total" value={counts.total} />
          <Count label="unprocessed" value={counts.unprocessed} />
          <Count label="staged" value={counts.staged} accent="var(--color-primary)" />
          <Count label="rejected" value={counts.rejected} />
        </div>
      </div>
      <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
        Raw findings from Claude Scout. High-confidence items auto-stage as <code>pending_review</code> alerts.
      </p>

      <form
        method="get"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          background: 'var(--color-background-soft)',
          border: '1px solid var(--color-border-soft)',
          borderRadius: 'var(--radius-card)',
          marginBottom: '1.25rem',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.875rem',
        }}
      >
        <FilterSelect name="window" label="Window" value={windowFilter} options={WINDOW_OPTIONS} />
        <FilterSelect name="confidence" label="Confidence" value={confidence} options={CONFIDENCE_OPTIONS} />
        <FilterSelect name="status" label="Status" value={status} options={STATUS_OPTIONS} />
        <FilterSelect
          name="source"
          label="Source"
          value={source}
          options={[{ value: 'all', label: 'All' }, ...sourceNames.map((s) => ({ value: s, label: s }))]}
        />
        <button type="submit" className="rg-btn-primary" style={{ alignSelf: 'flex-end' }}>
          Apply
        </button>
        <Link href="/admin/intel" style={{ alignSelf: 'flex-end', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          Reset
        </Link>
      </form>

      {items.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
          No intel items match these filters.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((it) => (
            <IntelCard key={it.id} item={it} />
          ))}
        </div>
      )}
    </div>
  )
}

function Count({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <span>
      <strong style={{ color: accent ?? 'var(--color-text-primary)' }}>{value}</strong>{' '}
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    </span>
  )
}

function FilterSelect<T extends string>({
  name,
  label,
  value,
  options,
}: {
  name: string
  label: string
  value: T
  options: { value: string; label: string }[]
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
      <select
        name={name}
        defaultValue={value}
        style={{
          padding: '0.375rem 0.5rem',
          borderRadius: 'var(--radius-ui)',
          border: '1px solid var(--color-border-soft)',
          background: 'var(--color-background)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.875rem',
          minWidth: '9rem',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

const confidenceColor: Record<IntelConfidence, { bg: string; fg: string }> = {
  high: { bg: '#E8F5E9', fg: '#2E7D32' },
  medium: { bg: '#FFF7E0', fg: '#8A6D00' },
  low: { bg: '#F5F5F5', fg: '#757575' },
}

function IntelCard({ item }: { item: IntelItem }) {
  const rejected = !!item.rejected_at
  const staged = item.processed
  const conf = confidenceColor[item.confidence]

  return (
    <div
      style={{
        border: '1px solid var(--color-border-soft)',
        borderLeft: `3px solid ${rejected ? '#bbb' : staged ? 'var(--color-primary)' : 'var(--color-accent)'}`,
        borderRadius: 'var(--radius-card)',
        padding: '1rem 1.125rem',
        background: 'var(--color-background)',
        opacity: rejected ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <Chip>{item.source_name}</Chip>
          <Chip subtle>{item.source_type}</Chip>
          <Chip bg={conf.bg} fg={conf.fg}>
            {item.confidence}
          </Chip>
          {item.alert_type && <Chip subtle>{item.alert_type}</Chip>}
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)' }}>
            {relativeTime(item.created_at)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {staged && item.alert_id && (
            <Link
              href={`/admin/alerts/${item.alert_id}/edit`}
              style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-ui)', color: 'var(--color-primary)' }}
            >
              → staged alert
            </Link>
          )}
          {!staged && !rejected && (
            <form action={rejectIntelAction.bind(null, item.id)}>
              <SmallButton>Reject</SmallButton>
            </form>
          )}
          {rejected && (
            <form action={unrejectIntelAction.bind(null, item.id)}>
              <SmallButton>Unreject</SmallButton>
            </form>
          )}
        </div>
      </div>

      <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600 }}>
        {item.source_url ? (
          <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-primary)' }}>
            {item.headline}
          </a>
        ) : (
          item.headline
        )}
      </div>

      {item.programs && item.programs.length > 0 && (
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {item.programs.map((p) => (
            <Chip key={p} subtle>
              {p}
            </Chip>
          ))}
        </div>
      )}

      {item.raw_text && (
        <details style={{ marginTop: '0.5rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)' }}>
            Raw text
          </summary>
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.625rem',
              background: 'var(--color-background-soft)',
              borderRadius: 'var(--radius-ui)',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-body)',
              whiteSpace: 'pre-wrap',
              color: 'var(--color-text-secondary)',
            }}
          >
            {item.raw_text}
          </div>
        </details>
      )}
    </div>
  )
}

function Chip({
  children,
  bg,
  fg,
  subtle,
}: {
  children: React.ReactNode
  bg?: string
  fg?: string
  subtle?: boolean
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.125rem 0.5rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-ui)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        background: bg ?? (subtle ? 'var(--color-background-soft)' : 'var(--color-primary)'),
        color: fg ?? (subtle ? 'var(--color-text-secondary)' : '#fff'),
      }}
    >
      {children}
    </span>
  )
}

function SmallButton({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </button>
  )
}
