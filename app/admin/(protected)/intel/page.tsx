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
import { rejectIntelAction, unrejectIntelAction, promoteIntelAction, rejectPromotedIntelAction } from './actions'
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
  { value: 'low', label: 'Rumor' },
]

const STATUS_OPTIONS: { value: IntelStatusFilter; label: string }[] = [
  { value: 'unprocessed', label: 'Inbox' },
  { value: 'staged', label: 'Promoted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

const CONFIDENCE_TONE: Record<IntelConfidence, Tone> = {
  high: 'success',
  medium: 'warning',
  low: 'neutral',
}

const CONFIDENCE_LABEL: Record<IntelConfidence, string> = {
  high: 'high',
  medium: 'medium',
  low: 'rumor',
}

const SOURCE_TYPE_STYLE: Record<string, { bg: string; emoji: string }> = {
  official: { bg: '#DCFCE7', emoji: '🏛️' },
  blog: { bg: '#DBEAFE', emoji: '📝' },
  reddit: { bg: '#FED7AA', emoji: '💬' },
  social: { bg: '#FCE7F3', emoji: '📣' },
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

function buildHref(current: SearchParams, overrides: Record<string, string | undefined>): string {
  const params = new URLSearchParams()
  const merged: Record<string, string | undefined> = {
    window: Array.isArray(current.window) ? current.window[0] : current.window,
    confidence: Array.isArray(current.confidence) ? current.confidence[0] : current.confidence,
    status: Array.isArray(current.status) ? current.status[0] : current.status,
    source: Array.isArray(current.source) ? current.source[0] : current.source,
    ...overrides,
  }
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v)
  }
  const qs = params.toString()
  return qs ? `/admin/intel?${qs}` : '/admin/intel'
}

export default async function IntelPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const windowFilter = parseFilter<IntelWindow>(sp.window, ['24h', '7d', '30d', 'all'], '7d')
  const confidence = parseFilter<'all' | IntelConfidence>(sp.confidence, ['all', 'high', 'medium', 'low'], 'all')
  const status = parseFilter<IntelStatusFilter>(sp.status, ['all', 'unprocessed', 'staged', 'rejected'], 'unprocessed')
  const source = (Array.isArray(sp.source) ? sp.source[0] : sp.source) ?? 'all'

  const supabase = createAdminClient()
  const [items, sourceNames, allItems] = await Promise.all([
    listIntelItems(supabase, { window: windowFilter, confidence, status, source }),
    listIntelSourceNames(supabase),
    listIntelItems(supabase, { window: windowFilter, confidence: 'all', status: 'all', source: 'all' }),
  ])

  const counts = {
    total: allItems.length,
    unprocessed: allItems.filter((i) => !i.processed && !i.rejected_at).length,
    staged: allItems.filter((i) => i.processed).length,
    rejected: allItems.filter((i) => !!i.rejected_at).length,
  }

  const countPills: { label: string; count: number; status: IntelStatusFilter; tone: Tone }[] = [
    { label: 'Inbox', count: counts.unprocessed, status: 'unprocessed', tone: 'warning' },
    { label: 'Promoted', count: counts.staged, status: 'staged', tone: 'accent' },
    { label: 'Rejected', count: counts.rejected, status: 'rejected', tone: 'neutral' },
    { label: 'All', count: counts.total, status: 'all', tone: 'neutral' },
  ]

  return (
    <div>
      {/* Phase 1d.2 — soft migration banner. Hard redirect in 1d.3. */}
      <div
        style={{
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          background: 'var(--color-chip-amber-bg)',
          color: 'var(--color-chip-amber-fg)',
          border: '1px solid var(--color-chip-amber)',
          borderRadius: 'var(--admin-radius)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
        }}
      >
        <strong>Moved.</strong> The new unified inbox is at{' '}
        <Link href="/admin/triage" style={{ color: 'var(--admin-accent)', fontWeight: 600 }}>
          /admin/triage
        </Link>
        . This page stays available during Phase 1 of the content-pipeline overhaul, but every new
        feature (chips, snooze, sort-by-attention, Provenance Panel) lives on the new page.
      </div>

      <PageHeader
        title="Triage"
        description="Raw findings from Claude Scout. Paste verified T&Cs (or a waiver reason) on the inbox cards, then promote to alert."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {countPills.map((p) => {
              const active = status === p.status
              return (
                <Link
                  key={p.status}
                  href={buildHref(sp, { status: p.status })}
                  style={{ textDecoration: 'none' }}
                >
                  <Badge tone={active ? p.tone : 'neutral'}>
                    {active ? '● ' : ''}{p.count} {p.label.toLowerCase()}
                  </Badge>
                </Link>
              )
            })}
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

  const sourceStyle = SOURCE_TYPE_STYLE[item.source_type] ?? { bg: '#E5E7EB', emoji: '📄' }

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
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.125rem 0.5rem',
              borderRadius: '999px',
              background: sourceStyle.bg,
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: '#1A1A1A',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <span>{sourceStyle.emoji}</span>
            {item.source_type}
          </span>
          <Badge tone={CONFIDENCE_TONE[item.confidence]}>{CONFIDENCE_LABEL[item.confidence]}</Badge>
          {item.alert_type && <Badge tone="neutral">{item.alert_type}</Badge>}
          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            Pulled {relativeTime(item.created_at)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {staged && item.alert_id && (
            <>
              <Link
                href={`/admin/alerts/${item.alert_id}/edit`}
                className="admin-btn admin-btn-ghost admin-btn-sm"
              >
                → promoted alert
              </Link>
              <form action={rejectPromotedIntelAction.bind(null, item.id)}>
                <button
                  type="submit"
                  className="admin-btn admin-btn-ghost admin-btn-sm"
                  title="Reject this intel and archive its auto-staged alert"
                >
                  Reject (dupe)
                </button>
              </form>
            </>
          )}
          {!staged && !rejected && (
            <>
              <form action={rejectIntelAction.bind(null, item.id)}>
                <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm">Reject</button>
              </form>
            </>
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

      {/* Writer redesign — promote-with-T&Cs form. Pasting verified terms
          (or supplying a waiver reason) up front means the writer sees them
          on the very first draft, not after a regenerate. */}
      {!staged && !rejected && (
        <form
          action={promoteIntelAction.bind(null, item.id)}
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            background: 'var(--admin-surface-alt)',
            borderRadius: 'var(--admin-radius)',
            display: 'grid',
            gap: '0.625rem',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--admin-text-muted)',
            }}
          >
            Promote to alert
          </div>
          <label style={{ display: 'block' }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: 'var(--admin-text-muted)',
                marginBottom: '0.25rem',
              }}
            >
              Verified T&Cs (paste full official terms — writer treats as ground truth)
            </span>
            <textarea
              name="verified_terms"
              rows={3}
              placeholder="Paste official program T&Cs / press release here, or leave blank and supply a waiver reason below."
              className="admin-input"
              style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '0.8125rem' }}
            />
          </label>
          <label style={{ display: 'block' }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: 'var(--admin-text-muted)',
                marginBottom: '0.25rem',
              }}
            >
              OR waiver reason (only if shipping without verified terms)
            </span>
            <textarea
              name="terms_waived_reason"
              rows={2}
              placeholder="e.g. Developing — terms not yet public. Surfaces 'terms unverified' on the public alert."
              className="admin-input"
              style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '0.8125rem' }}
            />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">
              Promote to alert
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
