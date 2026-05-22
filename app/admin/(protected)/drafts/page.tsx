import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { LinkButton } from '@/components/admin/ui/Button'
import { Badge } from '@/components/admin/ui/Badge'
import { Card } from '@/components/admin/ui/Card'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { publishAlertAction, expireAlertAction } from '../alerts/actions'
import ConfirmButton from '@/components/admin/ConfirmButton'

/**
 * Phase 4 — Unified Drafts hub.
 *
 * Reads from content_variants directly (the source of truth post-Wave 3a)
 * and joins topics for slug + summary. Filter chips lean on the columns
 * promoted in migration 327 (voice_pass, confidence_level, action_type,
 * variant_schema_version) so they're indexed, not jsonb scans.
 *
 * Invariant D1 — bare /admin/drafts shows ALL formats. Filtering happens
 * only when a chip is selected. Future-proofs for blog + social variants.
 *
 * URL params:
 *   ?format=alert|blog|all       (default: all)
 *   ?status=published|...|all    (default: all)
 *   ?voice=fail                  (only show voice_pass=false)
 *   ?sort=updated|voice|start    (default: updated)
 */

type FormatKey =
  | 'all' | 'alert' | 'blog' | 'newsletter'
  | 'facebook' | 'instagram' | 'linkedin' | 'x' | 'threads'
type StatusKey = 'all' | 'draft' | 'needs_review' | 'published' | 'expired' | 'archived'
type SortKey = 'updated' | 'published' | 'expiring'

type ChipTone = 'neutral' | 'purple' | 'green' | 'red' | 'amber' | 'blue' | 'muted'

// Per-chip tone — color semantic that survives both inactive (tinted text)
// and active (full color fill) states. See .chip--<tone> in globals.css.
const FORMAT_OPTIONS: { key: FormatKey; label: string; tone: ChipTone }[] = [
  { key: 'all',        label: 'All',        tone: 'neutral' },
  { key: 'alert',      label: 'Alerts',     tone: 'purple' },
  { key: 'blog',       label: 'Blog',       tone: 'purple' },
  { key: 'newsletter', label: 'Newsletter', tone: 'purple' },
  { key: 'facebook',   label: 'Facebook',   tone: 'blue' },
  { key: 'instagram',  label: 'Instagram',  tone: 'blue' },
  { key: 'linkedin',   label: 'LinkedIn',   tone: 'blue' },
  { key: 'x',          label: 'X',          tone: 'blue' },
  { key: 'threads',    label: 'Threads',    tone: 'blue' },
]

const STATUS_OPTIONS: { key: StatusKey; label: string; tone: ChipTone }[] = [
  { key: 'all',          label: 'All',          tone: 'neutral' },
  { key: 'needs_review', label: 'Needs review', tone: 'amber' },
  { key: 'draft',        label: 'Draft',        tone: 'neutral' },
  { key: 'published',    label: 'Published',    tone: 'green' },
  // Expired is derived: variant.status stays 'published' but topic.end_date
  // is in the past. The trigger projects 'expired' on the alerts mirror.
  { key: 'expired',      label: 'Expired',      tone: 'red' },
  { key: 'archived',     label: 'Archived',     tone: 'muted' },
]

const SORT_OPTIONS: { key: SortKey; label: string; tone: ChipTone }[] = [
  { key: 'updated',   label: 'Recently edited',  tone: 'neutral' },
  { key: 'published', label: 'Recently published', tone: 'neutral' },
  { key: 'expiring',  label: 'Expires soonest',  tone: 'neutral' },
]

const STATUS_TONE: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' | 'accent' }> = {
  published:    { label: 'Published', tone: 'success' },
  draft:        { label: 'Draft', tone: 'neutral' },
  needs_review: { label: 'Needs review', tone: 'warning' },
  approved:     { label: 'Approved', tone: 'success' },
  archived:     { label: 'Archived', tone: 'neutral' },
  expired:      { label: 'Expired', tone: 'accent' },
}

interface DraftRow {
  variant_id: string
  alert_id: string | null
  topic_id: string
  slug: string
  format: string
  title: string
  status: string
  voice_pass: boolean | null
  voice_score: number | null
  confidence_level: string | null
  action_type: string | null
  original_alert_type: string | null
  start_date: string | null
  short_slug: string | null
  end_date: string | null
  updated_at: string | null
}

function buildHref(
  params: { format?: FormatKey; status?: StatusKey; voice?: 'fail'; sort?: SortKey },
  override: Partial<typeof params>,
): string {
  const merged = { ...params, ...override }
  const qs = new URLSearchParams()
  if (merged.format && merged.format !== 'all') qs.set('format', merged.format)
  if (merged.status && merged.status !== 'all') qs.set('status', merged.status)
  if (merged.voice === 'fail') qs.set('voice', 'fail')
  if (merged.sort && merged.sort !== 'updated') qs.set('sort', merged.sort)
  const s = qs.toString()
  return s ? `/admin/drafts?${s}` : '/admin/drafts'
}

