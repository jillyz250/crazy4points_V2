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
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

export const dynamic = 'force-dynamic'

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'info'

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

const CONFIDENCE_TONE: Record<IntelConfidence, Tone> = {
  high: 'success',
  medium: 'warning',
  low: 'neutral',
}

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
      <PageHeader
        title="Intel Items"
        description="Raw findings from Claude Scout. High-confidence items auto-stage as pending_review alerts."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Badge tone="neutral">{counts.total} total</Badge>
            <Badge tone="neutral">{counts.unprocessed} unprocessed</Badge>
            <Badge tone="accent">{counts.staged} staged</Badge>
            <Badge tone="neutral">{counts.rejected} rejected</Badge>
          </div>
        }
      />

      <Card style={{ marginBottom: '1rem', padding: '0.875rem 1rem' }}>
        <form method="get" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
          <FilterSelect name="window" label="Window" value={windowFilter} options={WINDOW_OPTIONS} />
          <FilterSelect name="confidence" label="Confidence" value={confidence} options={CONFIDENCE_OPTIONS} />
          <FilterSelect name="status" label="Status" value={status} options={STATUS_OPTIONS} />
          <FilterSelect
            name="source"
            label="Source"
            value={source}
            options={[{ value: 'all', label: 'All' }, ...sourceNames.map((s) => ({ value: s, label: s }))]}
          />
          <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">
            Apply
          </button>
          <Link href="/admin/intel" className="admin-btn admin-btn-ghost admin-btn-sm">
            Reset
          </Link>
        </form>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="No intel items" description="No items match these filters." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {items.map((it) => (
            <IntelCard key={it.id} item={it} />
          ))}
        </div>
      )}
    </div>
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
      <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--admin-text-muted)', fontWeight: 600 }}>
        {label}
      </span>
      <select name={name} defaultValue={value} className="admin-input" style={{ minWidth: '9rem' }}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function IntelCard({ item }: { item: IntelItem }) {
  const rejected = !!item.rejected_at
  const staged = item.processed
  const borderColor = rejected
    ? 'var(--admin-border-strong)'
    : staged
      ? 'var(--admin-accent)'
      : 'var(--admin-warning)'

  return (
    <div
      className="admin-card"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        padding: '0.875rem 1rem',
        opacity: rejected ? 0.65 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge tone="neutral">{item.source_name}</Badge>
          <Badge tone="neutral">{item.source_type}</Badge>
          <Badge tone={CONFIDENCE_TONE[item.confidence]}>{item.confidence}</Badge>
          {item.alert_type && <Badge tone="neutral">{item.alert_type}</Badge>}
          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            {relativeTime(item.created_at)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {staged && item.alert_id && (
            <Link
              href={`/admin/alerts/${item.alert_id}/edit`}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              → staged alert
            </Link>
          )}
          {!staged && !rejected && (
            <form action={rejectIntelAction.bind(null, item.id)}>
              <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm">Reject</button>
            </form>
          )}
          {rejected && (
            <form action={unrejectIntelAction.bind(null, item.id)}>
              <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm">Unreject</button>
            </form>
          )}
        </div>
      </div>

      <div style={{ marginTop: '0.5rem', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--admin-text)' }}>
        {item.source_url ? (
          <a href={item.source_url} target="_blank" rel="noopener noreferrer">
            {item.headline}
          </a>
        ) : (
          item.headline
        )}
      </div>

      {item.programs && item.programs.length > 0 && (
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {item.programs.map((p) => (
            <Badge key={p} tone="neutral">{p}</Badge>
          ))}
        </div>
      )}

      {item.raw_text && (
        <details style={{ marginTop: '0.5rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            Raw text
          </summary>
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.625rem',
              background: 'var(--admin-surface-alt)',
              borderRadius: 'var(--admin-radius)',
              fontSize: '0.8125rem',
              whiteSpace: 'pre-wrap',
              color: 'var(--admin-text-muted)',
            }}
          >
            {item.raw_text}
          </div>
        </details>
      )}
    </div>
  )
}
