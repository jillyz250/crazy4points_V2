import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { countUnresolvedSystemErrors, getRefreshQueueCount, getRefreshQueue, listReminders } from '@/utils/supabase/queries'
import { countHardcodedHits } from '@/utils/programs/auditHardcodedCounts'
import RemindersWidget from '@/components/admin/reminders/RemindersWidget'
import ContentRoadmapCard from '@/components/admin/ContentRoadmapCard'
import JillsTakesCard from '@/components/admin/JillsTakesCard'
import { isPresaleListing } from '@/lib/experiences/presale'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { LinkButton } from '@/components/admin/ui/Button'
import { Badge } from '@/components/admin/ui/Badge'

export const dynamic = 'force-dynamic'

// A listing worth Jill's editorial review: marquee experiences, dropping boring
// card-member presales (concerts/shows/games) — EXCEPT Marriott Moments, which
// are points experiences (bid/redeem) despite their music/sports theming.
type ReviewableExperience = { title: string; detail_url: string | null; category?: string | null; program_slug?: string | null }
function reviewableExperience(e: ReviewableExperience): boolean {
  return !isPresaleListing(e.category) || e.program_slug === 'marriott-bonvoy'
}

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
  { title: 'Programs', description: 'Loyalty programs that alerts can be tagged against.', href: '/admin/programs', cta: 'Manage' },
  { title: 'Content Ideas', description: 'Long-form ideas generated during the daily brief.', href: '/admin/content-ideas', cta: 'View' },
  { title: 'Newsletter', description: 'Compose and send weekly newsletter.', href: '/admin/newsletter', cta: 'Open' },
  { title: 'Subscribers', description: 'Newsletter subscribers. Active/inactive counts.', href: '/admin/subscribers', cta: 'Manage' },
  { title: 'Daily Briefs', description: 'Preview past daily briefs in-app.', href: '/admin/briefs', cta: 'View' },
  { title: 'Jobs', description: 'Manually trigger scout or brief runs.', href: '/admin/jobs', cta: 'Run' },
  { title: 'Fact Checks', description: 'Claim-level drill-down and flag-rate stats.', href: '/admin/fact-checks', cta: 'View' },
  { title: 'Errors', description: 'Background-job failures. Resolve after investigating.', href: '/admin/errors', cta: 'View' },
  { title: 'Refresh Queue', description: 'Editorial content due for re-verification (cards, programs, properties).', href: '/admin/refresh-queue', cta: 'View' },
  { title: 'Scrapes', description: 'Auto-refresh history from Firecrawl scrapes of program pages.', href: '/admin/scrapes', cta: 'View' },
  { title: 'Data Integrity', description: 'Daily structural audit of the program/transfer graph — orphan/junk slugs, ratios, dupes.', href: '/admin/data-integrity', cta: 'View' },
  { title: 'Change Signals', description: 'Daily newsroom/blog scan for transfer-partner & ratio changes affecting our data.', href: '/admin/change-signals', cta: 'Review' },
  { title: 'Program-Fact Drift', description: 'Where fresh intel contradicts a program page (award charts, tiers, partners, fees). Surfaced in the Daily Digest.', href: '/admin/program-drift', cta: 'Review' },
  { title: 'Welcome-Bonus Signals', description: "Daily scan of each card's welcome-bonus source page; flags live sign-up bonuses that differ from our data.", href: '/admin/card-bonus-signals', cta: 'Review' },
  { title: 'Re-verification', description: 'Weekly sweep comparing our transfer ratios to current rosters; flags discrepancies.', href: '/admin/verification-findings', cta: 'Review' },
  { title: 'AI Usage', description: 'Anthropic API spend by day, caller, and model.', href: '/admin/ai-usage', cta: 'View' },
  { title: 'Analytics', description: 'GA4 — active users, key events, top cities, top pages.', href: '/admin/analytics', cta: 'View' },
]