export default async function AdminDraftsPage({
  searchParams,
}: {
  searchParams: Promise<{ format?: string; status?: string; voice?: string; sort?: string }>
}) {
  const sp = await searchParams
  const VALID_FORMATS = ['alert', 'blog', 'newsletter', 'facebook', 'instagram', 'linkedin', 'x', 'threads']
  const format = (sp.format && VALID_FORMATS.includes(sp.format) ? sp.format : 'all') as FormatKey
  const status = (sp.status && ['draft', 'needs_review', 'published', 'expired', 'archived'].includes(sp.status) ? sp.status : 'all') as StatusKey
  const voice: 'fail' | undefined = sp.voice === 'fail' ? 'fail' : undefined
  const sort = (sp.sort && ['updated', 'published', 'expiring'].includes(sp.sort) ? sp.sort : 'updated') as SortKey
  const filters: { format: FormatKey; status: StatusKey; voice: 'fail' | undefined; sort: SortKey } = {
    format, status, voice, sort,
  }

  const supabase = createAdminClient()
  let query = supabase
    .from('content_variants')
    .select(
      'id, topic_id, format, title, status, voice_pass, voice_score, confidence_level, action_type, original_alert_type, start_date, short_slug, updated_at, published_at, topics:topics!inner(id, slug, end_date, metadata)',
    )

  if (format !== 'all') query = query.eq('format', format)
  // Expired is derived: variant.status='published' AND topic.end_date is past.
  // The trigger projects 'expired' to alerts.status but variant stays
  // published; filter is computed in JS after fetch so we keep all the
  // indexed-column wins on the base query.
  if (status !== 'all' && status !== 'expired') query = query.eq('status', status)
  if (status === 'expired') query = query.eq('status', 'published')
  if (voice === 'fail') query = query.eq('voice_pass', false)

  if (sort === 'published') query = query.order('published_at', { ascending: false, nullsFirst: false })
  else if (sort === 'expiring') query = query.order('end_date', { referencedTable: 'topics', ascending: true, nullsFirst: false })
  else query = query.order('updated_at', { ascending: false, nullsFirst: false })

  query = query.limit(200)
  const { data: rawRows, error } = await query

  if (error) {
    return (
      <div>
        <PageHeader title="Drafts" description="Unified hub for every content variant." />
        <Card>
          <p style={{ color: 'var(--admin-danger)' }}>Failed to load drafts: {error.message}</p>
        </Card>
      </div>
    )
  }

  const nowMs = Date.now()
  let rows: DraftRow[] = (rawRows ?? []).map((r) => {
    const t = Array.isArray(r.topics) ? r.topics[0] : r.topics
    const alertId = (t?.metadata as { original_alert_id?: string } | null)?.original_alert_id ?? null
    return {
      variant_id: r.id as string,
      alert_id: alertId,
      topic_id: r.topic_id as string,
      slug: (t?.slug as string) ?? '',
      format: r.format as string,
      title: r.title as string,
      status: r.status as string,
      voice_pass: r.voice_pass as boolean | null,
      voice_score: r.voice_score as number | null,
      confidence_level: r.confidence_level as string | null,
      action_type: r.action_type as string | null,
      original_alert_type: r.original_alert_type as string | null,
      start_date: r.start_date as string | null,
      short_slug: r.short_slug as string | null,
      end_date: (t?.end_date as string | null) ?? null,
      updated_at: r.updated_at as string | null,
    }
  })

  // Apply the derived expired/published distinction:
  //   • "Published" chip wants ONLY currently-live rows (end_date null or in future)
  //   • "Expired" chip wants ONLY rows whose end_date is past
  // Both queries pulled status='published'; this split happens in JS.
  if (status === 'expired') {
    rows = rows.filter(r => r.end_date && new Date(r.end_date).getTime() < nowMs)
  } else if (status === 'published') {
    rows = rows.filter(r => !r.end_date || new Date(r.end_date).getTime() >= nowMs)
  }

  return (
    <div>
      <PageHeader
        title="Drafts"
        description="Every content variant — alerts today, blog + social as those formats come online."
        actions={
          <LinkButton href="/admin/alerts/new" variant="primary">
            + New Alert
          </LinkButton>
        }
      />

      {/* Filter chip rows — format, status, voice failure toggle, sort.
          Phase 4 ships Alert only; other formats greyed but visible so the
          hub reads as a multi-format home from day one (D1 invariant). */}
      <Card>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <ChipRow
            label="Format"
            options={FORMAT_OPTIONS.map((o) => ({
              key: o.key,
              label: o.label,
              tone: o.tone,
              active: filters.format === o.key,
              href: buildHref(filters, { format: o.key }),
            }))}
          />
          <ChipRow
            label="Status"
            options={STATUS_OPTIONS.map((o) => ({
              key: o.key,
              label: o.label,
              tone: o.tone,
              active: filters.status === o.key,
              href: buildHref(filters, { status: o.key }),
            }))}
          />
          <ChipRow
            label="Filters"
            options={[
              {
                key: 'voice-fail',
                label: '✗ Voice failed',
                tone: 'red' as ChipTone,
                active: filters.voice === 'fail',
                href: buildHref(filters, { voice: filters.voice === 'fail' ? undefined : 'fail' }),
              },
            ]}
          />
          <ChipRow
            label="Sort"
            options={SORT_OPTIONS.map((o) => ({
              key: o.key,
              label: o.label,
              tone: o.tone,
              active: filters.sort === o.key,
              href: buildHref(filters, { sort: o.key }),
            }))}
          />
        </div>
      </Card>

      <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
        {rows.length} {rows.length === 1 ? 'draft' : 'drafts'}
        {rows.length === 200 && ' (showing first 200)'}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No drafts match these filters" description="Loosen the filters or create a new draft." />
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Format</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Voice</th>
                  <th>Expires</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  // Derive "expired" badge: variant.status stays 'published',
                  // but if topic.end_date is past, surface it as Expired.
                  const isExpired = r.status === 'published' && r.end_date && new Date(r.end_date).getTime() < nowMs
                  const displayStatus = isExpired ? 'expired' : r.status
                  const s = STATUS_TONE[displayStatus] ?? STATUS_TONE.draft
                  const voiceCell =
                    r.voice_pass === true ? (
                      <Badge tone="success">✓ {r.voice_score ?? ''}</Badge>
                    ) : r.voice_pass === false ? (
                      <Badge tone="danger">✗ {r.voice_score ?? ''}</Badge>
                    ) : (
                      <span style={{ color: 'var(--admin-text-muted)' }}>—</span>
                    )
                  return (
                    <tr key={r.variant_id}>
                      <td style={{ color: 'var(--admin-text)', fontWeight: 500 }}>{r.title}</td>
                      <td style={{ color: 'var(--admin-text-muted)', textTransform: 'capitalize' }}>{r.format}</td>
                      <td style={{ color: 'var(--admin-text-muted)', textTransform: 'capitalize' }}>
                        {(r.original_alert_type ?? '').replace(/_/g, ' ') || '—'}
                      </td>
                      <td>
                        <Badge tone={s.tone}>{s.label}</Badge>
                      </td>
                      <td>{voiceCell}</td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>
                        {r.end_date
                          ? new Date(r.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                          {/* Format-aware edit link — socials get their own per-platform editor */}
                          {['facebook', 'instagram', 'linkedin', 'x'].includes(r.format) ? (
                            <Link
                              href={`/admin/drafts/${r.variant_id}/edit-social`}
                              className="admin-btn admin-btn-ghost admin-btn-sm"
                            >
                              Edit
                            </Link>
                          ) : r.alert_id && (
                            <Link
                              href={`/admin/alerts/${r.alert_id}/edit`}
                              className="admin-btn admin-btn-ghost admin-btn-sm"
                            >
                              Edit
                            </Link>
                          )}
                          {r.alert_id && (r.status === 'draft' || r.status === 'needs_review') && (
                            <form action={publishAlertAction.bind(null, r.alert_id)}>
                              <button type="submit" className="admin-btn admin-btn-secondary admin-btn-sm">
                                Publish
                              </button>
                            </form>
                          )}
                          {r.alert_id && r.status === 'published' && (
                            <ConfirmButton
                              // Server action bound with the alert id — bind returns a
                              // serializable reference; an inline closure over
                              // expireAlertAction would crash with "Functions cannot be
                              // passed directly to Client Components".
                              action={expireAlertAction.bind(null, r.alert_id)}
                              confirmMessage={`Expire "${r.title}"?\n\nThis sets end_date=now and hides the alert from active surfaces. URL stays live but reads "expired". You can restore by clearing end_date on the topic.`}
                            >
                              Expire
                            </ConfirmButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

function ChipRow({
  label,
  options,
}: {
  label: string
  options: { key: string; label: string; active: boolean; href: string; tone?: ChipTone }[]
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
      <span
        style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--admin-text-muted)',
          marginRight: '0.5rem',
          minWidth: '4.5rem',
        }}
      >
        {label}
      </span>
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          className={`chip chip--${o.tone ?? 'neutral'}${o.active ? ' chip--active' : ''}`}
          scroll={false}
        >
          {o.label}
        </Link>
      ))}
    </div>
  )
}
