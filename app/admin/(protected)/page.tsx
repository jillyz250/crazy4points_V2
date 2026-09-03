import Link from 'next/link'
import Image from 'next/image'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createAdminClient } from '@/utils/supabase/server'
import { computeMeters } from '@/lib/orgMeters'
import { computeAging, overdueOnly } from '@/lib/orgAging'
import { buildQueue, meterCells, Icon, Ring, todayLong } from '@/components/admin/preview/kit'
import Notepad from '@/components/admin/dashboard/Notepad'
import MyTasks from '@/components/admin/dashboard/MyTasks'
import AllClearArt from '@/components/admin/AllClearArt'
import { activityStyle, type ActivityRow } from '@/lib/admin/activityStyle'
import type { DashboardNote } from '@/app/admin/(protected)/notes-actions'
import type { JillTask } from '@/app/admin/(protected)/tasks-actions'

export const dynamic = 'force-dynamic'

const PURPLE = 'var(--color-primary)'
const GOLD = 'var(--color-accent)'
const DISPLAY = 'var(--font-display)'
const UP = 'var(--admin-success)'

type Emp = {
  id: string; slug: string; name: string; role_title: string | null
  kind: 'owner' | 'chief' | 'agent'; emoji: string | null; image_url: string | null
  status: string; responsibilities: string[] | null
}

function overall(m: ReturnType<typeof computeMeters>): number {
  return Math.round((m.morale.value + m.momentum.value + m.performance.value) / 3)
}
const healthColor = (v: number) => (v >= 85 ? GOLD : v >= 55 ? PURPLE : v >= 40 ? 'var(--admin-warning)' : 'var(--admin-danger)')

