import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { Icon, type IconName } from '@/components/admin/preview/icons'

export const dynamic = 'force-dynamic'

/**
 * PULSE band comparison MOCKUP (Devon, 2026-09-02) — NOT the live dashboard.
 * Three treatments of the top health band stacked so Jill can pick one to swap
 * into the real dashboard. Trend data is REAL (subscriber growth from
 * subscribers.subscribed_at); counts with no honest trend stay clean stats.
 */

const PURPLE = 'var(--color-primary)'
const GOLD = 'var(--color-accent)'
const DISPLAY = 'var(--font-display)'
const UP = 'var(--admin-success)'
const DOWN = 'var(--admin-danger)'

async function tableCount(table: string, activeOnly = false): Promise<number | null> {
  try {
    const db = createAdminClient()
    const base = db.from(table).select('*', { count: 'exact', head: true })
    const { count } = await (activeOnly ? base.eq('active', true) : base)
    return count ?? null
  } catch { return null }
}

// ── Real subscriber trend from subscribed_at ────────────────────────────────
type Trend = {
  series: number[]        // cumulative active-ish total at each of the last 30 days
  daily: number[]         // signups per day (last 30)
  last7: number
  prev7: number
  delta: number           // last7 - prev7
}

async function subscriberTrend(): Promise<Trend | null> {
  try {
    const db = createAdminClient()
    const since = new Date(Date.now() - 44 * 864e5).toISOString()
    // Pull just the timestamps (tiny table). Count both older baseline + recent.
    const { data } = await db.from('subscribers').select('subscribed_at').not('subscribed_at', 'is', null)
    const times = ((data ?? []) as { subscribed_at: string }[]).map((r) => Date.parse(r.subscribed_at)).filter((n) => !Number.isNaN(n))
    void since
    const DAYS = 30
    const now = new Date()
    const dayEnd: number[] = []
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(now); d.setHours(23, 59, 59, 999); d.setDate(d.getDate() - i)
      dayEnd.push(d.getTime())
    }
    const dayStart0 = new Date(now); dayStart0.setHours(0, 0, 0, 0); dayStart0.setDate(dayStart0.getDate() - (DAYS - 1))
    const series = dayEnd.map((end) => times.filter((t) => t <= end).length) // cumulative
    const daily = dayEnd.map((end, i) => {
      const start = i === 0 ? dayStart0.getTime() : dayEnd[i - 1] + 1
      return times.filter((t) => t >= start && t <= end).length
    })
    const wk = (from: number, to: number) => times.filter((t) => t > from && t <= to).length
    const nowMs = Date.now()
    const last7 = wk(nowMs - 7 * 864e5, nowMs)
    const prev7 = wk(nowMs - 14 * 864e5, nowMs - 7 * 864e5)
    return { series, daily, last7, prev7, delta: last7 - prev7 }
  } catch { return null }
}

// ── Tiny inline SVG sparkline / area chart (no libraries) ───────────────────
function points(values: number[], w: number, h: number, pad = 2): [number, number][] {
  if (values.length === 0) return []
  const max = Math.max(...values), min = Math.min(...values)
  const range = max - min || 1
  const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0
  return values.map((v, i) => [pad + i * step, h - pad - ((v - min) / range) * (h - pad * 2)])
}
function Sparkline({ values, w = 68, h = 22, color = PURPLE, area = false }: { values: number[]; w?: number; h?: number; color?: string; area?: boolean }) {
  const pts = points(values, w, h)
  if (pts.length < 2) return null
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
      {area && <path d={`${line} L${last[0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`} fill={color} opacity={0.1} />}
      <path d={line} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2} fill={color} />
    </svg>
  )
}
function AreaChart({ values, w = 260, h = 60, color = PURPLE }: { values: number[]; w?: number; h?: number; color?: string }) {
  const pts = points(values, w, h, 3)
  if (pts.length < 2) return null
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }} aria-hidden="true">
      <defs>
        <linearGradient id="pp-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${last[0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`} fill="url(#pp-grad)" />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function DeltaChip({ delta, unit = '' }: { delta: number; unit?: string }) {
  if (delta === 0) return <span className="pp-delta pp-delta-flat">±0{unit}</span>
  const up = delta > 0
  return (
    <span className={`pp-delta ${up ? 'pp-delta-up' : 'pp-delta-down'}`}>
      <Icon name="trending" size={11} style={up ? undefined : { transform: 'scaleY(-1)' }} />
      {up ? '+' : ''}{delta}{unit}
    </span>
  )
}

type Stat = { label: string; value: string; icon: IconName }

