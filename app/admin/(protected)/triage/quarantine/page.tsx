/**
 * /admin/triage/quarantine — Phase 2a.4 — review emails held by the inbound
 * handler because they came from senders not on the allowlist.
 *
 * Three filter tabs: Pending review / Promoted / Discarded.
 * Each row: chips (sender, when, reason), expandable sanitized body, two
 * actions (Promote → ingest + allowlist sender; Discard → mark reviewed).
 */
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { Chip, RelativeTimeChip } from '@/components/admin/chips'
import { promoteQuarantine, discardQuarantine } from './actions'

export const dynamic = 'force-dynamic'

type Tab = 'pending' | 'promoted' | 'discarded'

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'pending', label: 'Pending review' },
  { key: 'promoted', label: 'Promoted' },
  { key: 'discarded', label: 'Discarded' },
]

interface QuarantineRow {
  id: string
  received_at: string
  sender_email: string
  sender_domain: string | null
  subject: string | null
  raw_payload: Record<string, unknown>
  reason: string
  promoted_to_intel_id: string | null
  discarded_at: string | null
  discard_note: string | null
}

const REASON_LABEL: Record<string, string> = {
  sender_not_allowlisted: 'Sender not allowlisted',
  dkim_fail: 'DKIM failed',
  spf_fail: 'SPF failed',
  oversized: 'Oversized (>1MB)',
  parse_failure: 'Parse failure',
  suspicious_pattern: 'Suspicious pattern',
}

export default async function QuarantinePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: rawTab } = await searchParams
  const tab: Tab = TABS.some((t) => t.key === rawTab) ? (rawTab as Tab) : 'pending'
  const supabase = createAdminClient()

  let q = supabase
    .from('intel_email_quarantine')
    .select(
      'id, received_at, sender_email, sender_domain, subject, raw_payload, reason, promoted_to_intel_id, discarded_at, discard_note',
    )
    .order('received_at', { ascending: false })
    .limit(100)

  if (tab === 'pending') {
    q = q.is('promoted_to_intel_id', null).is('discarded_at', null)
  } else if (tab === 'promoted') {
    q = q.not('promoted_to_intel_id', 'is', null)
  } else if (tab === 'discarded') {
    q = q.not('discarded_at', 'is', null)
  }

  const { data, error } = await q

  // Counts for tab badges
  const [pending, promoted, discarded] = await Promise.all([
    countWhere(supabase, 'pending'),
    countWhere(supabase, 'promoted'),
    countWhere(supabase, 'discarded'),
  ])
  const counts: Record<Tab, number> = { pending, promoted, discarded }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <PageHeader title="Quarantine" />
        <p style={{ color: 'var(--admin-danger)' }}>Failed to load quarantine: {error.message}</p>
      </div>
    )
  }

  const rows = ((data ?? []) as unknown as QuarantineRow[]) ?? []

  return (
    <div>
      <PageHeader
        title="Email quarantine"
        description="Inbound emails held because the sender wasn't on the allowlist (or failed DKIM/SPF). Promote to add the sender + run the email through the pipeline, or Discard to dismiss."
        actions={
          <Badge tone={pending > 0 ? 'warning' : 'neutral'}>
            {pending} pending{pending === 1 ? '' : ''}
          </Badge>
        }
      />

      <div style={{ marginBottom: '1rem' }}>
        <Link
          href="/admin/triage"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
            color: 'var(--admin-text-muted)',
            textDecoration: 'underline',
          }}
        >
          ← Back to Triage
        </Link>
      </div>

      <Tabs current={tab} counts={counts} />

      {rows.length === 0 ? (
        <EmptyState title={emptyTitle(tab)} description={emptyDescription(tab)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rows.map((r) => (
            <QuarantineRowCard key={r.id} row={r} tab={tab} />
          ))}
        </div>
      )}
    </div>
  )
}

async function countWhere(
  supabase: ReturnType<typeof createAdminClient>,
  bucket: Tab,
): Promise<number> {
  let q = supabase.from('intel_email_quarantine').select('*', { count: 'exact', head: true })
  if (bucket === 'pending') q = q.is('promoted_to_intel_id', null).is('discarded_at', null)
  else if (bucket === 'promoted') q = q.not('promoted_to_intel_id', 'is', null)
  else if (bucket === 'discarded') q = q.not('discarded_at', 'is', null)
  const { count } = await q
  return count ?? 0
}

