import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { LinkButton } from '@/components/admin/ui/Button'
import { Badge } from '@/components/admin/ui/Badge'
import { Card } from '@/components/admin/ui/Card'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { publishAlertAction, expireAlertAction } from '../alerts/actions'
import { archiveVariantAction } from './actions'
import ConfirmButton from '@/components/admin/ConfirmButton'

/**
 * Phase 4 v2 — Drafts hub with Smart Views.
 *
 * Smart Views replace the user-assembles-filters model. Six curated entry
 * points cover ~90% of editorial moments. Manual filter chip grid stays
 * available behind a disclosure for power-user / edge-case slicing.
 *
 * URL params:
 *   ?view=needs_review (default) | expiring_soon | socials_pending |
 *         stale_drafts | recently_expired | all
 *   Manual override params (only respected when view=all):
 *     ?format=... ?status=... ?sort=...
 */

type SmartViewKey =
  | 'needs_review'
  | 'published_alerts'
  | 'expiring_soon'
  | 'socials_pending'
  | 'stale_drafts'
  | 'recently_expired'
  | 'all'

type FormatKey =
  | 'all' | 'alert' | 'blog' | 'newsletter'
  | 'facebook' | 'instagram' | 'linkedin' | 'x' | 'threads'
type StatusKey = 'all' | 'draft' | 'needs_review' | 'published' | 'expired' | 'archived'
type SortKey = 'updated' | 'published' | 'expiring'

const SOCIAL_FORMATS = ['facebook', 'instagram', 'linkedin', 'x']
const ALL_FORMATS = ['alert', 'blog', 'newsletter', 'facebook', 'instagram', 'linkedin', 'x', 'threads']

