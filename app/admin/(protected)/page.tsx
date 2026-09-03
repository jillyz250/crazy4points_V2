import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/utils/supabase/server'
import { computeMeters } from '@/lib/orgMeters'
import { buildQueue, meterCells, Icon, Ring, todayLong } from '@/components/admin/preview/kit'
import Notepad from '@/components/admin/dashboard/Notepad'
import MyTasks from '@/components/admin/dashboard/MyTasks'
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
    { data: empData }, { data: logData }, { data: notesData }, { data: tasksData },
    alertsCount, programsCount, subsCount, subsTrend, newExperiences, newSweepstakes, pendingDecisions,
  ] = await Promise.all([
    db.from('employees').select('id, slug, name, role_title, kind, emoji, image_url, status, responsibilities'),
    db.from('employee_logs').select('employee_id, type, created_at'),
    db.from('dashboard_notes').select('id, body, sent_to_takes, created_at, updated_at').order('created_at', { ascending: false }).limit(50),
    db.from('jill_tasks').select('id, title, done, source, link, created_at, done_at').order('created_at', { ascending: false }).limit(100),
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
  ])
  const emps = (empData ?? []) as Emp[]
  const notes = (notesData ?? []) as DashboardNote[]
  const tasks = (tasksData ?? []) as JillTask[]
  const logsBy: Record<string, { type: string; created_at: string }[]> = {}
  for (const l of (logData ?? []) as { employee_id: string; type: string; created_at: string }[]) (logsBy[l.employee_id] ||= []).push(l)

  const heads = emps
    .filter((e) => e.kind === 'agent')
    .sort((a, b) => (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1) || a.name.localeCompare(b.name))

  const queue = buildQueue()
  const primary = queue.filter((q) => q.urgent)
  const rest = queue.filter((q) => !q.urgent)

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
            <MyTasks initialTasks={tasks} />
          </div>
        </section>

        {/* ── What needs me + Notepad ── */}
        <div className="dh-cols">
          <section>
            <div className="dh-sec-head"><h2 className="dh-sec-title">What needs me</h2><span className="dh-sec-meta">{primary.length} today</span></div>
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
            <div className="dh-card dh-queue">
              {primary.map((q) => queueRow(q))}
              {rest.length > 0 && (
                <details className="dh-more">
                  <summary><span>{rest.length} more in the queue</span><Icon name="arrow" size={14} className="dh-more-chev" /></summary>
                  <div>{rest.map((q) => queueRow(q, true))}</div>
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

/* Queue */
.admin .dh-queue { padding:6px; }
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

@media (max-width:820px) { .admin .dh-cols { grid-template-columns:1fr; } }
`