async function loadStats() {
  const supabase = createAdminClient()
  const nowIso = new Date().toISOString()
  // "Today's slice" window — drafts/intel that arrived since ~yesterday, so the
  // daily checklist shows what's NEW to act on, not the whole cumulative pile.
  const since = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()

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
    tokenCandidates,
    bonusSignals,
    changeSignals,
    proseReview,
    newDrafts,
    newIntel,
    newExperiences,
    sweepsRunning,
    sweepsNeedPost,
  ] = await Promise.all([
    // Match the /admin/drafts "Needs review" chip exactly: needs_review variants
    // that are NOT currently snoozed (snoozed-but-not-woken live under their own
    // chip). Counting raw alerts.status='pending_review' here over-counted
    // because it ignored snooze + the content_variants source of truth.
    supabase
      .from('content_variants')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'needs_review')
      .or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`),
    // Intel that genuinely still needs a triage DECISION — triage_decision is
    // null (the AI sweep hasn't ruled yet). The card is labelled "needing a
    // decision", so already-decided items don't belong: approved and
    // newsletter_idea have been decided and flow onward (drafting / the weekly
    // newsletter), AI-rejected clears on its own, and expired/snoozed are out.
    // (Counting approved+newsletter_idea here overstated the number badly — most
    // days the AI decides everything, leaving a handful truly undecided.)
    supabase
      .from('intel_items')
      .select('id', { count: 'exact', head: true })
      .eq('processed', false)
      .is('rejected_at', null)
      .is('triage_decision', null)
      .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
      .or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`),
    supabase.from('content_ideas').select('id', { count: 'exact', head: true }).in('status', ['new', 'queued', 'drafted']),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('active', true),
    countUnresolvedSystemErrors(supabase),
    supabase.from('daily_briefs').select('brief_date, sent_at').order('brief_date', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('newsletters').select('week_of, status').order('week_of', { ascending: false }).limit(1).maybeSingle(),
    getRefreshQueueCount(supabase),
    getRefreshQueue(supabase, { limit: 5 }),
    countHardcodedHits(supabase).catch(() => 0),
    supabase.from('card_bonus_signals').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('change_signals').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    // Only count reviews that are actually DUE (review_at <= now). Future-dated
    // reminders (e.g. "revert this elevated offer on Aug 27") shouldn't inflate
    // the "to re-check" number until they come due.
    supabase.from('credit_cards').select('id', { count: 'exact', head: true }).lte('good_to_know_review_at', nowIso),
    // Today's slice: drafts that became needs_review in the last ~36h
    supabase
      .from('content_variants')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'needs_review')
      .gte('created_at', since),
    // Today's slice: intel that arrived in the last ~36h still needing a decision
    supabase
      .from('intel_items')
      .select('id', { count: 'exact', head: true })
      .eq('processed', false)
      .is('rejected_at', null)
      .is('archived_at', null)
      .is('triage_decision', null)
      .gte('created_at', since),
    // Experiences: new listings first seen in the last ~36h (dashboard alert).
    // Fetch the rows, not just a count, so the card can name and link the
    // listing instead of making Jill hunt for which one is new.
    // "New to review" = active listings first-seen recently that Jill hasn't
    // reviewed yet AND aren't boring card-member presales (concerts/shows/games).
    // EXCEPTION: Marriott Bonvoy Moments are music/sports/entertainment themed but
    // are real points experiences (you bid/redeem points), so Jill reviews them.
    // Filtering happens in JS below (category values are messy).
    // NO time window: an experience stays in this count until Jill has LOOKED at it
    // (editorial_reviewed_at set) — deciding one in the morning routine clears it.
    // Only still-bookable ones (not past their close date) count.
    supabase
      .from('experience_listings')
      .select('title, detail_url, first_seen_at, category, program_slug, editorial_reviewed_at')
      .eq('status', 'active')
      .is('editorial_reviewed_at', null)
      .or(`close_date.is.null,close_date.gte.${new Date().toISOString()}`)
      .order('first_seen_at', { ascending: false }),
    // Sweepstakes currently running (the daily sweepstakes-watch feeds this).
    supabase.from('sweepstakes').select('id', { count: 'exact', head: true }).eq('status', 'running'),
    // Running sweepstakes we haven't posted to social yet — the "do a post" nudge.
    supabase
      .from('sweepstakes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'running')
      .eq('posted_social', false),
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
    tokenCandidates,
    bonusSignals: bonusSignals.count ?? 0,
    changeSignals: changeSignals.count ?? 0,
    proseReview: proseReview.count ?? 0,
    newDrafts: newDrafts.count ?? 0,
    newIntel: newIntel.count ?? 0,
    // Surface marquee experiences to review: drop card-member presales (concerts/
    // shows/games) EXCEPT Marriott Moments, which are points experiences worth reviewing.
    newExperiences: (newExperiences.data ?? []).filter((e) => reviewableExperience(e as ReviewableExperience)).length,
    newExperienceItems: ((newExperiences.data ?? []) as Array<ReviewableExperience>).filter(reviewableExperience),
    sweepsRunning: sweepsRunning.count ?? 0,
    sweepsNeedPost: sweepsNeedPost.count ?? 0,
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
  const reminders = await listReminders(createAdminClient())

  const statCards: { label: string; value: number | string; tone: Tone; href: string; hint?: string }[] = [
    {
      label: 'Pending review',
      value: stats.pendingReview,
      tone: stats.pendingReview > 0 ? 'warning' : 'neutral',
      href: '/admin/drafts?view=needs_review',
      hint: stats.pendingReview > 0 ? 'needs approve/reject' : 'all clear',
    },
    {
      label: 'Welcome-bonus changes',
      value: stats.bonusSignals,
      tone: stats.bonusSignals > 0 ? 'warning' : 'neutral',
      href: '/admin/card-bonus-signals',
      hint: stats.bonusSignals > 0 ? "cards whose live SUB changed" : 'all current',
    },
    {
      label: 'Transfer-data changes',
      value: stats.changeSignals,
      tone: stats.changeSignals > 0 ? 'warning' : 'neutral',
      href: '/admin/change-signals',
      hint: stats.changeSignals > 0 ? 'newsroom scan: verify vs our data' : 'all reviewed',
    },
    {
      label: 'Intel to triage',
      value: stats.unprocessedIntel,
      tone: stats.unprocessedIntel > 0 ? 'warning' : 'neutral',
      href: '/admin/triage',
      hint: stats.unprocessedIntel > 0 ? 'open items needing a decision' : 'queue clear',
    },
    {
      label: 'New experiences',
      value: stats.newExperiences,
      tone: stats.newExperiences > 0 ? 'warning' : 'neutral',
      // Link straight to the newest listing (or the directory if several), and
      // name it in the hint so there is nothing to hunt for. Self-clears after
      // ~36h - no dismiss needed.
      href:
        stats.newExperiences === 1 && stats.newExperienceItems[0]?.detail_url
          ? stats.newExperienceItems[0].detail_url
          : '/experiences',
      hint:
        stats.newExperiences === 0
          ? 'no new listings'
          : stats.newExperiences === 1
            ? stats.newExperienceItems[0]?.title ?? 'new listing since yesterday'
            : `${stats.newExperiences} new since yesterday - consider a post`,
    },
    {
      label: 'Sweepstakes running',
      value: stats.sweepsRunning,
      // Accent when there are ones to post about, neutral when all posted/none.
      tone: stats.sweepsNeedPost > 0 ? 'accent' : stats.sweepsRunning > 0 ? 'success' : 'neutral',
      href: '/admin/sweepstakes',
      hint:
        stats.sweepsRunning === 0
          ? 'none live right now'
          : stats.sweepsNeedPost > 0
            ? `${stats.sweepsNeedPost} need a social post`
            : 'all posted',
    },
    {
      label: 'Open content ideas',
      value: stats.openIdeas,
      tone: stats.openIdeas > 250 ? 'warning' : 'accent',
      href: '/admin/content-ideas',
      hint: stats.openIdeas > 250 ? 'backing up - sweep may be stalled' : 'fresh ideas (stale ones auto-bank after 30d)',
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
      label: 'Token candidates',
      value: stats.tokenCandidates,
      tone: stats.tokenCandidates > 0 ? 'warning' : 'success',
      href: '/admin/tokens',
      hint: stats.tokenCandidates > 0 ? 'untokenized partner counts' : 'all tokenized',
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

      {/* Queues first — the actual "what needs attention right now". */}
      <div style={{ marginBottom: '0.75rem', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
        Needs attention
      </div>
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

      <JillsTakesCard />

      <ContentRoadmapCard />

      {/* Reminders — collapsed card (no longer dominating the top). */}
      {reminders.length > 0 && (
        <details style={{ marginBottom: '1.5rem', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', background: 'var(--admin-card-bg)' }}>
          <summary style={{ cursor: 'pointer', padding: '0.875rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--admin-text)' }}>
            Reminders ({reminders.length})
          </summary>
          <div style={{ padding: '0 1.25rem 1rem' }}>
            <RemindersWidget reminders={reminders} />
          </div>
        </details>
      )}

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