export default async function PulsePreview() {
  const [alerts, programs, subsActive, subsTotal, trend] = await Promise.all([
    tableCount('alerts'),
    tableCount('programs'),
    tableCount('subscribers', true),
    tableCount('subscribers'),
    subscriberTrend(),
  ])

  const fmt = (n: number | null) => (n != null ? n.toLocaleString() : '—')
  const subValue = fmt(subsActive)
  const baseStats: Stat[] = [
    { label: 'Alerts live', value: fmt(alerts), icon: 'bell' },
    { label: 'Programs tracked', value: fmt(programs), icon: 'database' },
    { label: 'Subscribers', value: subValue, icon: 'users' },
  ]
  const weekLabel = trend ? `${trend.last7} this week` : ''

  return (
    <div className="pp-root">
      <style dangerouslySetInnerHTML={{ __html: PP_CSS }} />
      <div className="pp-wrap">
        <Link href="/admin" className="pp-back"><Icon name="arrowLeft" size={15} /> Dashboard</Link>
        <div className="pp-banner"><Icon name="spark" size={15} /><strong>MOCKUP — Pulse band, 3 ways.</strong><span>Pick one to swap into the live dashboard. Subscriber trend is real data; clean counts show no faked trend.</span></div>
        <h1 className="pp-title">Pulse, three ways</h1>

        {/* ── Direction 1 — Stat + Delta ── */}
        <div className="pp-block">
          <div className="pp-block-head"><span className="pp-num">1</span><div><div className="pp-block-title">Stat + Delta</div><div className="pp-block-sub">The clean row you have now, plus a small up/down chip where the change is real.</div></div></div>
          <div className="pp-band">
            <span className="pp-tag"><Icon name="pulse" size={15} /> Pulse</span>
            <div className="pp-stats">
              {baseStats.map((s) => (
                <span key={s.label} className="pp-stat">
                  <span className="pp-stat-ic"><Icon name={s.icon} size={14} /></span>
                  <span className="pp-stat-val">{s.value}</span>
                  <span className="pp-stat-label">{s.label}</span>
                  {s.label === 'Subscribers' && trend && <DeltaChip delta={trend.delta} />}
                </span>
              ))}
              <span className="pp-stat">
                <span className="pp-stat-ic"><Icon name="shield" size={14} /></span>
                <span className="pp-status-dot" style={{ background: UP }} />
                <span className="pp-stat-label">Accuracy healthy</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Direction 2 — Sparkline ── */}
        <div className="pp-block">
          <div className="pp-block-head"><span className="pp-num">2</span><div><div className="pp-block-title">Sparkline</div><div className="pp-block-sub">Trend-capable metrics get a tiny inline 30-day line. Subscribers is the star.</div></div></div>
          <div className="pp-band">
            <span className="pp-tag"><Icon name="pulse" size={15} /> Pulse</span>
            <div className="pp-stats">
              {baseStats.map((s) => (
                <span key={s.label} className="pp-stat">
                  <span className="pp-stat-ic"><Icon name={s.icon} size={14} /></span>
                  <span className="pp-stat-val">{s.value}</span>
                  <span className="pp-stat-label">{s.label}</span>
                  {s.label === 'Subscribers' && trend && (
                    <span className="pp-spark"><Sparkline values={trend.series} color={trend.delta >= 0 ? UP : DOWN} area /></span>
                  )}
                </span>
              ))}
              <span className="pp-stat">
                <span className="pp-stat-ic"><Icon name="shield" size={14} /></span>
                <span className="pp-status-dot" style={{ background: UP }} />
                <span className="pp-stat-label">Accuracy healthy</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Direction 3 — Feature chart ── */}
        <div className="pp-block">
          <div className="pp-block-head"><span className="pp-num">3</span><div><div className="pp-block-title">Feature chart</div><div className="pp-block-sub">The star metric gets a small area chart; the rest sit beside it as compact stats.</div></div></div>
          <div className="pp-band pp-band-feature">
            <div className="pp-feature">
              <div className="pp-feature-head">
                <span className="pp-tag"><Icon name="users" size={14} /> Subscribers</span>
                {trend && <DeltaChip delta={trend.delta} />}
              </div>
              <div className="pp-feature-row">
                <span className="pp-feature-num">{subValue}</span>
                <span className="pp-feature-chart">{trend && <AreaChart values={trend.series} color={trend.delta >= 0 ? PURPLE : DOWN} />}</span>
              </div>
              <div className="pp-feature-foot">{trend ? `${weekLabel} · ${trend.prev7} the week before` : 'Last 30 days'} &middot; {fmt(subsTotal)} all-time</div>
            </div>
            <div className="pp-feature-side">
              <span className="pp-side-stat"><span className="pp-stat-ic"><Icon name="bell" size={14} /></span><span className="pp-stat-val">{fmt(alerts)}</span><span className="pp-stat-label">Alerts live</span></span>
              <span className="pp-side-stat"><span className="pp-stat-ic"><Icon name="database" size={14} /></span><span className="pp-stat-val">{fmt(programs)}</span><span className="pp-stat-label">Programs</span></span>
              <span className="pp-side-stat"><span className="pp-stat-ic"><Icon name="shield" size={14} /></span><span className="pp-status-dot" style={{ background: UP }} /><span className="pp-stat-label">Accuracy healthy</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const PP_CSS = `
.admin .pp-wrap { max-width:960px; margin:0 auto; padding:0 4px; }
.admin .pp-back { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text-muted); text-decoration:none; margin-bottom:1.2rem; transition:gap .14s ease, color .14s ease; }
.admin .pp-back:hover { gap:9px; color:var(--color-primary); text-decoration:none; }
.admin .pp-banner { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:10px 16px; margin-bottom:1.6rem; border-radius:12px;
  background:linear-gradient(90deg, var(--admin-accent-soft), rgba(212,175,55,.12)); border:1px solid var(--admin-border); color:var(--admin-text); font-size:var(--admin-text-sm); }
.admin .pp-banner strong { color:var(--color-primary); }
.admin .pp-banner span { color:var(--admin-text-muted); }
.admin .pp-title { font-family:${DISPLAY}; font-size:2rem; font-weight:800; letter-spacing:-.02em; color:var(--color-primary); margin:0 0 1.8rem; }
.admin .pp-block { margin-bottom:2.4rem; }
.admin .pp-block-head { display:flex; align-items:flex-start; gap:12px; margin-bottom:.9rem; }
.admin .pp-num { display:flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; flex-shrink:0;
  background:var(--color-primary); color:#fff; font-size:var(--admin-text-sm); font-weight:800; font-family:${DISPLAY}; }
.admin .pp-block-title { font-family:${DISPLAY}; font-size:1.25rem; font-weight:700; color:var(--admin-text); line-height:1.1; }
.admin .pp-block-sub { font-size:var(--admin-text-sm); color:var(--admin-text-muted); margin-top:2px; }

/* The band itself (kept compact — it's a top strip) */
.admin .pp-band { display:flex; align-items:center; gap:1.4rem; flex-wrap:wrap; padding:14px 20px; border-radius:14px;
  border:1px solid color-mix(in srgb, var(--color-primary) 10%, var(--admin-border));
  background:linear-gradient(90deg, color-mix(in srgb, var(--color-primary) 6%, #fff), #fff 60%);
  box-shadow:0 1px 2px rgba(107,45,143,.04), 0 14px 34px -30px rgba(107,45,143,.3); }
.admin .pp-tag { display:inline-flex; align-items:center; gap:7px; font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:var(--color-primary); flex-shrink:0; }
.admin .pp-stats { display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap; }
.admin .pp-stat { display:inline-flex; align-items:center; gap:7px; }
.admin .pp-stat-ic { color:var(--admin-text-subtle); display:flex; }
.admin .pp-stat-val { font-size:1.05rem; font-weight:800; color:var(--admin-text); font-variant-numeric:tabular-nums; letter-spacing:-.01em; }
.admin .pp-stat-label { font-size:var(--admin-text-xs); color:var(--admin-text-muted); text-transform:uppercase; letter-spacing:.05em; font-weight:600; }
.admin .pp-status-dot { width:9px; height:9px; border-radius:50%; }
.admin .pp-spark { display:inline-flex; align-items:center; margin-left:2px; }

/* delta chip */
.admin .pp-delta { display:inline-flex; align-items:center; gap:3px; font-size:var(--admin-text-xs); font-weight:800; padding:2px 7px; border-radius:9999px; font-variant-numeric:tabular-nums; }
.admin .pp-delta-up { color:var(--admin-success); background:var(--admin-success-soft); }
.admin .pp-delta-down { color:var(--admin-danger); background:var(--admin-danger-soft); }
.admin .pp-delta-flat { color:var(--admin-text-muted); background:var(--admin-surface-alt); }

/* Feature chart band */
.admin .pp-band-feature { align-items:stretch; gap:1.8rem; }
.admin .pp-feature { flex:1; min-width:240px; }
.admin .pp-feature-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:4px; }
.admin .pp-feature-row { display:flex; align-items:flex-end; gap:14px; }
.admin .pp-feature-num { font-family:${DISPLAY}; font-size:2.1rem; font-weight:800; color:var(--admin-text); line-height:1; letter-spacing:-.02em; flex-shrink:0; }
.admin .pp-feature-chart { flex:1; min-width:120px; }
.admin .pp-feature-foot { font-size:var(--admin-text-xs); color:var(--admin-text-subtle); margin-top:6px; }
.admin .pp-feature-side { display:flex; flex-direction:column; gap:.7rem; justify-content:center; padding-left:1.6rem; border-left:1px solid var(--admin-border); }
.admin .pp-side-stat { display:inline-flex; align-items:center; gap:7px; }

@media (max-width:640px) {
  .admin .pp-band-feature { flex-direction:column; }
  .admin .pp-feature-side { border-left:none; border-top:1px solid var(--admin-border); padding-left:0; padding-top:1rem; flex-direction:row; flex-wrap:wrap; gap:1.2rem; }
}
`