interface SmartView {
  key: SmartViewKey
  label: string
}
// No icons — clean typography + colored count badges carry the visual weight.
const SMART_VIEWS: SmartView[] = [
  { key: 'needs_review',     label: 'Needs review' },
  { key: 'published_alerts', label: 'Published alerts' },
  { key: 'expiring_soon',    label: 'Expiring soon' },
  { key: 'socials_pending',  label: 'Needs socials' },
  { key: 'stale_drafts',     label: 'Stale drafts' },
  { key: 'recently_expired', label: 'Recently expired' },
  { key: 'all',              label: 'Show all' },
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
  topic_title: string
  format: string
  variant_title: string
  status: string
  original_alert_type: string | null
  end_date: string | null
  updated_at: string | null
  published_at: string | null
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return 'just now'
  const mins = Math.round(ms / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  return `${months}mo ago`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// All counts run in parallel via Promise.all. Each is a separate `select(*, count=exact, head=true)`
// query — cheap, indexed, no row payload.
type Supa = ReturnType<typeof createAdminClient>
interface ViewCounts {
  needs_review: number
  published_alerts: number
  expiring_soon: number
  socials_pending: number
  stale_drafts: number
  recently_expired: number
  all: number
  new_since_yesterday: number
}

async function loadViewCounts(supabase: Supa): Promise<ViewCounts> {
  const nowIso = new Date().toISOString()
  const in7dIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const past7dIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const past14dIso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const staleCutoffIso = past7dIso // 7d
  const yesterdayIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [
    needsReview,
    publishedAlerts,
    expiringSoon,
    candidateAlerts, // recent+live published alerts
    topicsWithSocials,
    staleDrafts,
    recentlyExpired,
    all,
    newSinceYesterday,
  ] = await Promise.all([
    supabase.from('content_variants').select('*', { count: 'exact', head: true }).eq('status', 'needs_review'),
    // Published alerts — the editorial library. format=alert + status=published,
    // no recency/expiry filter (those are separate views). This is the
    // "I need to edit a specific published alert" workflow.
    supabase
      .from('content_variants')
      .select('*', { count: 'exact', head: true })
      .eq('format', 'alert')
      .eq('status', 'published'),
    supabase
      .from('content_variants')
      .select('*, topics:topics!inner(end_date)', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('topics.end_date', nowIso)
      .lte('topics.end_date', in7dIso),
    // Socials pending candidate set — published alerts that are RECENT (last 14d)
    // and still LIVE (end_date null or future). Older or expired alerts are
    // missed the window; surfacing them as "pending" is noise.
    supabase
      .from('content_variants')
      .select('topic_id, topics:topics!inner(end_date)')
      .eq('format', 'alert')
      .eq('status', 'published')
      .gte('published_at', past14dIso),
    supabase
      .from('content_variants')
      .select('topic_id')
      .in('format', SOCIAL_FORMATS),
    supabase
      .from('content_variants')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')
      .lt('updated_at', staleCutoffIso),
    supabase
      .from('content_variants')
      .select('*, topics:topics!inner(end_date)', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('topics.end_date', past7dIso)
      .lte('topics.end_date', nowIso),
    supabase.from('content_variants').select('*', { count: 'exact', head: true }),
    supabase.from('content_variants').select('*', { count: 'exact', head: true }).gte('created_at', yesterdayIso),
  ])

  const nowMs = Date.now()
  const candidateRows = (candidateAlerts.data ?? []) as Array<{
    topic_id: string
    topics: { end_date: string | null } | Array<{ end_date: string | null }>
  }>
  const liveTopicIds = new Set(
    candidateRows
      .filter((r) => {
        const t = Array.isArray(r.topics) ? r.topics[0] : r.topics
        // Live = no end_date set OR end_date still in the future
        return !t?.end_date || new Date(t.end_date).getTime() > nowMs
      })
      .map((r) => r.topic_id),
  )
  const topicsThatHaveSocials = new Set((topicsWithSocials.data ?? []).map((r) => r.topic_id))
  const socialsPending = [...liveTopicIds].filter((id) => !topicsThatHaveSocials.has(id)).length

  return {
    needs_review:        needsReview.count ?? 0,
    published_alerts:    publishedAlerts.count ?? 0,
    expiring_soon:       expiringSoon.count ?? 0,
    socials_pending:     socialsPending,
    stale_drafts:        staleDrafts.count ?? 0,
    recently_expired:    recentlyExpired.count ?? 0,
    all:                 all.count ?? 0,
    new_since_yesterday: newSinceYesterday.count ?? 0,
  }
}

type SortBy = 'updated' | 'published' | 'expiring'

async function loadRows(supabase: Supa, view: SmartViewKey, sort: SortBy = 'updated'): Promise<DraftRow[]> {
  const nowIso = new Date().toISOString()
  const in7dIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const past7dIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const past14dIso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('content_variants')
    .select(
      'id, topic_id, format, title, status, original_alert_type, start_date, updated_at, published_at, ' +
      'topics:topics!inner(id, slug, title, end_date, metadata)',
    )
    .limit(200)

  // Sort: dropdown options. "Expiring" sorts soonest first (non-null
  // end_date ascending); rows without end_date fall to the bottom.
  if (sort === 'published') {
    query = query.order('published_at', { ascending: false, nullsFirst: false })
  } else if (sort === 'expiring') {
    query = query.order('topics(end_date)', { ascending: true, nullsFirst: false })
  } else {
    query = query.order('updated_at', { ascending: false, nullsFirst: false })
  }

  if (view === 'needs_review') {
    query = query.eq('status', 'needs_review')
  } else if (view === 'published_alerts') {
    query = query.eq('format', 'alert').eq('status', 'published')
  } else if (view === 'expiring_soon') {
    query = query.eq('status', 'published').gte('topics.end_date', nowIso).lte('topics.end_date', in7dIso)
  } else if (view === 'stale_drafts') {
    query = query.eq('status', 'draft').lt('updated_at', past7dIso)
  } else if (view === 'recently_expired') {
    query = query.eq('status', 'published').gte('topics.end_date', past7dIso).lte('topics.end_date', nowIso)
  } else if (view === 'socials_pending') {
    // "Socials pending" = recent + live published alerts that don't have
    // socials yet. The recency + live filters narrow it from "every
    // published alert ever" to "stuff worth amplifying right now."
    //   • published_at within last 14 days (recent enough to still amplify)
    //   • end_date IS NULL OR end_date > now() (still live, not expired)
    query = query
      .eq('format', 'alert')
      .eq('status', 'published')
      .gte('published_at', past14dIso)
  }
  // all is handled below (no SQL filter)

  const { data: rawRows, error } = await query
  if (error) return []

  // Supabase's joined-select inference collapses with chained .order/.limit/conditional
  // .eq calls — cast to the shape we know the query returns.
  type RawRow = {
    id: string; topic_id: string; format: string; title: string; status: string;
    original_alert_type: string | null; start_date: string | null;
    updated_at: string | null; published_at: string | null;
    topics: { id: string; slug: string; title: string; end_date: string | null; metadata: unknown } | Array<{ id: string; slug: string; title: string; end_date: string | null; metadata: unknown }>;
  }
  let rows: DraftRow[] = ((rawRows ?? []) as unknown as RawRow[]).map((r) => {
    const t = Array.isArray(r.topics) ? r.topics[0] : r.topics
    const alertId = (t?.metadata as { original_alert_id?: string } | null)?.original_alert_id ?? null
    return {
      variant_id: r.id as string,
      alert_id: alertId,
      topic_id: r.topic_id as string,
      topic_title: (t?.title as string) ?? (r.title as string),
      format: r.format as string,
      variant_title: r.title as string,
      status: r.status as string,
      original_alert_type: r.original_alert_type as string | null,
      end_date: (t?.end_date as string | null) ?? null,
      updated_at: r.updated_at as string | null,
      published_at: r.published_at as string | null,
    }
  })

  // Post-filter for socials_pending: drop topics that already have socials,
  // and drop expired alerts (end_date in the past). The SQL already
  // restricted to format=alert + status=published + published in last 14d.
  if (view === 'socials_pending') {
    const { data: allSocials } = await supabase
      .from('content_variants')
      .select('topic_id')
      .in('format', SOCIAL_FORMATS)
    const topicsWithSocials = new Set((allSocials ?? []).map((r) => r.topic_id))
    const nowMs = Date.now()
    rows = rows.filter((r) => {
      if (topicsWithSocials.has(r.topic_id)) return false
      // Drop expired (end_date past) — past the amplification window
      if (r.end_date && new Date(r.end_date).getTime() < nowMs) return false
      return true
    })
  }

  return rows
}

function buildHref(view: SmartViewKey): string {
  if (view === 'needs_review') return '/admin/drafts'  // needs_review is default; clean URL
  return `/admin/drafts?view=${view}`
}

export default async function AdminDraftsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; sort?: string }>
}) {
  const sp = await searchParams
  const validViews: SmartViewKey[] = ['needs_review', 'published_alerts', 'expiring_soon', 'socials_pending', 'stale_drafts', 'recently_expired', 'all']
  const view: SmartViewKey = (sp.view && validViews.includes(sp.view as SmartViewKey) ? sp.view : 'needs_review') as SmartViewKey
  const validSorts: SortBy[] = ['updated', 'published', 'expiring']
  const sort: SortBy = (sp.sort && validSorts.includes(sp.sort as SortBy) ? sp.sort : 'updated') as SortBy

  const supabase = createAdminClient()
  const [counts, rows] = await Promise.all([loadViewCounts(supabase), loadRows(supabase, view, sort)])

  // Subhead summary — only show non-zero counts so it reads as a real status line.
  const summaryParts: string[] = []
  if (counts.needs_review > 0) summaryParts.push(`${counts.needs_review} ${counts.needs_review === 1 ? 'draft needs' : 'drafts need'} review`)
  if (counts.socials_pending > 0) summaryParts.push(`${counts.socials_pending} ${counts.socials_pending === 1 ? 'alert needs' : 'alerts need'} socials`)
  if (counts.new_since_yesterday > 0) summaryParts.push(`${counts.new_since_yesterday} new since yesterday`)
  const summary = summaryParts.length > 0 ? summaryParts.join(' · ') : 'All caught up. Nothing in the queue.'

  const activeView = SMART_VIEWS.find((v) => v.key === view) ?? SMART_VIEWS[0]

  return (
    <div>
      <PageHeader
        title="Drafts"
        description={summary}
        actions={
          <LinkButton href="/admin/alerts/new" variant="primary">
            + New Alert
          </LinkButton>
        }
      />

      {/* Smart Views row */}
      <Card>
        <div
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--admin-text-muted)',
            marginBottom: '0.625rem',
          }}
        >
          Start with
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {SMART_VIEWS.map((v) => {
            const count = counts[v.key]
            const isActive = view === v.key
            return (
              <Link
                key={v.key}
                href={buildHref(v.key)}
                scroll={false}
                className={`smart-view${isActive ? ' smart-view--active' : ''}${count === 0 ? ' smart-view--empty' : ''}`}
              >
                <span>{v.label}</span>
                <span className="smart-view__count">{count}</span>
              </Link>
            )
          })}
        </div>
      </Card>

      {/* Sort dropdown + state line — sort lets the editor reorder
          published alerts (and other views) by recency or expiry, not just
          last-updated. Driven by ?sort= URL param so it survives reloads. */}
      {rows.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            fontSize: '0.8125rem',
            color: 'var(--admin-text-muted)',
            margin: '0.75rem 0 0.5rem 0',
          }}
        >
          <div>
          Showing <strong style={{ color: 'var(--admin-text)' }}>{rows.length}</strong>{' '}
          {(() => {
            if (view === 'socials_pending')   return rows.length === 1 ? 'published alert that needs social variants' : 'published alerts that need social variants'
            if (view === 'expiring_soon')     return rows.length === 1 ? 'alert expiring in the next 7 days' : 'alerts expiring in the next 7 days'
            if (view === 'recently_expired')  return rows.length === 1 ? 'alert that expired recently' : 'alerts that expired recently'
            if (view === 'stale_drafts')      return rows.length === 1 ? 'draft idle for 7+ days' : 'drafts idle for 7+ days'
            if (view === 'needs_review')      return rows.length === 1 ? 'draft needs review' : 'drafts need review'
            if (view === 'published_alerts')  return rows.length === 1 ? 'published alert' : 'published alerts'
            return rows.length === 1 ? 'draft' : 'drafts'
          })()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <label htmlFor="sort-select" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sort by:</label>
            {(['updated', 'published', 'expiring'] as const).map((s) => {
              const params = new URLSearchParams()
              if (view !== 'needs_review') params.set('view', view)
              if (s !== 'updated') params.set('sort', s)
              const qs = params.toString()
              const href = qs ? `/admin/drafts?${qs}` : '/admin/drafts'
              const label = s === 'updated' ? 'Updated' : s === 'published' ? 'Published' : 'Expiring soon'
              const isActive = sort === s
              return (
                <Link
                  key={s}
                  href={href}
                  scroll={false}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.1875rem 0.5rem',
                    borderRadius: '999px',
                    border: '1px solid var(--admin-border)',
                    background: isActive ? 'var(--admin-accent)' : 'transparent',
                    color: isActive ? 'white' : 'var(--admin-text)',
                    textDecoration: 'none',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title={view === 'needs_review' ? 'All caught up' : 'No drafts match this view'}
          description={view === 'needs_review'
            ? 'Nothing waiting for review. Triage some intel or check back later.'
            : 'Try a different Smart View, or hit "Show all" to see everything.'}
        />
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Action</th>
                  <th>Format</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Expires</th>
                  <th style={{ textAlign: 'right' }}>More</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isExpired = r.status === 'published' && r.end_date && new Date(r.end_date).getTime() < Date.now()
                  const displayStatus = isExpired ? 'expired' : r.status
                  const s = STATUS_TONE[displayStatus] ?? STATUS_TONE.draft
                  const formatTone =
                    r.format === 'alert' ? 'accent'
                    : SOCIAL_FORMATS.includes(r.format) ? 'success'  // tinted; using success since blue not on Badge tones
                    : 'neutral'
                  // Social variants surface parent topic title for scannability
                  const displayTitle = SOCIAL_FORMATS.includes(r.format) ? r.topic_title : r.variant_title
                  // Edit link: alerts → alert editor; socials → per-platform editor
                  const editHref = SOCIAL_FORMATS.includes(r.format)
                    ? `/admin/drafts/${r.variant_id}/edit-social`
                    : r.alert_id ? `/admin/alerts/${r.alert_id}/edit` : '#'
                  return (
                    <tr key={r.variant_id}>
                      <td style={{ color: 'var(--admin-text)', fontWeight: 500 }}>
                        <Link href={editHref} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {displayTitle}
                        </Link>
                      </td>
                      {/* Primary action — Publish for drafts, Expire for
                          published. Sits right after Title so it's reachable
                          without horizontal scrolling. */}
                      <td>
                        {r.format === 'alert' && r.alert_id && (r.status === 'draft' || r.status === 'needs_review') && (
                          <form action={publishAlertAction.bind(null, r.alert_id)}>
                            <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">
                              Publish
                            </button>
                          </form>
                        )}
                        {r.format === 'alert' && r.alert_id && r.status === 'published' && !isExpired && (
                          <ConfirmButton
                            action={expireAlertAction.bind(null, r.alert_id)}
                            confirmMessage={`Expire "${r.topic_title}"?\n\nSets end_date=now and hides the alert from active surfaces. URL stays live but reads "expired".`}
                          >
                            Expire
                          </ConfirmButton>
                        )}
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>
                        <Badge tone={formatTone}>{r.format}</Badge>
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)', textTransform: 'capitalize' }}>
                        {(r.original_alert_type ?? '').replace(/_/g, ' ') || '—'}
                      </td>
                      <td>
                        <Badge tone={s.tone}>{s.label}</Badge>
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                        {relativeTime(r.updated_at)}
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                        {r.end_date ? formatDate(r.end_date) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Link
                            href={editHref}
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                          >
                            Edit
                          </Link>
                          <ConfirmButton
                            action={archiveVariantAction.bind(null, r.variant_id) as unknown as () => Promise<unknown>}
                            confirmMessage={`Archive "${r.topic_title}" (${r.format})?\n\nRow drops out of the active queue. Data stays in the DB for audit; find it under the Archived chip if you need it back.`}
                            variant="danger"
                          >
                            Archive
                          </ConfirmButton>
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
