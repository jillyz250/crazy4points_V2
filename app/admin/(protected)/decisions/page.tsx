import { createAdminClient } from '@/utils/supabase/server'
import { Icon, type IconName } from '@/components/admin/preview/kit'
import type { DecisionRow, DecisionStatus } from '@/lib/admin/logDecision'
import { approveDecision, rejectDecision } from './actions'

export const dynamic = 'force-dynamic'

const DISPLAY = 'var(--font-display)'

type HeadMeta = { name: string; emoji: string | null }

// ── Small presenters ─────────────────────────────────────────────────────────

const STATUS_META: Record<DecisionStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'dl-pill-pending' },
  approved: { label: 'Approved', cls: 'dl-pill-approved' },
  rejected: { label: 'Rejected', cls: 'dl-pill-rejected' },
  executed: { label: 'Executed', cls: 'dl-pill-executed' },
  undone: { label: 'Undone', cls: 'dl-pill-undone' },
}

// action → a friendly verb + icon (falls back gracefully for unknown actions).
const ACTION_META: Record<string, { label: string; icon: IconName }> = {
  dismiss: { label: 'Dismiss', icon: 'trash' },
  skip: { label: 'Skip', icon: 'arrow' },
  bulk_skip: { label: 'Bulk skip', icon: 'inbox' },
  resolve: { label: 'Resolve', icon: 'check' },
  snooze: { label: 'Snooze', icon: 'clock' },
  publish: { label: 'Publish', icon: 'send' },
  edit: { label: 'Edit', icon: 'pencil' },
  feature: { label: 'Feature', icon: 'star' },
  send: { label: 'Send', icon: 'mail' },
  feedback: { label: 'Feedback', icon: 'flag' },
  other: { label: 'Action', icon: 'bolt' },
}
const actionMeta = (a: string) =>
  ACTION_META[a] ?? { label: a.replace(/_/g, ' '), icon: 'bolt' as IconName }

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const secs = Math.round((Date.now() - then) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function HeadBadge({ meta, slug }: { meta: HeadMeta | undefined; slug: string }) {
  return (
    <span className="dl-head">
      <span className="dl-head-av">{meta?.emoji || '👤'}</span>
      <span className="dl-head-name">{meta?.name || slug}</span>
    </span>
  )
}

function StakesChip({ stakes }: { stakes: 'low' | 'high' }) {
  return (
    <span className={`dl-stakes ${stakes === 'high' ? 'dl-stakes-high' : 'dl-stakes-low'}`}>
      {stakes === 'high' && <Icon name="alert" size={11} />}
      {stakes === 'high' ? 'High stakes' : 'Low stakes'}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DecisionsPage({
  searchParams,
}: {
  searchParams: Promise<{ head?: string; date?: string }>
}) {
  const { head: headFilter = '', date: dateFilter = '' } = await searchParams
  const db = createAdminClient()

  // Employees for slug → {name, emoji}, and the head filter dropdown.
  const { data: empData } = await db
    .from('employees')
    .select('slug, name, emoji, kind, status')
    .order('name', { ascending: true })
  const emps = (empData ?? []) as { slug: string; name: string; emoji: string | null; kind: string; status: string }[]
  const headById: Record<string, HeadMeta> = {}
  for (const e of emps) headById[e.slug] = { name: e.name, emoji: e.emoji }

  // Pending queue: proposed + pending, newest first.
  const { data: pendingData } = await db
    .from('decision_log')
    .select('*')
    .eq('status', 'pending')
    .eq('mode', 'proposed')
    .order('created_at', { ascending: false })
  const pending = (pendingData ?? []) as DecisionRow[]

  // History feed: all statuses, newest first, filterable, ~50 rows.
  let historyQ = db.from('decision_log').select('*').order('created_at', { ascending: false }).limit(50)
  if (headFilter) historyQ = historyQ.eq('employee_slug', headFilter)
  if (dateFilter) historyQ = historyQ.eq('correlation_id', dateFilter)
  const { data: historyData } = await historyQ
  const history = (historyData ?? []) as DecisionRow[]

  // Distinct dates for the date filter (recent 400 rows is plenty).
  const { data: dateRows } = await db
    .from('decision_log')
    .select('correlation_id')
    .order('correlation_id', { ascending: false })
    .limit(400)
  const dates = Array.from(
    new Set(((dateRows ?? []) as { correlation_id: string | null }[]).map((r) => r.correlation_id).filter(Boolean)),
  ) as string[]

  // Heads that actually appear in the log (keeps the dropdown honest + short).
  const headsInLog = Array.from(new Set(history.map((h) => h.employee_slug)))
    .concat(pending.map((p) => p.employee_slug))
  const filterHeads = emps.filter((e) => headsInLog.includes(e.slug))

  return (
    <div className="dl-root">
      <style dangerouslySetInnerHTML={{ __html: DL_CSS }} />
      <div className="dl-wrap">
        {/* ── Header ── */}
        <header className="dl-header">
          <h1 className="dl-title">Decisions</h1>
          <p className="dl-sub">
            The team proposes; you decide. Every call a head makes on your behalf lands here first —
            approve it, or reject it and the head learns.
          </p>
        </header>

        {/* ── Pending your approval (the hero) ── */}
        <section className="dl-section">
          <div className="dl-sec-head">
            <h2 className="dl-sec-title"><Icon name="bolt" size={18} /> Pending your approval</h2>
            <span className="dl-sec-meta">{pending.length} waiting</span>
          </div>

          {pending.length === 0 ? (
            <div className="dl-card dl-empty">
              <span className="dl-empty-ic"><Icon name="check" size={22} /></span>
              <div>
                <div className="dl-empty-title">Nothing waiting on you</div>
                <div className="dl-empty-sub">The team is caught up. New proposals will show up here.</div>
              </div>
            </div>
          ) : (
            <div className="dl-card dl-pending">
              {pending.map((d) => {
                const am = actionMeta(d.action)
                return (
                  <div key={d.id} className="dl-prow">
                    <span className="dl-prow-ic"><Icon name={am.icon} size={18} /></span>
                    <div className="dl-prow-body">
                      <div className="dl-prow-top">
                        <HeadBadge meta={headById[d.employee_slug]} slug={d.employee_slug} />
                        <span className="dl-prow-action">
                          {am.label}
                          {d.item_count > 1 && <span className="dl-count"> ×{d.item_count}</span>}
                        </span>
                        <StakesChip stakes={d.stakes} />
                      </div>
                      {d.target_label && <div className="dl-prow-target">{d.target_label}</div>}
                      {d.reason && <p className="dl-prow-reason">{d.reason}</p>}
                    </div>
                    <div className="dl-prow-actions">
                      <form action={async () => { 'use server'; await approveDecision(d.id) }}>
                        <button type="submit" className="dl-btn dl-btn-approve"><Icon name="check" size={14} /> Approve</button>
                      </form>
                      <form action={async () => { 'use server'; await rejectDecision(d.id) }}>
                        <button type="submit" className="dl-btn dl-btn-reject">Reject</button>
                      </form>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Recent decisions (history) ── */}
        <section className="dl-section dl-section-last">
          <div className="dl-sec-head">
            <h2 className="dl-sec-title">Recent decisions</h2>
            <span className="dl-sec-meta">Last {history.length}</span>
          </div>

          {/* Filters (GET form → server component re-renders filtered) */}
          <form className="dl-filters" method="GET">
            <label className="dl-filter">
              <span className="dl-filter-label">Head</span>
              <select name="head" defaultValue={headFilter} className="dl-select">
                <option value="">All heads</option>
                {filterHeads.map((e) => (
                  <option key={e.slug} value={e.slug}>{e.emoji ? `${e.emoji} ` : ''}{e.name}</option>
                ))}
              </select>
            </label>
            <label className="dl-filter">
              <span className="dl-filter-label">Day</span>
              <select name="date" defaultValue={dateFilter} className="dl-select">
                <option value="">All days</option>
                {dates.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="dl-btn dl-btn-filter">Apply</button>
            {(headFilter || dateFilter) && <a href="/admin/decisions" className="dl-clear">Clear</a>}
          </form>

          {history.length === 0 ? (
            <div className="dl-card dl-empty">
              <span className="dl-empty-ic"><Icon name="inbox" size={22} /></span>
              <div>
                <div className="dl-empty-title">No decisions yet</div>
                <div className="dl-empty-sub">Nothing matches this filter.</div>
              </div>
            </div>
          ) : (
            <div className="dl-card dl-history">
              {history.map((d) => {
                const am = actionMeta(d.action)
                const sm = STATUS_META[d.status]
                return (
                  <div key={d.id} className="dl-hrow">
                    <span className="dl-hrow-ic"><Icon name={am.icon} size={15} /></span>
                    <HeadBadge meta={headById[d.employee_slug]} slug={d.employee_slug} />
                    <span className="dl-hrow-action">
                      {am.label}
                      {d.item_count > 1 && <span className="dl-count"> ×{d.item_count}</span>}
                    </span>
                    {d.target_label && <span className="dl-hrow-target">{d.target_label}</span>}
                    <span className={`dl-pill ${sm.cls}`}>{sm.label}</span>
                    <span className="dl-hrow-time">{timeAgo(d.created_at)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const DL_CSS = `
.admin .dl-wrap { max-width:960px; margin:0 auto; padding:0 4px; }

/* Header */
.admin .dl-header { margin-bottom:2.2rem; }
.admin .dl-title { font-family:${DISPLAY}; font-size:2.4rem; font-weight:800; letter-spacing:-.02em; color:var(--color-primary); margin:0; line-height:1.03; }
.admin .dl-sub { margin:.6rem 0 0; font-size:1rem; line-height:1.55; color:var(--admin-text-secondary); max-width:62ch; }

/* Sections */
.admin .dl-section { margin-bottom:2.6rem; }
.admin .dl-section-last { margin-bottom:3.5rem; }
.admin .dl-sec-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:1rem; padding:0 2px; }
.admin .dl-sec-title { display:flex; align-items:center; gap:9px; font-family:${DISPLAY}; font-size:1.4rem; font-weight:700; letter-spacing:-.01em; color:var(--admin-text); margin:0; }
.admin .dl-sec-title svg { color:var(--color-accent); }
.admin .dl-sec-meta { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.08em; color:var(--admin-text-subtle); font-weight:700; flex-shrink:0; }

/* Card base */
.admin .dl-card { background:var(--admin-surface); border:1px solid color-mix(in srgb, var(--color-primary) 9%, var(--admin-border)); border-radius:18px; box-shadow:0 1px 2px rgba(107,45,143,.035), 0 18px 40px -30px rgba(107,45,143,.26); }

/* Empty state */
.admin .dl-empty { display:flex; align-items:center; gap:14px; padding:1.6rem 1.7rem; }
.admin .dl-empty-ic { display:flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:12px; flex-shrink:0; color:var(--admin-success); background:var(--admin-success-soft); }
.admin .dl-empty-title { font-size:1rem; font-weight:700; color:var(--admin-text); }
.admin .dl-empty-sub { font-size:var(--admin-text-sm); color:var(--admin-text-muted); margin-top:2px; }

/* Head badge */
.admin .dl-head { display:inline-flex; align-items:center; gap:7px; flex-shrink:0; }
.admin .dl-head-av { display:flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; font-size:.95rem; line-height:1; background:var(--admin-accent-soft); border:1px solid color-mix(in srgb, var(--color-accent) 30%, var(--admin-border)); }
.admin .dl-head-name { font-size:.9rem; font-weight:700; color:var(--admin-text); white-space:nowrap; }

/* Stakes chip */
.admin .dl-stakes { display:inline-flex; align-items:center; gap:4px; font-size:var(--admin-text-xs); font-weight:700; padding:3px 9px; border-radius:9999px; text-transform:uppercase; letter-spacing:.04em; flex-shrink:0; }
.admin .dl-stakes-low { color:var(--admin-text-muted); background:var(--admin-surface-alt); border:1px solid var(--admin-border); }
.admin .dl-stakes-high { color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 10%, #fff); border:1px solid color-mix(in srgb, var(--color-primary) 28%, var(--admin-border)); }

.admin .dl-count { color:var(--admin-text-subtle); font-weight:700; }

/* Pending rows */
.admin .dl-pending { padding:6px; }
.admin .dl-prow { display:flex; align-items:flex-start; gap:14px; padding:16px; }
.admin .dl-prow + .dl-prow { border-top:1px solid var(--admin-border); }
.admin .dl-prow-ic { display:flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:11px; flex-shrink:0; color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 8%, #fff); border:1px solid color-mix(in srgb, var(--color-primary) 12%, var(--admin-border)); }
.admin .dl-prow-body { min-width:0; flex:1; }
.admin .dl-prow-top { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.admin .dl-prow-action { font-size:.95rem; font-weight:700; color:var(--admin-text); }
.admin .dl-prow-target { margin-top:5px; font-size:.95rem; color:var(--admin-text); font-weight:500; }
.admin .dl-prow-reason { margin:5px 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); line-height:1.5; }
.admin .dl-prow-actions { display:flex; flex-direction:column; gap:7px; flex-shrink:0; }

/* Buttons */
.admin .dl-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; font-family:var(--font-ui); font-size:var(--admin-text-sm); font-weight:700; padding:8px 15px; border-radius:9999px; cursor:pointer; border:1px solid transparent; transition:background .14s ease, border-color .14s ease, color .14s ease; white-space:nowrap; width:100%; }
.admin .dl-btn-approve { color:#fff; background:var(--color-primary); border-color:var(--color-primary); }
.admin .dl-btn-approve:hover { background:var(--color-primary-hover); }
.admin .dl-btn-reject { color:var(--admin-text-muted); background:var(--admin-surface); border-color:var(--admin-border); }
.admin .dl-btn-reject:hover { color:var(--admin-danger); background:var(--admin-danger-soft); border-color:var(--admin-danger); }

/* Filters */
.admin .dl-filters { display:flex; align-items:flex-end; gap:12px; flex-wrap:wrap; margin-bottom:1rem; padding:0 2px; }
.admin .dl-filter { display:flex; flex-direction:column; gap:5px; }
.admin .dl-filter-label { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.07em; font-weight:700; color:var(--admin-text-subtle); }
.admin .dl-select { font-family:var(--font-ui); font-size:1rem; padding:8px 12px; border-radius:10px; border:1px solid var(--admin-border); background:var(--admin-surface); color:var(--admin-text); min-width:170px; }
.admin .dl-select:focus-visible { outline:2px solid var(--color-primary); outline-offset:1px; }
.admin .dl-btn-filter { width:auto; color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 8%, #fff); border-color:color-mix(in srgb, var(--color-primary) 22%, var(--admin-border)); }
.admin .dl-btn-filter:hover { background:color-mix(in srgb, var(--color-primary) 14%, #fff); }
.admin .dl-clear { align-self:center; font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text-muted); text-decoration:none; }
.admin .dl-clear:hover { color:var(--color-primary); text-decoration:underline; }

/* History rows */
.admin .dl-history { padding:6px; }
.admin .dl-hrow { display:flex; align-items:center; gap:11px; padding:12px 14px; flex-wrap:wrap; }
.admin .dl-hrow + .dl-hrow { border-top:1px solid var(--admin-border); }
.admin .dl-hrow-ic { display:flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:9px; flex-shrink:0; color:var(--admin-text-muted); background:var(--admin-surface-alt); border:1px solid var(--admin-border); }
.admin .dl-hrow-action { font-size:.9rem; font-weight:700; color:var(--admin-text); flex-shrink:0; }
.admin .dl-hrow-target { font-size:var(--admin-text-sm); color:var(--admin-text-secondary); min-width:0; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.admin .dl-hrow-time { font-size:var(--admin-text-xs); color:var(--admin-text-subtle); flex-shrink:0; font-variant-numeric:tabular-nums; margin-left:auto; }

/* Status pill */
.admin .dl-pill { font-size:var(--admin-text-xs); font-weight:800; padding:3px 10px; border-radius:9999px; text-transform:uppercase; letter-spacing:.04em; flex-shrink:0; }
.admin .dl-pill-pending { color:var(--admin-warning); background:var(--admin-warning-soft); }
.admin .dl-pill-approved { color:var(--admin-success); background:var(--admin-success-soft); }
.admin .dl-pill-rejected { color:var(--admin-danger); background:var(--admin-danger-soft); }
.admin .dl-pill-executed { color:var(--admin-info); background:var(--admin-info-soft); }
.admin .dl-pill-undone { color:var(--admin-text-muted); background:var(--admin-surface-alt); }

@media (max-width:600px) {
  .admin .dl-prow { flex-wrap:wrap; }
  .admin .dl-prow-actions { flex-direction:row; width:100%; margin-top:4px; }
  .admin .dl-btn { width:auto; flex:1; }
  .admin .dl-hrow-target { flex-basis:100%; order:5; white-space:normal; }
  .admin .dl-hrow-time { margin-left:0; }
}
`
