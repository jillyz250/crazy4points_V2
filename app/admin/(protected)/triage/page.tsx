/**
 * /admin/triage — Phase 1d.3 — unified intake queue with tabs.
 *
 * Tabs: Active / Snoozed / Rejected / Archive / Promoted
 *  - Active default. Hides promoted/rejected/archived/snoozed.
 *  - Sort-by-attention in Active: pending (planner-approved) first, then new,
 *    then freshest within bucket.
 *  - Other tabs filter the queue to their lifecycle state.
 *
 * 1d.4 will add row actions (reject-as-one-liner, snooze picker).
 */
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import {
  ChipRow,
  StatusChip,
  SourceChip,
  ConfidenceChip,
  FactOriginChip,
  EndDateChip,
  RelativeTimeChip,
  ConfirmationCountChip,
  ProgramsChip,
  ProvenancePanel,
  type LifecycleStatus,
  type ConfidenceLevel,
  type FactOrigin,
} from '@/components/admin/chips'
import { SnoozeButton } from '@/components/admin/triage/SnoozeButton'
import { UnsnoozeButton } from '@/components/admin/triage/UnsnoozeButton'
import { RejectButton } from '@/components/admin/triage/RejectButton'
import { RejectedOneLiner as RejectedOneLinerClient } from '@/components/admin/triage/RejectedOneLiner'
import { WriteAlertButton } from '@/components/admin/triage/WriteAlertButton'
import { StageAlertButton } from '@/components/admin/triage/StageAlertButton'

export const dynamic = 'force-dynamic'

type Tab = 'active' | 'snoozed' | 'rejected' | 'archive' | 'promoted'

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'active', label: 'Active' },
  { key: 'snoozed', label: 'Snoozed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'archive', label: 'Archive' },
  // 'Promoted' tab hidden 2026-05-22 — it shows informational counts only
  // (intel items that became alerts) and isn't a to-do list. The tab handler
  // logic + counts stay in case someone navigates to ?tab=promoted directly.
]

interface IntelRow {
  id: string
  headline: string
  raw_text: string | null
  source_name: string | null
  source_url: string | null
  source_type: string | null
  programs: string[] | null
  alert_type: string | null
  confidence: 'high' | 'medium' | 'low' | null
  fact_origin: FactOrigin | null
  triage_decision: string | null
  triage_reasoning: string | null
  triage_decided_at: string | null
  expires_at: string | null
  alert_id: string | null
  rejected_at: string | null
  rejected_reason: string | null
  archived_at: string | null
  snoozed_until: string | null
  confirmation_count: number | null
  confirming_sources: string[] | null
  dup_of_intel_id: string | null
  update_to_alert_id: string | null
  haiku_diff_summary: string | null
  haiku_diff_fail_open: boolean | null
  created_at: string
  processed: boolean | null
}

function deriveStatus(r: IntelRow): LifecycleStatus {
  if (r.archived_at) return 'archived'
  if (r.rejected_at) return 'rejected'
  if (r.snoozed_until && new Date(r.snoozed_until) > new Date()) return 'snoozed'
  if (r.alert_id) return 'published'
  if (r.triage_decision === 'approved') return 'pending'
  if (r.triage_decision === 'rejected') return 'rejected'

  // Auto-approval (Phase 1d.4 trust dial). v9 criteria, cheap subset only:
  //   - high confidence
  //   - fact_origin = official or secondary (not social-rumor / inferred / AI-only)
  //   - 2+ confirmations from later sources
  //   - Haiku diff didn't fail-open (no surfaced uncertainty)
  // The 5th v9 criterion (≥3 historical alerts of same type for program) is
  // deferred until Drafts hub exists — needs a per-row alerts query.
  if (
    r.triage_decision === null &&
    r.confidence === 'high' &&
    (r.fact_origin === 'official' || r.fact_origin === 'secondary') &&
    (r.confirmation_count ?? 0) >= 2 &&
    !r.haiku_diff_fail_open
  ) {
    return 'auto-approved'
  }

  return 'new'
}