function emptyTitle(tab: Tab): string {
  if (tab === 'pending') return 'No emails awaiting review'
  if (tab === 'promoted') return 'Nothing promoted yet'
  return 'Nothing discarded yet'
}

function emptyDescription(tab: Tab): string {
  if (tab === 'pending')
    return 'When a forwarded email arrives from a sender not on your allowlist, it shows up here.'
  if (tab === 'promoted')
    return 'Emails you accepted and ran through the pipeline appear here.'
  return 'Emails you dismissed without promoting appear here.'
}

function Tabs({ current, counts }: { current: Tab; counts: Record<Tab, number> }) {
  return (
    <nav
      style={{
        display: 'flex',
        gap: '0.375rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
      }}
    >
      {TABS.map((t) => {
        const active = t.key === current
        return (
          <Link
            key={t.key}
            href={`/admin/triage/quarantine?tab=${t.key}`}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '9999px',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              textDecoration: 'none',
              background: active ? 'var(--admin-accent)' : 'var(--admin-surface)',
              color: active ? '#fff' : 'var(--admin-text)',
              border: '1px solid ' + (active ? 'var(--admin-accent)' : 'var(--admin-border)'),
            }}
          >
            {t.label}{' '}
            <span style={{ marginLeft: '0.25rem', fontSize: '0.6875rem', opacity: 0.85 }}>
              ({counts[t.key]})
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

function QuarantineRowCard({ row, tab }: { row: QuarantineRow; tab: Tab }) {
  const payload = row.raw_payload ?? {}
  const html =
    typeof payload === 'object' && 'html_sanitized' in (payload as Record<string, unknown>)
      ? String((payload as Record<string, unknown>).html_sanitized ?? '')
      : ''
  const text =
    typeof payload === 'object' && 'text' in (payload as Record<string, unknown>)
      ? String((payload as Record<string, unknown>).text ?? '')
      : ''

  const isActionable = tab === 'pending'

  return (
    <article
      style={{
        padding: '1rem 1.125rem',
        border: '1px solid var(--admin-border)',
        borderRadius: 'var(--admin-radius-lg)',
        background: 'var(--admin-surface)',
        boxShadow: 'var(--admin-shadow)',
      }}
    >
      <header style={{ marginBottom: '0.5rem' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--admin-accent)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {row.subject ?? '(no subject)'}
        </h3>
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.375rem' }}>
        <Chip color="grey" label={`From: ${row.sender_email}`} />
        <Chip color="red" label={REASON_LABEL[row.reason] ?? row.reason} />
        <RelativeTimeChip timestamp={row.received_at} />
        {row.promoted_to_intel_id && (
          <Chip color="green" label="Promoted" title={`intel_id: ${row.promoted_to_intel_id}`} />
        )}
        {row.discarded_at && <Chip color="grey" label="Discarded" />}
      </div>

      {(html || text) && (
        <details style={{ marginTop: '0.75rem' }}>
          <summary
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
              color: 'var(--admin-text-muted)',
              cursor: 'pointer',
            }}
          >
            View sanitized body
          </summary>
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              background: 'var(--admin-surface-alt)',
              border: '1px solid var(--admin-border)',
              borderRadius: 'var(--admin-radius)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'var(--admin-text)',
              maxHeight: '20rem',
              overflowY: 'auto',
            }}
          >
            {html ? (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'var(--font-body)' }}>
                {text.slice(0, 4000)}
              </pre>
            )}
          </div>
        </details>
      )}

      {row.discard_note && (
        <div
          style={{
            marginTop: '0.5rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'var(--admin-text-muted)',
            fontStyle: 'italic',
          }}
        >
          Discard note: {row.discard_note}
        </div>
      )}

      {isActionable && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          <form action={promoteQuarantine}>
            <input type="hidden" name="quarantine_id" value={row.id} />
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                background: 'var(--admin-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--admin-radius)',
                cursor: 'pointer',
              }}
            >
              Promote (allowlist + ingest)
            </button>
          </form>
          <form action={discardQuarantine}>
            <input type="hidden" name="quarantine_id" value={row.id} />
            <button
              type="submit"
              style={{
                padding: '0.5rem 0.875rem',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                background: 'transparent',
                color: 'var(--admin-text-muted)',
                border: '1px solid var(--admin-border)',
                borderRadius: 'var(--admin-radius)',
                cursor: 'pointer',
              }}
            >
              Discard
            </button>
          </form>
        </div>
      )}
    </article>
  )
}