function timeAgo(iso: string): string {
  const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

async function tableCount(table: string, activeOnly = false): Promise<number | null> {
  try {
    const db = createAdminClient()
    const base = db.from(table).select('*', { count: 'exact', head: true })
    const { count } = await (activeOnly ? base.eq('active', true) : base)
    return count ?? null
  } catch { return null }
}

/**
 * Filtered "needs action" count — same try/catch-returns-null shape as
 * tableCount, but the caller supplies the WHERE clauses. Used for the New
 * experiences / New sweepstakes queue counts (these are filtered queues, not
 * totals, so tableCount's active/total switch doesn't fit).
 */
async function filteredCount(
  build: (db: ReturnType<typeof createAdminClient>) => PromiseLike<{ count: number | null }>,
): Promise<number | null> {
  try {
    const { count } = await build(createAdminClient())
    return count ?? null
  } catch { return null }
}

// ── Real subscriber trend from subscribed_at (reused from the Pulse mockup) ──
// Only the delta is needed for Direction #1 (Stat + Delta); it stays honest —
// if signups slowed, the chip goes down/red. No faked "up".
type Trend = { last7: number; prev7: number; delta: number }

async function subscriberTrend(): Promise<Trend | null> {
  try {
    const db = createAdminClient()
    const { data } = await db.from('subscribers').select('subscribed_at').not('subscribed_at', 'is', null)
    const times = ((data ?? []) as { subscribed_at: string }[])
      .map((r) => Date.parse(r.subscribed_at))
      .filter((n) => !Number.isNaN(n))
    const wk = (from: number, to: number) => times.filter((t) => t > from && t <= to).length
    const nowMs = Date.now()
    const last7 = wk(nowMs - 7 * 864e5, nowMs)
    const prev7 = wk(nowMs - 14 * 864e5, nowMs - 7 * 864e5)
    return { last7, prev7, delta: last7 - prev7 }
  } catch { return null }
}

function DeltaChip({ delta, unit = '' }: { delta: number; unit?: string }) {
  if (delta === 0) return <span className="dh-delta dh-delta-flat">&plusmn;0{unit}</span>
  const up = delta > 0
  return (
    <span className={`dh-delta ${up ? 'dh-delta-up' : 'dh-delta-down'}`}>
      <Icon name="trending" size={11} style={up ? undefined : { transform: 'scaleY(-1)' }} />
      {up ? '+' : ''}{delta}{unit}
    </span>
  )
}

export default async function AdminDashboard() {
  const db = createAdminClient()
  const nowIso = new Date().toISOString()
  const [
    { data: empData }, { data: logData }, { data: notesData }, { data: tasksData }, { data: p1Data },
    { data: activityData },
    alertsCount, programsCount, subsCount, subsTrend, newExperiences, newSweepstakes, pendingDecisions,
    triageCount, draftCount, errorCount,
  ] = await Promise.all([
    db.from('employees').select('id, slug, name, role_title, kind, emoji, image_url, status, responsibilities'),
    db.from('employee_logs').select('employee_id, type, created_at'),
    db.from('dashboard_notes').select('id, body, sent_to_takes, created_at, updated_at').order('created_at', { ascending: false }).limit(50),
    db.from('jill_tasks').select('id, title, done, source, link, created_at, done_at').order('created_at', { ascending: false }).limit(100),
    // Open P1s across the team — the small "everyone's on-fire items" glance.
    db.from('employee_tasks').select('id, employee_slug, title, status, priority').eq('priority', 'P1').neq('status', 'done').order('created_at', { ascending: true }),
    // Team-wide activity chain (mig 666) — what the team shipped, newest first.
    db.from('employee_activity').select('id, employee_slug, action, summary, ref_type, ref_id, link, created_at').order('created_at', { ascending: false }).limit(12),
    tableCount('alerts'),
    tableCount('programs'),
    tableCount('subscribers', true),
    subscriberTrend(),
    // New experiences = unreviewed AND still actionable (active + not closed) —
    // matches the /admin/experiences review queue this badge links to.
    filteredCount((c) =>
      c.from('experience_listings').select('*', { count: 'exact', head: true })
        .is('editorial_reviewed_at', null)
        .eq('status', 'active')
        .or(`close_date.is.null,close_date.gte.${nowIso}`)),
    // New sweepstakes = running AND not yet reviewed (matches /admin/sweepstakes).
    filteredCount((c) =>
      c.from('sweepstakes').select('*', { count: 'exact', head: true })
        .eq('status', 'running')
        .is('reviewed_at', null)),
    // Pending proposed decisions — the Decision Log queue awaiting Jill's yes/no.
    filteredCount((c) =>
      c.from('decision_log').select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('mode', 'proposed')),
    // Live command-center queue counts (replace the old hardcoded sample numbers).
    filteredCount((c) => c.from('intel_items').select('*', { count: 'exact', head: true })
      .eq('processed', false).is('rejected_at', null).is('archived_at', null)),
    filteredCount((c) => c.from('content_variants').select('*', { count: 'exact', head: true })
      .eq('status', 'needs_review')),
    filteredCount((c) => c.from('system_errors').select('*', { count: 'exact', head: true })
      .is('resolved_at', null)),
  ])
  const emps = (empData ?? []) as Emp[]
  const notes = (notesData ?? []) as DashboardNote[]
  const tasks = (tasksData ?? []) as JillTask[]
  // Open P1s across the team, paired with each owner's name for the glance.
  const empName: Record<string, string> = {}
  const empEmoji: Record<string, string> = {}
  for (const e of emps) { empName[e.slug] = e.name; if (e.emoji) empEmoji[e.slug] = e.emoji }
  const teamP1s = ((p1Data ?? []) as { id: string; employee_slug: string; title: string; status: string; priority: string }[])
    .map((t) => ({ ...t, owner: empName[t.employee_slug] ?? t.employee_slug }))
  // Team-wide activity chain, each row joined to its person (name + emoji). Falls
  // back to a prettified slug so a row never blanks out if the join misses.
  const prettySlug = (s: string) => s.split('-')[0].replace(/^\w/, (c) => c.toUpperCase())
  const activity = ((activityData ?? []) as ActivityRow[]).map((a) => ({
    ...a,
    name: empName[a.employee_slug] ?? prettySlug(a.employee_slug),
    emoji: empEmoji[a.employee_slug] ?? null,
  }))
  const logsBy: Record<string, { type: string; created_at: string }[]> = {}
  for (const l of (logData ?? []) as { employee_id: string; type: string; created_at: string }[]) (logsBy[l.employee_id] ||= []).push(l)

  const heads = emps
    .filter((e) => e.kind === 'agent')
    .sort((a, b) => (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1) || a.name.localeCompare(b.name))

  // ── Aging / escalation (Morgan owns this) — the "nothing falls off" monitor.
  // computeAging scans every queue for its oldest OPEN item; overdueOnly keeps
  // only the queues that have blown their threshold, worst-overshoot first. When
  // that list is empty (the healthy case) we show a calm one-line all-clear, not
  // the full per-queue table. ──
  const aging = await computeAging(db)
  const overdue = overdueOnly(aging)

  const queue = buildQueue()
  // Scope the command center: 'decision' = only Jill can do it (approve/publish/
  // send); 'team' = a delegable queue the heads work down. Keeps "what needs me"
  // meaning "only I can do this", not "here's all the work". (Jill, 2026-09-03)
  // LIVE counts only — no more hardcoded sample numbers. Items appear only when
  // wired to a real count AND currently non-zero. (data-integrity/fact-checks/
  // newsletter are derived queues — added back when their counts are wired.)
  const LIVE: Record<string, { n: number; label: string }> = {
    triage: { n: triageCount ?? 0, label: 'new' },
    drafts: { n: draftCount ?? 0, label: 'ready' },
    errors: { n: errorCount ?? 0, label: 'today' },
  }
  const liveQueue = queue
    .filter((q) => LIVE[q.page.id] && LIVE[q.page.id].n > 0)
    .map((q) => ({ ...q, count: `${LIVE[q.page.id].n} ${LIVE[q.page.id].label}` }))
  const decisionQ = liveQueue.filter((q) => q.lane === 'decision')
  const teamQ = liveQueue.filter((q) => q.lane === 'team')

  // Welcome banner art — the HQ-lounge illustration at public/team/dashboard-hero.png.
  // Sets an "arriving" tone above the person-first content; if the file is absent
  // the banner falls back to a soft gradient band with the same greeting text
  // (same graceful-fallback pattern as the Breakroom hero / Ideas box art).
  const hasHeroArt = existsSync(join(process.cwd(), 'public', 'team', 'dashboard-hero.png'))

  const fmt = (n: number | null) => (n != null ? n.toLocaleString() : '—')
  type PulseStat = { label: string; value: string; icon: Parameters<typeof Icon>[0]['name']; delta?: number; hot?: boolean }
  // Totals + Subscribers (with a real up/down delta), then the two new-only
  // "needs action" queue counts (count + label only — no faked delta/chart).
  const pulse: PulseStat[] = [
    { label: 'Alerts live', value: fmt(alertsCount), icon: 'bell' },
    { label: 'Programs tracked', value: fmt(programsCount), icon: 'database' },
    { label: 'Subscribers', value: fmt(subsCount), icon: 'users', delta: subsTrend?.delta },
    { label: 'New experiences', value: fmt(newExperiences), icon: 'spark', hot: (newExperiences ?? 0) > 0 },
    { label: 'New sweepstakes', value: fmt(newSweepstakes), icon: 'award', hot: (newSweepstakes ?? 0) > 0 },
  ]

  const queueRow = (q: (typeof queue)[number], dim = false) => (
    <Link key={q.page.id} href={q.page.path} className={`dh-row${dim ? ' dh-row-quiet' : ''}`}>
      <span className="dh-row-ic"><Icon name={q.icon} size={18} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="dh-row-top">
          <span className="dh-row-title">{q.page.title}</span>
          <span className="dh-row-count">{q.count}</span>
        </div>
        <p className="dh-row-blurb">{q.blurb}</p>
      </div>
      <span className="dh-row-go"><Icon name="arrow" size={15} /></span>
    </Link>
  )

  return (
    <div className="dh-root">
      <style dangerouslySetInnerHTML={{ __html: DH_CSS }} />
      <div className="dh-wrap">
        {/* ── Welcome banner — the HQ lounge at morning; sets an "arriving" tone.
             Additive above the person-first content below; the greeting is real
             DOM text over a scrim (not baked into the image) for contrast + a11y. ── */}
        <div className={`dh-welcome${hasHeroArt ? '' : ' dh-welcome-plain'}`}>
          {hasHeroArt && (
            <span className="dh-welcome-art">
              <Image
                src="/team/dashboard-hero.png"
                alt="The crazy4points HQ lounge in the morning light"
                fill
                sizes="1040px"
                style={{ objectFit: 'cover', objectPosition: 'center 35%' }}
                priority
              />
            </span>
          )}
          <div className="dh-welcome-body">
            <span className="dh-welcome-eyebrow">crazy4points HQ</span>
            <span className="dh-welcome-title">Welcome back</span>
          </div>
        </div>

        {/* ── Global health band (Pulse — Direction #1: Stat + Delta) ── */}
        <div className="dh-pulse">
          <span className="dh-pulse-tag"><Icon name="pulse" size={15} /> Pulse</span>
          <div className="dh-pulse-stats">
            {pulse.map((p) => (
              <span key={p.label} className="dh-stat">
                <span className="dh-stat-ic"><Icon name={p.icon} size={14} /></span>
                <span className="dh-stat-val" style={p.hot ? { color: PURPLE } : undefined}>{p.value}</span>
                <span className="dh-stat-label">{p.label}</span>
                {p.delta != null && <DeltaChip delta={p.delta} />}
              </span>
            ))}
            <span className="dh-stat">
              <span className="dh-stat-ic"><Icon name="shield" size={14} /></span>
              <span className="dh-status-dot" style={{ background: UP }} />
              <span className="dh-stat-label">Accuracy healthy</span>
            </span>
          </div>
        </div>

        {/* ── Jill hero ── */}
        <header className="dh-hero">
          <div className="dh-jill-frame">
            <span className="dh-jill">
              <Image src="/images/jill_photo.jpg" alt="Jill" fill sizes="96px" style={{ objectFit: 'cover' }} priority />
            </span>
          </div>
          <div className="dh-hero-body">
            <div className="dh-date">{todayLong()}</div>
            <h1 className="dh-hello">Good morning, Jill</h1>
            <div className="dh-whoami">Jill &middot; Founder &amp; CEO</div>
          </div>
        </header>

        {/* ── My Tasks — Jill's personal checklist (persists until she checks off) ── */}
        <section className="dh-section dh-mytasks-sec">
          <div className="dh-sec-head">
            <h2 className="dh-sec-title">My tasks</h2>
            <span className="dh-sec-meta">{tasks.filter((t) => !t.done).length} open</span>
          </div>
          <div className="dh-card dh-mytasks">
            <MyTasks initialTasks={tasks} emptyArt={<AllClearArt size={72} />} />
          </div>
        </section>

        {/* ── Needs attention — the aging/escalation monitor (Morgan owns it).
             Only the OVERDUE queues surface here (worst-overshoot first). When
             nothing is overdue — the common, healthy case — this collapses to a
             single calm all-clear line so the dashboard stays quiet. ── */}
        <section className="dh-section dh-attn-sec">
          <div className="dh-sec-head">
            <h2 className="dh-sec-title">Needs attention</h2>
            <span className="dh-sec-meta">{overdue.length > 0 ? `${overdue.length} aging` : 'Queue health'}</span>
          </div>
          {overdue.length > 0 ? (
            <div className="dh-card dh-attn">
              {overdue.map((r) => (
                <Link key={r.key} href={r.link} className="dh-attn-row">
                  <span className="dh-attn-ic"><Icon name="alert" size={17} /></span>
                  <span className="dh-attn-label">{r.label}</span>
                  <span className="dh-attn-meta">
                    {r.open} open <span className="dh-attn-sep">&middot;</span> oldest {r.oldestDays}d
                    <span className="dh-attn-limit"> (limit {r.threshold}d)</span>
                  </span>
                  <span className="dh-attn-go"><Icon name="arrow" size={14} /></span>
                </Link>
              ))}
              <p className="dh-attn-foot">Morgan watches this.</p>
            </div>
          ) : (
            <div className="dh-attn-clear">
              <span className="dh-attn-clear-ic"><Icon name="check" size={15} /></span>
              <span className="dh-attn-clear-txt">All queues current &mdash; nothing aging</span>
              <span className="dh-attn-clear-foot">Morgan watches this.</span>
            </div>
          )}
        </section>

        {/* ── What needs me + Notepad ── */}
        <div className="dh-cols">
          <section>
            <div className="dh-sec-head"><h2 className="dh-sec-title">What needs me</h2><span className="dh-sec-meta">{decisionQ.length} for you</span></div>
            {/* Decision Log — proposals from the team awaiting a yes/no. */}
            {(pendingDecisions ?? 0) > 0 ? (
              <Link href="/admin/decisions" className="dh-decisions dh-decisions-hot">
                <span className="dh-decisions-ic"><Icon name="bolt" size={18} /></span>
                <span className="dh-decisions-body">
                  <span className="dh-decisions-title">Needs you today</span>
                  <span className="dh-decisions-sub">{pendingDecisions} decision{pendingDecisions === 1 ? '' : 's'} the team is waiting on you to approve</span>
                </span>
                <span className="dh-decisions-count">{pendingDecisions}</span>
                <span className="dh-decisions-go"><Icon name="arrow" size={15} /></span>
              </Link>
            ) : (
              <Link href="/admin/decisions" className="dh-decisions dh-decisions-clear">
                <span className="dh-decisions-ic"><Icon name="check" size={16} /></span>
                <span className="dh-decisions-body">
                  <span className="dh-decisions-title">No decisions waiting</span>
                  <span className="dh-decisions-sub">The team is caught up on approvals</span>
                </span>
                <span className="dh-decisions-go"><Icon name="arrow" size={15} /></span>
              </Link>
            )}
            {/* Open P1s across the team — small glance, links to the owner's page. */}
            {teamP1s.length > 0 && (
              <div className="dh-p1s">
                <span className="dh-p1s-tag"><span className="dh-p1s-chip">P1</span> Across the team</span>
                <ul className="dh-p1s-list">
                  {teamP1s.map((t) => (
                    <li key={t.id}>
                      <Link href={`/admin/org/${t.employee_slug}`} className="dh-p1-row">
                        <span className="dh-p1-owner">{t.owner.split(' ')[0]}</span>
                        <span className="dh-p1-title">{t.title}</span>
                        {t.status === 'blocked' && <span className="dh-p1-blocked">Blocked</span>}
                        <span className="dh-p1-go"><Icon name="arrow" size={13} /></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="dh-card dh-queue">
              {/* Needs your decision — owner-only calls (approve/publish/send). */}
              <div className="dh-queue-lane">Needs your decision</div>
              {decisionQ.length > 0
                ? decisionQ.map((q) => queueRow(q))
                : <div className="dh-queue-clear"><Icon name="check" size={15} /> Nothing needs your decision right now.</div>}
              {/* Team queues — delegable work the heads run down; informational. */}
              {teamQ.length > 0 && (
                <details className="dh-more" open>
                  <summary><span>Team queues ({teamQ.length})</span><Icon name="arrow" size={14} className="dh-more-chev" /></summary>
                  <div>{teamQ.map((q) => queueRow(q, true))}</div>
                </details>
              )}
            </div>
          </section>

          <section>
            <div className="dh-sec-head"><h2 className="dh-sec-title">Notepad</h2><Link href="/admin/notepad" className="dh-sec-link">Open <Icon name="arrow" size={13} /></Link></div>
            <div className="dh-card dh-notepad">
              <Notepad initialNotes={notes} compact />
            </div>
          </section>
        </div>

        {/* ── Latest activity — the team-wide chain of finished work (mig 666).
             At-a-glance "here's what everyone shipped", newest first, cap 12. ── */}
        <section className="dh-section">
          <div className="dh-sec-head">
            <h2 className="dh-sec-title">Latest activity</h2>
            <span className="dh-sec-meta">{activity.length > 0 ? 'What the team shipped' : 'The chain'}</span>
          </div>
          <div className="dh-card dh-activity">
            {activity.length === 0 ? (
              <p className="dh-act-empty"><Icon name="activity" size={16} /> No activity logged yet — finished work will chain in here as the team ships.</p>
            ) : (
              activity.map((a) => {
                const s = activityStyle(a.action)
                return (
                  <div key={a.id} className="dh-act-row">
                    <Link href={`/admin/org/${a.employee_slug}`} className="dh-act-who" title={a.name}>
                      <span className="dh-act-emoji">{a.emoji || a.name.charAt(0).toUpperCase()}</span>
                      <span className="dh-act-name">{a.name.split(' ')[0]}</span>
                    </Link>
                    <span className="dh-act-badge" style={{ color: s.fg, background: s.bg, borderColor: s.border }}>
                      <Icon name={s.icon} size={11} /> {s.label}
                    </span>
                    {a.link ? (
                      <Link href={a.link} className="dh-act-summary dh-act-summary-link">
                        {a.summary}
                        <span className="dh-act-go"><Icon name="arrow" size={14} /></span>
                      </Link>
                    ) : (
                      <span className="dh-act-summary">{a.summary}</span>
                    )}
                    <span className="dh-act-time">{timeAgo(a.created_at)}</span>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* ── The team ── */}
        <section className="dh-section">
          <div className="dh-sec-head"><h2 className="dh-sec-title">The team</h2><Link href="/admin/org" className="dh-sec-link">Org chart <Icon name="arrow" size={13} /></Link></div>
          <div className="dh-card dh-team">
            {heads.map((e) => {
              const score = overall(computeMeters(e as unknown as { slug: string; kind: 'agent'; status: string; responsibilities?: string[] | null }, logsBy[e.id] || []))
              return (
                <Link key={e.id} href={`/admin/org/${e.slug}`} className="dh-member" title={`${e.name} — ${e.role_title || ''} · health ${score}`} style={{ opacity: e.status === 'planned' ? 0.6 : 1 }}>
                  <Ring value={score} color={healthColor(score)} size={64} stroke={3} track="var(--admin-surface-alt)" showValue={false}>
                    {e.image_url ? (
                      <span className="dh-member-av"><Image src={e.image_url} alt={e.name} fill sizes="52px" style={{ objectFit: 'cover' }} /></span>
                    ) : (
                      <span className="dh-member-av dh-member-av-fallback">{e.emoji || '👤'}</span>
                    )}
                  </Ring>
                  <span className="dh-member-name">{e.name}</span>
                  <span className="dh-member-role">{e.role_title || ''}</span>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

const DH_CSS = `
.admin .dh-wrap { max-width:1040px; margin:0 auto; padding:0 4px; }

/* Welcome banner — slim HQ-lounge cover strip; arrival moment above the content */
.admin .dh-welcome { position:relative; height:150px; border-radius:18px; overflow:hidden; margin-bottom:2.2rem;
  border:1px solid color-mix(in srgb, var(--color-primary) 12%, var(--admin-border));
  background:linear-gradient(120deg, color-mix(in srgb, var(--color-primary) 16%, #fff), color-mix(in srgb, var(--color-accent) 12%, #fff));
  box-shadow:0 1px 2px rgba(107,45,143,.05), 0 20px 44px -34px rgba(107,45,143,.4); }
.admin .dh-welcome-art { position:absolute; inset:0; display:block; z-index:0; }
/* Scrim so the greeting stays legible over any part of the illustration */
.admin .dh-welcome::after { content:''; position:absolute; inset:0; z-index:1;
  background:linear-gradient(90deg, rgba(38,12,54,.62) 0%, rgba(38,12,54,.34) 34%, rgba(38,12,54,0) 62%); }
.admin .dh-welcome-plain::after { background:linear-gradient(90deg, rgba(107,45,143,.14), rgba(107,45,143,0) 60%); }
.admin .dh-welcome-body { position:absolute; z-index:2; left:26px; bottom:22px; display:flex; flex-direction:column; gap:5px; }
.admin .dh-welcome-eyebrow { font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.16em; color:rgba(255,255,255,.9); }
.admin .dh-welcome-title { font-family:${DISPLAY}; font-size:2rem; font-weight:800; letter-spacing:-.01em; color:#fff; line-height:1; text-shadow:0 1px 12px rgba(38,12,54,.4); }
.admin .dh-welcome-plain .dh-welcome-eyebrow { color:var(--color-primary); }
.admin .dh-welcome-plain .dh-welcome-title { color:var(--color-primary); text-shadow:none; }

/* Pulse band */
.admin .dh-pulse { display:flex; align-items:center; gap:1.4rem; flex-wrap:wrap; padding:14px 20px; margin-bottom:2.2rem;
  border-radius:14px; border:1px solid color-mix(in srgb, var(--color-primary) 10%, var(--admin-border));
  background:linear-gradient(90deg, color-mix(in srgb, var(--color-primary) 6%, #fff), #fff 60%);
  box-shadow:0 1px 2px rgba(107,45,143,.04); }
.admin .dh-pulse-tag { display:inline-flex; align-items:center; gap:7px; font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:var(--color-primary); flex-shrink:0; }
.admin .dh-pulse-stats { display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap; }
.admin .dh-stat { display:inline-flex; align-items:center; gap:7px; }
.admin .dh-stat-ic { color:var(--admin-text-subtle); display:flex; }
.admin .dh-stat-val { font-size:1.05rem; font-weight:800; color:var(--admin-text); font-variant-numeric:tabular-nums; letter-spacing:-.01em; }
.admin .dh-stat-label { font-size:var(--admin-text-xs); color:var(--admin-text-muted); text-transform:uppercase; letter-spacing:.05em; font-weight:600; }
.admin .dh-status-dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }

/* Delta chip (Subscribers trend — real data, honest up/down) */
.admin .dh-delta { display:inline-flex; align-items:center; gap:3px; font-size:var(--admin-text-xs); font-weight:800; padding:2px 7px; border-radius:9999px; font-variant-numeric:tabular-nums; }
.admin .dh-delta-up { color:var(--admin-success); background:var(--admin-success-soft); }
.admin .dh-delta-down { color:var(--admin-danger); background:var(--admin-danger-soft); }
.admin .dh-delta-flat { color:var(--admin-text-muted); background:var(--admin-surface-alt); }

/* Jill hero */
.admin .dh-hero { display:flex; align-items:center; gap:1.4rem; margin-bottom:2.6rem; }
.admin .dh-jill-frame { flex-shrink:0; padding:3px; border-radius:50%; background:linear-gradient(150deg, ${GOLD}, color-mix(in srgb, ${GOLD} 30%, #fff)); box-shadow:0 10px 26px -10px rgba(107,45,143,.4); }
.admin .dh-jill { position:relative; display:block; width:88px; height:88px; border-radius:50%; overflow:hidden; background:var(--admin-accent-soft); border:2px solid #fff; }
.admin .dh-date { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.14em; color:var(--admin-text-subtle); font-weight:700; }
.admin .dh-hello { font-family:${DISPLAY}; font-size:2.6rem; font-weight:800; letter-spacing:-.02em; color:var(--color-primary); margin:.35rem 0 0; line-height:1.02; }
.admin .dh-whoami { font-size:1rem; color:var(--admin-text-secondary); margin-top:.3rem; font-weight:500; }

/* Sections */
.admin .dh-section { margin-bottom:3rem; }
.admin .dh-cols { display:grid; grid-template-columns:1.15fr .85fr; gap:1.5rem; margin-bottom:3rem; align-items:start; }
/* Grid tracks default to min-width:auto, so nowrap titles inside push the track
   wider than the viewport (148px overflow at 375px). Let tracks shrink. */
.admin .dh-cols > * { min-width:0; }
.admin .dh-sec-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:1rem; padding:0 2px; }
.admin .dh-sec-title { font-family:${DISPLAY}; font-size:1.4rem; font-weight:700; letter-spacing:-.01em; color:var(--admin-text); margin:0; }
.admin .dh-sec-meta { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.08em; color:var(--admin-text-subtle); font-weight:700; }
.admin .dh-sec-link { display:inline-flex; align-items:center; gap:5px; font-size:var(--admin-text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--color-primary); text-decoration:none; }
.admin .dh-sec-link:hover { gap:8px; text-decoration:none; }

/* Card */
.admin .dh-card { background:var(--admin-surface); border:1px solid color-mix(in srgb, var(--color-primary) 9%, var(--admin-border)); border-radius:18px; box-shadow:0 1px 2px rgba(107,45,143,.035), 0 18px 40px -30px rgba(107,45,143,.26); }

/* Decision Log callout (⚡ Needs you today) */
.admin .dh-decisions { display:flex; align-items:center; gap:14px; padding:14px 16px; margin-bottom:.9rem; border-radius:14px; text-decoration:none; transition:transform .14s ease, box-shadow .14s ease, border-color .14s ease; }
.admin .dh-decisions:hover { transform:translateY(-1px); text-decoration:none; }
.admin .dh-decisions-hot { border:1px solid color-mix(in srgb, var(--color-accent) 45%, var(--admin-border)); background:linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 14%, #fff), #fff 70%); box-shadow:0 1px 2px rgba(107,45,143,.05), 0 16px 34px -26px rgba(212,175,55,.6); }
.admin .dh-decisions-hot:hover { box-shadow:0 1px 2px rgba(107,45,143,.05), 0 20px 40px -24px rgba(212,175,55,.7); border-color:var(--color-accent); }
.admin .dh-decisions-clear { border:1px solid var(--admin-border); background:var(--admin-surface); }
.admin .dh-decisions-clear:hover { border-color:color-mix(in srgb, var(--color-primary) 24%, var(--admin-border)); }
.admin .dh-decisions-ic { display:flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:11px; flex-shrink:0; }
.admin .dh-decisions-hot .dh-decisions-ic { color:#9a7b1e; background:rgba(212,175,55,.18); border:1px solid color-mix(in srgb, var(--color-accent) 40%, var(--admin-border)); }
.admin .dh-decisions-clear .dh-decisions-ic { color:var(--admin-success); background:var(--admin-success-soft); border:1px solid var(--admin-border); }
.admin .dh-decisions-body { min-width:0; flex:1; display:flex; flex-direction:column; }
.admin .dh-decisions-title { font-size:1rem; font-weight:800; color:var(--admin-text); letter-spacing:-.01em; }
.admin .dh-decisions-clear .dh-decisions-title { font-weight:700; color:var(--admin-text-secondary); }
.admin .dh-decisions-sub { font-size:var(--admin-text-sm); color:var(--admin-text-muted); margin-top:2px; line-height:1.4; }
.admin .dh-decisions-count { font-family:${DISPLAY}; font-size:1.7rem; font-weight:800; color:var(--color-primary); line-height:1; flex-shrink:0; font-variant-numeric:tabular-nums; }
.admin .dh-decisions-go { color:var(--admin-text-subtle); flex-shrink:0; transition:transform .14s ease, color .14s ease; }
.admin .dh-decisions:hover .dh-decisions-go { transform:translateX(3px); color:var(--color-primary); }

/* Open P1s across the team (small glance) */
.admin .dh-p1s { margin-bottom:.9rem; padding:12px 14px 8px; border-radius:14px;
  border:1px solid color-mix(in srgb, var(--admin-danger) 22%, var(--admin-border));
  background:linear-gradient(90deg, color-mix(in srgb, var(--admin-danger) 6%, #fff), #fff 65%); }
.admin .dh-p1s-tag { display:inline-flex; align-items:center; gap:8px; font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--admin-text-muted); }
.admin .dh-p1s-chip { display:inline-flex; align-items:center; justify-content:center; min-width:26px; height:20px; padding:0 6px; border-radius:6px; font-weight:800; font-size:var(--admin-text-xs); color:var(--admin-danger); background:var(--admin-danger-soft); border:1px solid color-mix(in srgb, var(--admin-danger) 30%, var(--admin-border)); }
.admin .dh-p1s-list { list-style:none; margin:.5rem 0 0; padding:0; display:flex; flex-direction:column; }
.admin .dh-p1-row { display:flex; align-items:center; gap:10px; padding:8px 6px; border-radius:9px; text-decoration:none; transition:background .14s ease; }
.admin .dh-p1-row:hover { background:color-mix(in srgb, var(--admin-danger) 5%, #fff); text-decoration:none; }
.admin .dh-p1s-list li + li .dh-p1-row { border-top:1px solid color-mix(in srgb, var(--admin-danger) 12%, var(--admin-border)); border-radius:0; }
.admin .dh-p1-owner { flex-shrink:0; font-size:var(--admin-text-xs); font-weight:800; color:var(--color-primary); text-transform:uppercase; letter-spacing:.04em; min-width:56px; }
.admin .dh-p1-title { flex:1; min-width:0; font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.admin .dh-p1-blocked { flex-shrink:0; font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:var(--admin-warning); background:var(--admin-warning-soft); padding:2px 7px; border-radius:9999px; }
.admin .dh-p1-go { flex-shrink:0; color:var(--admin-text-subtle); transition:transform .14s ease, color .14s ease; }
.admin .dh-p1-row:hover .dh-p1-go { transform:translateX(2px); color:var(--admin-danger); }

/* Needs attention — aging/escalation monitor (warning-toned, calm when clear) */
.admin .dh-attn-sec { margin-top:-.4rem; }
.admin .dh-attn { padding:6px; border-color:color-mix(in srgb, var(--admin-warning) 22%, var(--admin-border)); }
.admin .dh-attn-row { display:flex; align-items:center; gap:13px; padding:13px 15px; border-radius:12px; text-decoration:none; transition:background .14s ease; }
.admin .dh-attn-row + .dh-attn-row { border-top:1px solid color-mix(in srgb, var(--admin-warning) 12%, var(--admin-border)); border-radius:0; }
.admin .dh-attn-row:hover { background:color-mix(in srgb, var(--admin-warning) 6%, #fff); text-decoration:none; }
.admin .dh-attn-ic { display:flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:10px; flex-shrink:0; color:var(--admin-warning); background:var(--admin-warning-soft); border:1px solid color-mix(in srgb, var(--admin-warning) 26%, var(--admin-border)); }
.admin .dh-attn-label { flex:1; min-width:0; font-size:var(--admin-text-sm); font-weight:700; color:var(--admin-text); line-height:1.35; }
.admin .dh-attn-meta { flex-shrink:0; font-size:var(--admin-text-xs); font-weight:700; color:var(--admin-warning); font-variant-numeric:tabular-nums; letter-spacing:.01em; }
.admin .dh-attn-sep { color:color-mix(in srgb, var(--admin-warning) 45%, transparent); margin:0 1px; }
.admin .dh-attn-limit { color:var(--admin-text-subtle); font-weight:600; }
.admin .dh-attn-go { flex-shrink:0; color:var(--admin-text-subtle); opacity:0; transform:translateX(-4px); transition:opacity .14s ease, transform .14s ease; }
.admin .dh-attn-row:hover .dh-attn-go { opacity:1; transform:translateX(0); color:var(--admin-warning); }
.admin .dh-attn-foot { margin:2px 6px 4px; padding-top:9px; border-top:1px dashed color-mix(in srgb, var(--admin-warning) 16%, var(--admin-border)); font-size:var(--admin-text-xs); color:var(--admin-text-subtle); font-weight:600; }
/* All-clear — one calm line, quiet by design when nothing is aging */
.admin .dh-attn-clear { display:flex; align-items:center; gap:10px; padding:14px 18px; border-radius:14px; border:1px solid var(--admin-border); background:var(--admin-surface); }
.admin .dh-attn-clear-ic { display:flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:8px; flex-shrink:0; color:var(--admin-success); background:var(--admin-success-soft); }
.admin .dh-attn-clear-txt { font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text-secondary); }
.admin .dh-attn-clear-foot { margin-left:auto; font-size:var(--admin-text-xs); color:var(--admin-text-subtle); font-weight:600; }

/* Queue */
.admin .dh-queue { padding:6px; }
.admin .dh-queue-lane { padding:10px 16px 6px; font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--admin-text-muted); }
.admin .dh-queue-clear { display:flex; align-items:center; gap:8px; padding:12px 16px 15px; font-size:var(--admin-text-sm); color:var(--admin-text-muted); }
.admin .dh-row { display:flex; align-items:center; gap:15px; padding:15px 16px; border-radius:13px; text-decoration:none; transition:background .14s ease; }
.admin .dh-row + .dh-row { border-top:1px solid var(--admin-border); border-radius:0; }
.admin .dh-row:hover { background:color-mix(in srgb, var(--color-primary) 4%, #fff); text-decoration:none; }
.admin .dh-row-ic { display:flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:11px; flex-shrink:0; color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 8%, #fff); border:1px solid color-mix(in srgb, var(--color-primary) 12%, var(--admin-border)); }
.admin .dh-row-top { display:flex; align-items:baseline; gap:10px; }
.admin .dh-row-title { font-size:1rem; font-weight:700; color:var(--admin-text); }
.admin .dh-row-count { font-size:var(--admin-text-xs); font-weight:700; color:var(--admin-text-subtle); font-variant-numeric:tabular-nums; }
.admin .dh-row-blurb { margin:3px 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); line-height:1.5; }
.admin .dh-row-go { color:var(--admin-text-subtle); opacity:0; transform:translateX(-5px); transition:opacity .14s ease, transform .14s ease; flex-shrink:0; }
.admin .dh-row:hover .dh-row-go { opacity:1; transform:translateX(0); color:var(--color-primary); }
.admin .dh-row-quiet .dh-row-title { font-weight:600; color:var(--admin-text-secondary); }
.admin .dh-more { border-top:1px solid var(--admin-border); }
.admin .dh-more > summary { list-style:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; padding:13px; font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text-muted); }
.admin .dh-more > summary::-webkit-details-marker { display:none; }
.admin .dh-more > summary:hover { color:var(--color-primary); }
.admin .dh-more-chev { transition:transform .2s ease; }
.admin .dh-more[open] .dh-more-chev { transform:rotate(90deg); }
.admin .dh-more[open] > summary { color:var(--color-primary); }
.admin .dh-more .dh-row:first-child { border-top:1px solid var(--admin-border); border-radius:0; }

/* Notepad host */
.admin .dh-notepad { padding:1.25rem; }

/* My Tasks host */
.admin .dh-mytasks-sec { margin-top:-.6rem; }
.admin .dh-mytasks { padding:1.25rem 1.4rem; }

/* Team */
.admin .dh-team { display:flex; flex-wrap:wrap; gap:1.6rem 1.4rem; justify-content:flex-start; padding:2rem 1.8rem; }
.admin .dh-member { display:flex; flex-direction:column; align-items:center; gap:8px; width:96px; text-decoration:none; transition:transform .16s ease; }
.admin .dh-member:hover { transform:translateY(-3px); text-decoration:none; }
.admin .dh-member-av { position:relative; width:52px; height:52px; border-radius:50%; overflow:hidden; display:block; }
.admin .dh-member-av-fallback { display:flex; align-items:center; justify-content:center; font-size:1.5rem; background:radial-gradient(circle at 30% 25%, #fff, var(--admin-accent-soft)); }
.admin .dh-member-name { font-size:var(--admin-text-sm); font-weight:700; color:var(--admin-text); text-align:center; line-height:1.15; }
.admin .dh-member-role { font-size:var(--admin-text-xs); color:var(--admin-text-muted); text-align:center; line-height:1.2; }

/* Latest activity — team-wide chain of finished work (compact timeline) */
.admin .dh-activity { padding:6px; }
.admin .dh-act-empty { display:flex; align-items:center; gap:9px; padding:20px 18px; margin:0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); line-height:1.5; }
.admin .dh-act-empty svg { flex-shrink:0; color:var(--admin-text-subtle); }
.admin .dh-act-row { display:flex; align-items:center; gap:12px; padding:12px 13px; border-radius:11px; }
.admin .dh-act-row + .dh-act-row { border-top:1px solid var(--admin-border); border-radius:0; }
.admin .dh-act-who { flex-shrink:0; display:inline-flex; align-items:center; gap:8px; min-width:104px; text-decoration:none; border-radius:9px; padding:3px 6px 3px 3px; transition:background .14s ease; }
.admin .dh-act-who:hover { background:color-mix(in srgb, var(--color-primary) 6%, var(--admin-surface)); text-decoration:none; }
.admin .dh-act-emoji { display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:50%; flex-shrink:0; font-size:1rem; line-height:1; background:var(--admin-accent-soft); border:1px solid color-mix(in srgb, var(--color-accent) 28%, var(--admin-border)); }
.admin .dh-act-name { font-size:var(--admin-text-sm); font-weight:800; color:var(--admin-text); letter-spacing:-.01em; }
.admin .dh-act-who:hover .dh-act-name { color:var(--color-primary); }
.admin .dh-act-badge { flex-shrink:0; display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:9999px; font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.04em; border:1px solid var(--admin-border); }
.admin .dh-act-badge svg { flex-shrink:0; }
.admin .dh-act-summary { flex:1; min-width:0; font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text); line-height:1.4; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.admin a.dh-act-summary-link { display:inline-flex; align-items:center; gap:6px; text-decoration:none; transition:color .14s ease; }
.admin a.dh-act-summary-link:hover { color:var(--color-primary); text-decoration:none; }
.admin .dh-act-go { flex-shrink:0; color:var(--admin-text-subtle); opacity:0; transform:translateX(-4px); transition:opacity .14s ease, transform .14s ease; }
.admin a.dh-act-summary-link:hover .dh-act-go { opacity:1; transform:translateX(0); color:var(--color-primary); }
.admin .dh-act-time { flex-shrink:0; font-size:var(--admin-text-xs); color:var(--admin-text-subtle); font-variant-numeric:tabular-nums; }

@media (max-width:820px) { .admin .dh-cols { grid-template-columns:1fr; } }
@media (max-width:560px) {
  .admin .dh-welcome { height:118px; }
  .admin .dh-welcome-body { left:18px; bottom:16px; }
  .admin .dh-welcome-title { font-size:1.6rem; }
  /* Needs-attention rows: let the count drop under the label; nothing clips */
  .admin .dh-attn-row { flex-wrap:wrap; gap:5px 11px; }
  .admin .dh-attn-label { flex-basis:auto; }
  .admin .dh-attn-meta { flex-basis:100%; order:3; padding-left:47px; }
  .admin .dh-attn-go { display:none; }
  .admin .dh-attn-clear { flex-wrap:wrap; }
  .admin .dh-attn-clear-foot { margin-left:36px; flex-basis:100%; }
  /* Activity rows: let the summary wrap to its own line, badge+who up top */
  .admin .dh-act-row { flex-wrap:wrap; gap:7px 10px; }
  .admin .dh-act-summary { flex-basis:100%; order:4; white-space:normal; }
  .admin .dh-act-time { margin-left:auto; }
}
`