/**
 * Sort-by-attention for the Active tab: pending → new → others, then within
 * each bucket by created_at descending.
 */
function attentionRank(r: IntelRow): number {
  const s = deriveStatus(r)
  if (s === 'pending') return 0
  if (s === 'new') return 1
  return 2
}

const SELECT_COLUMNS = [
  'id',
  'headline',
  'raw_text',
  'source_name',
  'source_url',
  'source_type',
  'programs',
  'alert_type',
  'confidence',
  'fact_origin',
  'triage_decision',
  'triage_reasoning',
  'triage_decided_at',
  'expires_at',
  'alert_id',
  'rejected_at',
  'rejected_reason',
  'archived_at',
  'snoozed_until',
  'confirmation_count',
  'confirming_sources',
  'dup_of_intel_id',
  'update_to_alert_id',
  'haiku_diff_summary',
  'haiku_diff_fail_open',
  'created_at',
  'processed',
].join(', ')

export default async function TriagePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: rawTab } = await searchParams
  const tab: Tab = TABS.some((t) => t.key === rawTab) ? (rawTab as Tab) : 'active'
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // Build the per-tab query.
  let q = supabase.from('intel_items').select(SELECT_COLUMNS).limit(150)
  if (tab === 'active') {
    q = q
      .is('rejected_at', null)
      .is('archived_at', null)
      .is('alert_id', null)
      .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)
      .order('created_at', { ascending: false })
  } else if (tab === 'snoozed') {
    q = q
      .is('rejected_at', null)
      .is('archived_at', null)
      .not('snoozed_until', 'is', null)
      .gte('snoozed_until', now)
      .order('snoozed_until', { ascending: true })
  } else if (tab === 'rejected') {
    q = q.not('rejected_at', 'is', null).order('rejected_at', { ascending: false })
  } else if (tab === 'archive') {
    q = q.not('archived_at', 'is', null).order('archived_at', { ascending: false })
  } else if (tab === 'promoted') {
    q = q.not('alert_id', 'is', null).order('created_at', { ascending: false })
  }

  const { data, error } = await q

  // Run count queries for the tab badges. Cheap — each is one COUNT(*) head request.
  const [active, snoozed, rejected, archive, promoted, quarantine] = await Promise.all([
    countActive(supabase, now),
    countSnoozed(supabase, now),
    countSimple(supabase, 'rejected_at'),
    countSimple(supabase, 'archived_at'),
    countSimple(supabase, 'alert_id'),
    countQuarantinePending(supabase),
  ])
  const counts: Record<Tab, number> = { active, snoozed, rejected, archive, promoted }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <PageHeader title="Triage" />
        <p style={{ color: 'var(--admin-danger)' }}>Failed to load intel: {error.message}</p>
      </div>
    )
  }

  let rows = ((data ?? []) as unknown as IntelRow[]) ?? []
  if (tab === 'active') {
    // Apply sort-by-attention on top of the DB order.
    rows = rows.slice().sort((a, b) => {
      const ra = attentionRank(a)
      const rb = attentionRank(b)
      if (ra !== rb) return ra - rb
      // Within bucket, freshest first.
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  return (
    <div>
      <PageHeader
        title="Triage"
        description="Unified intake queue. Every source — Scout, forwarded email, Grok, manual paste — lands here."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge tone={tab === 'active' && rows.length > 0 ? 'warning' : 'neutral'}>
              {rows.length} {tab === 'active' ? 'active item' : tab}
              {rows.length === 1 ? '' : 's'}
            </Badge>
            {quarantine > 0 && (
              <Link
                href="/admin/triage/quarantine"
                style={{
                  padding: '0.25rem 0.625rem',
                  borderRadius: '9999px',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  background: 'var(--color-chip-red-bg)',
                  color: 'var(--color-chip-red-fg)',
                  border: '1px solid var(--color-chip-red)',
                  textDecoration: 'none',
                }}
              >
                {quarantine} in quarantine →
              </Link>
            )}
          </div>
        }
      />

      <Tabs current={tab} counts={counts} />

      {rows.length === 0 ? (
        <EmptyState
          title={emptyTitle(tab)}
          description={emptyDescription(tab)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rows.map((r) => (
            <TriageRow key={r.id} row={r} tab={tab} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function countActive(
  supabase: ReturnType<typeof createAdminClient>,
  nowIso: string,
): Promise<number> {
  const { count } = await supabase
    .from('intel_items')
    .select('*', { count: 'exact', head: true })
    .is('rejected_at', null)
    .is('archived_at', null)
    .is('alert_id', null)
    .or(`snoozed_until.is.null,snoozed_until.lt.${nowIso}`)
  return count ?? 0
}

async function countSnoozed(
  supabase: ReturnType<typeof createAdminClient>,
  nowIso: string,
): Promise<number> {
  const { count } = await supabase
    .from('intel_items')
    .select('*', { count: 'exact', head: true })
    .is('rejected_at', null)
    .is('archived_at', null)
    .not('snoozed_until', 'is', null)
    .gte('snoozed_until', nowIso)
  return count ?? 0
}

async function countSimple(
  supabase: ReturnType<typeof createAdminClient>,
  col: 'rejected_at' | 'archived_at' | 'alert_id',
): Promise<number> {
  const { count } = await supabase
    .from('intel_items')
    .select('*', { count: 'exact', head: true })
    .not(col, 'is', null)
  return count ?? 0
}

async function countQuarantinePending(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<number> {
  const { count } = await supabase
    .from('intel_email_quarantine')
    .select('*', { count: 'exact', head: true })
    .is('promoted_to_intel_id', null)
    .is('discarded_at', null)
  return count ?? 0
}

function emptyTitle(tab: Tab): string {
  if (tab === 'active') return 'Inbox is empty'
  if (tab === 'snoozed') return 'Nothing snoozed'
  if (tab === 'rejected') return 'No rejected items'
  if (tab === 'archive') return 'Archive is empty'
  return 'No promoted items'
}

function emptyDescription(tab: Tab): string {
  if (tab === 'active')
    return "No active intel awaiting your decision. Scout's next run is daily at 10:00 UTC."
  if (tab === 'snoozed') return 'Snoozed items will appear here with their wake date.'
  if (tab === 'rejected') return 'Items you reject (or that fail QA) collapse to one-liners here.'
  if (tab === 'archive')
    return 'Auto-archived items (30 days post-expire) and manually shelved items live here.'
  return 'Items that became alerts will appear here.'
}

// ── Tab strip ──────────────────────────────────────────────────────────────

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
            href={`/admin/triage?tab=${t.key}`}
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
            <span
              style={{
                marginLeft: '0.25rem',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.6875rem',
                fontWeight: 500,
                opacity: 0.85,
              }}
            >
              ({counts[t.key]})
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

// ── Row ────────────────────────────────────────────────────────────────────

function TriageRow({ row, tab }: { row: IntelRow; tab: Tab }) {
  const status = deriveStatus(row)
  const isRejectedTab = tab === 'rejected'

  // 1d.4 will turn rejected rows into true one-liners. For 1d.3 we keep the
  // card layout but dim it and collapse the body.
  if (isRejectedTab) {
    return (
      <RejectedOneLinerClient
        row={{
          id: row.id,
          headline: row.headline,
          source_name: row.source_name,
          source_url: row.source_url,
          raw_text: row.raw_text,
          rejected_at: row.rejected_at,
          rejected_reason: row.rejected_reason,
        }}
      />
    )
  }

  const provenance = {
    source_name: row.source_name ?? '(unknown)',
    source_url: row.source_url,
    confidence: row.confidence ?? undefined,
    fact_origin: row.fact_origin ?? undefined,
    arrived_at: row.created_at,
    confirmation_count: row.confirmation_count ?? 0,
    confirming_sources: row.confirming_sources ?? [],
    haiku_diff_summary: row.haiku_diff_summary,
  }
  const isWritable = !row.alert_id && !row.rejected_at && !row.archived_at

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
            fontSize: '1.0625rem',
            fontWeight: 600,
            color: 'var(--admin-accent)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {row.alert_id ? (
            <Link
              href={`/admin/alerts/${row.alert_id}`}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {row.headline}
            </Link>
          ) : (
            row.headline
          )}
        </h3>
      </header>

      {/* Top 4 priority: status → programs (core editorial signal) → confidence → time.
          Source / fact-origin / end-date / confirmations fall behind +more. */}
      <ChipRow maxVisible={4}>
        <StatusChip status={status} />
        <ProgramsChip slugs={row.programs} />
        {row.confidence ? <ConfidenceChip level={row.confidence as ConfidenceLevel} /> : null}
        <RelativeTimeChip timestamp={row.created_at} />
        {row.source_name ? <SourceChip name={row.source_name} /> : null}
        {row.expires_at ? <EndDateChip endsAt={row.expires_at} /> : null}
        {row.fact_origin ? <FactOriginChip origin={row.fact_origin} /> : null}
        {(row.confirmation_count ?? 0) > 0 ? (
          <ConfirmationCountChip
            count={row.confirmation_count ?? 0}
            sources={row.confirming_sources ?? null}
          />
        ) : null}
      </ChipRow>

      {row.snoozed_until && new Date(row.snoozed_until) > new Date() && (
        <div
          style={{
            marginTop: '0.625rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--color-chip-purple-bg)',
            color: 'var(--color-chip-purple-fg)',
            border: '1px solid var(--color-chip-purple)',
            borderRadius: 'var(--admin-radius)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
          }}
        >
          Snoozed until{' '}
          {new Date(row.snoozed_until).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </div>
      )}

      {row.update_to_alert_id && row.haiku_diff_summary && (
        <div
          style={{
            marginTop: '0.625rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--color-chip-amber-bg)',
            color: 'var(--color-chip-amber-fg)',
            border: '1px solid var(--color-chip-amber)',
            borderRadius: 'var(--admin-radius)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
          }}
        >
          <strong>Updates existing alert:</strong> {row.haiku_diff_summary}{' '}
          <Link
            href={`/admin/alerts/${row.update_to_alert_id}`}
            style={{ color: 'var(--admin-accent)', marginLeft: '0.25rem' }}
          >
            (review)
          </Link>
        </div>
      )}

      {row.triage_reasoning && (
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--admin-text)',
            marginTop: '0.625rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--admin-surface-alt)',
            borderRadius: 'var(--admin-radius)',
            borderLeft: '3px solid var(--admin-accent)',
          }}
        >
          <strong
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--admin-text-muted)',
              marginRight: '0.5rem',
            }}
          >
            Planner says
          </strong>
          {row.triage_reasoning}
        </div>
      )}

      {row.raw_text && (
        <details style={{ marginTop: '0.625rem' }}>
          <summary
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
              color: 'var(--admin-text-muted)',
              cursor: 'pointer',
            }}
          >
            Raw intel text
          </summary>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              marginTop: '0.5rem',
              whiteSpace: 'pre-wrap',
              color: 'var(--admin-text)',
            }}
          >
            {row.raw_text}
          </div>
        </details>
      )}

      <ProvenancePanel data={provenance} />

      <RowActions row={row} tab={tab} isWritable={isWritable} />
    </article>
  )
}

function RowActions({ row, tab, isWritable }: { row: IntelRow; tab: Tab; isWritable: boolean }) {
  const isSnoozedNow =
    row.snoozed_until && new Date(row.snoozed_until) > new Date()

  if (tab === 'snoozed' || isSnoozedNow) {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
        <UnsnoozeButton intelId={row.id} />
      </div>
    )
  }

  if (!isWritable) return null

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
      <WriteAlertButton intelId={row.id} />
      <StageAlertButton intelId={row.id} />
      <SnoozeButton intelId={row.id} />
      <RejectButton intelId={row.id} />
    </div>
  )
}
