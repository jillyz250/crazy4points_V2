import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { countUnresolvedSystemErrors, getRefreshQueueCount, getRefreshQueue } from '@/utils/supabase/queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { LinkButton } from '@/components/admin/ui/Button'
import { Badge } from '@/components/admin/ui/Badge'

export const dynamic = 'force-dynamic'

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'info'

type Tile = {
  title: string
  description: string
  href: string
  cta?: string
}

const TILES: Tile[] = [
  { title: 'Alerts', description: 'Draft, approve, and publish alerts. Review Scout-generated drafts.', href: '/admin/alerts', cta: 'Manage' },
  { title: 'Sources', description: 'Intelligence sources scraped by Claude Scout.', href: '/admin/sources', cta: 'Manage' },
  { title: 'Intel', description: 'Raw findings from Claude Scout. Filter and reject noise.', href: '/admin/intel', cta: 'View' },
  { title: 'Programs', description: 'Loyalty programs that alerts can be tagged against.', href: '/admin/programs', cta: 'Manage' },
  { title: 'Content Ideas', description: 'Long-form ideas generated during the daily brief.', href: '/admin/content-ideas', cta: 'View' },
  { title: 'Newsletter', description: 'Compose and send weekly newsletter.', href: '/admin/newsletter', cta: 'Open' },
  { title: 'Subscribers', description: 'Newsletter subscribers. Active/inactive counts.', href: '/admin/subscribers', cta: 'Manage' },
  { title: 'Daily Briefs', description: 'Preview past daily briefs in-app.', href: '/admin/briefs', cta: 'View' },
  { title: 'Jobs', description: 'Manually trigger scout or brief runs.', href: '/admin/jobs', cta: 'Run' },
  { title: 'Fact Checks', description: 'Claim-level drill-down and flag-rate stats.', href: '/admin/fact-checks', cta: 'View' },
  { title: 'Errors', description: 'Background-job failures. Resolve after investigating.', href: '/admin/errors', cta: 'View' },
  { title: 'Refresh Queue', description: 'Editorial content due for re-verification (cards, programs, properties).', href: '/admin/refresh-queue', cta: 'View' },
]

async function loadStats() {
  const supabase = createAdminClient()
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [
    pendingReview,
    unprocessedIntel,
    openIdeas,
    activeSubs,
    unresolvedErrors,
    lastBrief,
    currentNewsletter,
    refreshQueueCount,
    refreshQueueTopFive,
  ] = await Promise.all([
    supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
    supabase.from('intel_items').select('id', { count: 'exact', head: true }).eq('processed', false).is('rejected_at', null).gte('created_at', dayAgo),
    supabase.from('content_ideas').select('id', { count: 'exact', head: true }).in('status', ['new', 'queued', 'drafted']),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('active', true),
    countUnresolvedSystemErrors(supabase),
    supabase.from('daily_briefs').select('brief_date, sent_at').order('brief_date', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('newsletters').select('week_of, status').order('week_of', { ascending: false }).limit(1).maybeSingle(),
    getRefreshQueueCount(supabase),
    getRefreshQueue(supabase, { limit: 5 }),
  ])

  return {
    pendingReview: pendingReview.count ?? 0,
    unprocessedIntel: unprocessedIntel.count ?? 0,
    openIdeas: openIdeas.count ?? 0,
    activeSubs: activeSubs.count ?? 0,
    unresolvedErrors,
    lastBrief: lastBrief.data as { brief_date: string; sent_at: string | null } | null,
    currentNewsletter: currentNewsletter.data as { week_of: string; status: string } | null,
    refreshQueueCount,
    refreshQueueTopFive,
  }
}

function relativeDay(iso: string | null | undefined): string {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  const hours = ms / (1000 * 60 * 60)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${Math.round(hours)}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export default async function AdminDashboard() {
  const stats = await loadStats()

  const statCards: { label: string; value: number | string; tone: Tone; href: string; hint?: string }[] = [
    {
      label: 'Pending review',
      value: stats.pendingReview,
      tone: stats.pendingReview > 0 ? 'warning' : 'neutral',
      href: '/admin/alerts',
      hint: stats.pendingReview > 0 ? 'needs approve/reject' : 'all clear',
    },
    {
      label: 'Unprocessed intel (24h)',
      value: stats.unprocessedIntel,
      tone: 'neutral',
      href: '/admin/intel',
      hint: 'auto-staged when high confidence',
    },
    {
      label: 'Open content ideas',
      value: stats.openIdeas,
      tone: 'accent',
      href: '/admin/content-ideas',
      hint: 'new + queued + drafted',
    },
    {
      label: 'Active subscribers',
      value: stats.activeSubs,
      tone: 'success',
      href: '/admin/subscribers',
    },
    {
      label: 'Unresolved errors',
      value: stats.unresolvedErrors,
      tone: stats.unresolvedErrors > 0 ? 'danger' : 'success',
      href: '/admin/errors',
      hint: stats.unresolvedErrors > 0 ? 'investigate' : 'none open',
    },
    {
      label: 'Refresh queue',
      value: stats.refreshQueueCount,
      tone: stats.refreshQueueCount > 50 ? 'danger' : stats.refreshQueueCount > 0 ? 'warning' : 'success',
      href: '/admin/refresh-queue',
      hint: stats.refreshQueueCount > 0 ? 'cards / programs / properties' : 'all current',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="What needs attention right now, and quick access to everything else."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.625rem',
          marginBottom: '1.5rem',
        }}
      >
        {statCards.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Card style={{ padding: '0.875rem 1rem', height: '100%' }}>
              <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 600, color: `var(--admin-${s.tone === 'neutral' ? 'text' : s.tone})`, lineHeight: 1.1, marginTop: '0.375rem' }}>
                {s.value}
              </div>
              {s.hint && (
                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.25rem' }}>
                  {s.hint}
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Card style={{ padding: '0.875rem 1rem' }}>
          <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: '0.5rem' }}>
            Latest daily brief
          </div>
          {stats.lastBrief ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 500 }}>{stats.lastBrief.brief_date}</span>
              <Badge tone="neutral">built {relativeDay(stats.lastBrief.sent_at)}</Badge>
              <Link href="/admin/briefs" style={{ fontSize: '0.8125rem', marginLeft: 'auto' }}>Open →</Link>
            </div>
          ) : (
            <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)' }}>No briefs yet.</div>
          )}
        </Card>

        <Card style={{ padding: '0.875rem 1rem' }}>
          <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: '0.5rem' }}>
            Current newsletter
          </div>
          {stats.currentNewsletter ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 500 }}>Week of {stats.currentNewsletter.week_of}</span>
              <Badge tone={stats.currentNewsletter.status === 'sent' ? 'success' : stats.currentNewsletter.status === 'failed' ? 'danger' : 'accent'}>
                {stats.currentNewsletter.status}
              </Badge>
              <Link href="/admin/newsletter" style={{ fontSize: '0.8125rem', marginLeft: 'auto' }}>Open →</Link>
            </div>
          ) : (
            <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)' }}>No drafts yet.</div>
          )}
        </Card>
      </div>

      {stats.refreshQueueTopFive.length > 0 && (
        <Card style={{ padding: '0.875rem 1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
            <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
              Refresh queue — top 5 oldest
            </div>
            <Link href="/admin/refresh-queue" style={{ fontSize: '0.8125rem' }}>See all {stats.refreshQueueCount} →</Link>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {stats.refreshQueueTopFive.map((item) => (
              <li key={`${item.entity_type}-${item.entity_id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.75rem', minWidth: '5rem' }}>
                  {item.entity_type.replace(/^program_/, '').replace(/_/g, ' ')}
                </span>
                <Link href={item.edit_url} style={{ flex: 1, fontWeight: 500 }}>
                  {item.entity_name}
                </Link>
                <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.75rem' }}>
                  {item.last_verified ? `${item.age_days}d` : 'never'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div style={{ marginBottom: '0.75rem', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
        All sections
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {TILES.map((tile) => (
          <Card key={tile.href}>
            <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', height: '100%' }}>
              <h2 style={{ margin: 0, fontSize: '0.9375rem' }}>{tile.title}</h2>
              <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.5, color: 'var(--admin-text-muted)', flex: 1 }}>
                {tile.description}
              </p>
              <div style={{ marginTop: '0.25rem' }}>
                <LinkButton href={tile.href} variant="ghost" size="sm">
                  {tile.cta ?? 'Open'} →
                </LinkButton>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
