import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import {
  computeMeters,
  meterInputs,
  METER_WEIGHTS,
  type EmployeeForMeters,
  type LogForMeters,
} from '@/lib/orgMeters'
import { Icon, Ring, meterCells, type IconName } from '@/components/admin/preview/kit'

export const dynamic = 'force-dynamic'

const GOLD = 'var(--color-accent)'
const DISPLAY = 'var(--font-display)'

// The four vitals are the ONLY valid detail views; anything else 404s.
const METERS = ['morale', 'workload', 'momentum', 'performance'] as const
type MeterKey = (typeof METERS)[number]
const isMeter = (s: string): s is MeterKey => (METERS as readonly string[]).includes(s)

const METER_ICON: Record<MeterKey, IconName> = { morale: 'heart', workload: 'gauge', momentum: 'bolt', performance: 'star' }

type Emp = {
  id: string
  slug: string
  name: string
  role_title: string | null
  kind: 'owner' | 'chief' | 'agent'
  status: string
  emoji: string | null
  responsibilities: string[] | null
}
type Log = { id: string; type: string; note: string; actor: string | null; created_at: string }

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// One contribution line in the arithmetic breakdown: a plain-language reason, the
// points it adds/removes, and (optionally) the real rows behind it.
type Row = { label: string; delta: number; note?: string; sources?: { icon: IconName; text: string; when?: string; tone?: 'win' | 'miss' | 'flag' }[] }

export default async function VitalWhyPage({ params }: { params: Promise<{ slug: string; meter: string }> }) {
  const { slug, meter } = await params
  if (!isMeter(meter)) notFound()

  const db = createAdminClient()
  const { data } = await db
    .from('employees')
    .select('id, slug, name, role_title, kind, status, emoji, responsibilities')
    .eq('slug', slug)
    .maybeSingle()
  const e = data as Emp | null
  if (!e) notFound()
  // Meters are an agent overlay; heads/owner don't carry them.
  if (e.kind !== 'agent') notFound()

  // Same log query shape as the employee hero (order desc, limit 12) so the value
  // shown here is IDENTICAL to the ring the reader clicked.
  const { data: logsData } = await db
    .from('employee_logs')
    .select('id, type, note, actor, created_at')
    .eq('employee_id', e.id)
    .order('created_at', { ascending: false })
    .limit(12)
  const logs = (logsData ?? []) as Log[]

  const empForMeters: EmployeeForMeters = {
    slug: e.slug,
    kind: 'agent',
    status: e.status,
    responsibilities: e.responsibilities,
  }
  const logsForMeters: LogForMeters[] = logs.map((l) => ({ type: l.type, created_at: l.created_at }))
  const inputs = meterInputs(empForMeters, logsForMeters)
  const cells = meterCells(computeMeters(empForMeters, logsForMeters))
  const cell = cells.find((c) => c.key === meter)!
  const w = METER_WEIGHTS
  const first = e.name.split(' ')[0]

  const wins = logs.filter((l) => l.type === 'improvement')
  const misses = logs.filter((l) => l.type === 'shortcoming')
  const cutoff = Date.now() - w.recentDays * 864e5
  const recentLogs = logs.filter((l) => Date.parse(l.created_at) >= cutoff)
  const resp = Array.isArray(e.responsibilities) ? e.responsibilities : []
  const assignedResp = resp.filter((r) => /ASSIGNED/i.test(r))

  // Trim a long responsibility/note to a readable clause for the source list.
  const trim = (s: string, n = 150) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s)

  // Build the per-meter breakdown: the plain-language formula, the arithmetic
  // rows (each mirroring exactly one term in computeMeters), and the raw total
  // before the 0–100 clamp so any capping is shown honestly.
  let formula: string
  let rows: Row[]
  let raw: number

  if (meter === 'morale') {
    formula = `Start at a baseline of ${w.moraleBase}. Add ${w.winMorale} for each logged win and take off ${w.missMorale} for each shortcoming. Add ${w.activeMorale} while active (subtract ${w.plannedMorale} while only planned). Capped to 0–100.`
    rows = [
      { label: 'Baseline', delta: w.moraleBase, note: 'Every active head starts here.' },
      inputs.active
        ? { label: 'Active on the team', delta: w.activeMorale }
        : inputs.planned
          ? { label: 'Only planned (not yet hired)', delta: -w.plannedMorale }
          : { label: 'Not active', delta: 0 },
      {
        label: `Wins (${wins.length} × +${w.winMorale})`,
        delta: wins.length * w.winMorale,
        sources: wins.map((l) => ({ icon: 'star', text: trim(l.note), when: fmtDate(l.created_at), tone: 'win' as const })),
      },
      {
        label: `Shortcomings (${misses.length} × −${w.missMorale})`,
        delta: -misses.length * w.missMorale,
        sources: misses.map((l) => ({ icon: 'alert', text: trim(l.note), when: fmtDate(l.created_at), tone: 'miss' as const })),
      },
    ]
    raw = w.moraleBase + wins.length * w.winMorale - misses.length * w.missMorale + (inputs.active ? w.activeMorale : 0) - (inputs.planned ? w.plannedMorale : 0)
  } else if (meter === 'workload') {
    formula = `Each responsibility tagged ASSIGNED counts as open work worth ${w.workloadAssigned}. Every standing responsibility adds ${w.workloadResp}. Capped to 0–100 — so a full plate reads as "maxed".`
    rows = [
      {
        label: `Assigned work (${inputs.assigned} × +${w.workloadAssigned})`,
        delta: inputs.assigned * w.workloadAssigned,
        sources: assignedResp.map((r) => ({ icon: 'flag', text: trim(r), tone: 'flag' as const })),
      },
      {
        label: `Standing duties (${inputs.respCount} × +${w.workloadResp})`,
        delta: inputs.respCount * w.workloadResp,
        note: 'Every recurring responsibility on this head, ASSIGNED or not.',
      },
    ]
    raw = inputs.assigned * w.workloadAssigned + inputs.respCount * w.workloadResp
  } else if (meter === 'momentum') {
    formula = `Each activity log in the last ${w.recentDays} days is worth ${w.momentumRecent}, plus ${w.momentumActive} while active. Capped to 0–100. Recent shipping reads high; a quiet week fades.`
    rows = [
      {
        label: `Recent activity (${recentLogs.length} × +${w.momentumRecent})`,
        delta: recentLogs.length * w.momentumRecent,
        note: `Logs in the last ${w.recentDays} days.`,
        sources: recentLogs.map((l) => ({
          icon: l.type === 'improvement' ? 'star' : l.type === 'shortcoming' ? 'alert' : 'check',
          text: trim(l.note),
          when: fmtDate(l.created_at),
          tone: l.type === 'shortcoming' ? ('miss' as const) : ('win' as const),
        })),
      },
      inputs.active ? { label: 'Active on the team', delta: w.momentumActive } : { label: 'Not active', delta: 0 },
    ]
    raw = recentLogs.length * w.momentumRecent + (inputs.active ? w.momentumActive : 0)
  } else {
    // performance
    const total = wins.length + misses.length
    formula =
      total === 0
        ? 'No wins or shortcomings logged yet, so Performance sits at a neutral 70 until there’s a track record.'
        : `Share of logged outcomes that were wins: ${wins.length} win${wins.length === 1 ? '' : 's'} ÷ ${total} logged (${wins.length} win${wins.length === 1 ? '' : 's'} + ${misses.length} shortcoming${misses.length === 1 ? '' : 's'}) × 100.`
    rows = [
      {
        label: `Wins (${wins.length})`,
        delta: wins.length,
        sources: wins.map((l) => ({ icon: 'star', text: trim(l.note), when: fmtDate(l.created_at), tone: 'win' as const })),
      },
      {
        label: `Shortcomings (${misses.length})`,
        delta: misses.length,
        sources: misses.map((l) => ({ icon: 'alert', text: trim(l.note), when: fmtDate(l.created_at), tone: 'miss' as const })),
      },
    ]
    raw = cell.value
  }

  const clamped = meter !== 'performance' && (raw > 100 || raw < 0)

  return (
    <div className="vt-root">
      <style dangerouslySetInnerHTML={{ __html: VT_CSS }} />
      <div className="vt-wrap">
        <Link href={`/admin/org/${slug}`} className="vt-back">
          <Icon name="arrowLeft" size={15} /> {first}
        </Link>

        {/* ── Header: the value, its label, and what the vital means ── */}
        <header className="vt-hero" style={{ ['--vt-accent' as string]: cell.color }}>
          <div className="vt-hero-ring">
            <Ring value={cell.value} color={cell.color} size={104} stroke={9} track="var(--admin-surface-alt)" valueColor="var(--admin-text)" />
          </div>
          <div className="vt-hero-id">
            <span className="vt-kicker"><Icon name={METER_ICON[meter]} size={13} /> {first}’s vital</span>
            <h1 className="vt-title">{cell.label}</h1>
            <div className="vt-lede">
              <span className="vt-badge">{cell.value} / 100 · {describe(meter, cell.value)}</span>
              <span className="vt-emoji" aria-hidden>{cell.emoji}</span>
            </div>
          </div>
        </header>

        {/* ── How it's computed: the plain-language formula ── */}
        <section className="vt-card">
          <h2 className="vt-h2"><Icon name="book" size={14} /> How it’s computed</h2>
          <p className="vt-formula">{formula}</p>
        </section>

        {/* ── The math: each term, its points, and the real rows behind it ── */}
        <section className="vt-card">
          <h2 className="vt-h2"><Icon name="gauge" size={14} /> The math</h2>
          <div className="vt-rows">
            {rows.map((r, i) => (
              <div key={i} className="vt-row">
                <div className="vt-row-head">
                  <span className="vt-row-label">{r.label}</span>
                  <span className={`vt-delta ${r.delta > 0 ? 'vt-delta-pos' : r.delta < 0 ? 'vt-delta-neg' : 'vt-delta-zero'}`}>
                    {r.delta > 0 ? `+${r.delta}` : r.delta < 0 ? `${r.delta}` : '0'}
                  </span>
                </div>
                {r.note && <p className="vt-row-note">{r.note}</p>}
                {r.sources && r.sources.length > 0 && (
                  <ul className="vt-src">
                    {r.sources.map((s, j) => (
                      <li key={j} className={`vt-src-item vt-src-${s.tone ?? 'flag'}`}>
                        <Icon name={s.icon} size={13} />
                        <span className="vt-src-text">{s.text}</span>
                        {s.when && <span className="vt-src-when">{s.when}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="vt-total">
            {meter === 'performance' ? (
              <>
                <span className="vt-total-label">
                  {wins.length + misses.length === 0
                    ? 'No history yet → neutral'
                    : `${wins.length} ÷ ${wins.length + misses.length} × 100`}
                </span>
                <span className="vt-total-val" style={{ color: cell.color }}>= {cell.value}</span>
              </>
            ) : (
              <>
                <span className="vt-total-label">
                  Total{clamped ? ` (raw ${raw}, ${raw > 100 ? 'capped at 100' : 'floored at 0'})` : ''}
                </span>
                <span className="vt-total-val" style={{ color: cell.color }}>= {cell.value}</span>
              </>
            )}
          </div>
        </section>

        <Link href={`/admin/org/${slug}`} className="vt-done">
          <Icon name="arrowLeft" size={14} /> Back to {first}’s page
        </Link>
      </div>
    </div>
  )
}

function describe(key: MeterKey, v: number): string {
  if (key === 'workload') return v >= 85 ? 'Maxed' : v >= 60 ? 'Heavy' : v >= 30 ? 'Steady' : 'Light'
  if (key === 'morale') return v >= 80 ? 'Great' : v >= 60 ? 'Good' : v >= 40 ? 'Meh' : 'Low'
  if (key === 'momentum') return v >= 60 ? 'Shipping' : v >= 30 ? 'Warming up' : 'Idle'
  return v >= 80 ? 'Strong' : v >= 50 ? 'Solid' : 'Needs work'
}

const VT_CSS = `
.admin .vt-wrap { max-width:760px; margin:0 auto; padding:0 4px; }
.admin .vt-back { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text-muted); text-decoration:none; margin-bottom:1.4rem; transition:gap .14s ease, color .14s ease; }
.admin .vt-back:hover { gap:9px; color:var(--color-primary); text-decoration:none; }

.admin .vt-hero {
  display:flex; align-items:center; gap:1.3rem; padding:1.4rem 1.5rem; margin-bottom:1.3rem;
  border-radius:20px; position:relative; overflow:hidden;
  border:1px solid color-mix(in srgb, var(--vt-accent) 22%, var(--admin-border));
  background:radial-gradient(90% 130% at 100% 0%, color-mix(in srgb, var(--vt-accent) 8%, #fff), #fff 70%);
  box-shadow:0 1px 2px rgba(107,45,143,.04), 0 22px 50px -34px rgba(107,45,143,.26);
}
.admin .vt-hero::before { content:''; position:absolute; top:0; left:1.5rem; right:1.5rem; height:2px; border-radius:2px; background:linear-gradient(90deg, transparent, ${GOLD}, transparent); opacity:.85; }
.admin .vt-hero-ring { flex-shrink:0; }
.admin .vt-hero-id { min-width:0; }
.admin .vt-kicker { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.09em; color:var(--admin-text-subtle); }
.admin .vt-kicker svg { color:var(--vt-accent); }
.admin .vt-title { font-family:${DISPLAY}; font-size:2rem; font-weight:800; letter-spacing:-.02em; color:var(--color-primary); margin:.25rem 0 .45rem; line-height:1.05; }
.admin .vt-lede { display:flex; align-items:center; gap:9px; }
.admin .vt-badge { display:inline-flex; align-items:center; font-size:var(--admin-text-sm); font-weight:700; color:var(--admin-text); padding:3px 12px; border-radius:9999px; background:color-mix(in srgb, var(--vt-accent) 12%, #fff); border:1px solid color-mix(in srgb, var(--vt-accent) 26%, var(--admin-border)); }
.admin .vt-emoji { font-size:1.1rem; line-height:1; }

.admin .vt-card { padding:1.15rem 1.3rem; margin-bottom:1.1rem; border-radius:16px; border:1px solid var(--admin-border); background:var(--admin-surface); box-shadow:0 1px 2px rgba(107,45,143,.03); }
.admin .vt-h2 { display:flex; align-items:center; gap:8px; font-family:${DISPLAY}; font-size:1.05rem; font-weight:700; color:var(--color-primary); margin:0 0 .7rem; }
.admin .vt-h2 svg { color:var(--admin-text-subtle); }
.admin .vt-formula { margin:0; font-size:var(--admin-text-sm); line-height:1.6; color:var(--admin-text-secondary); }

.admin .vt-rows { display:flex; flex-direction:column; gap:2px; }
.admin .vt-row { padding:.7rem 0; border-bottom:1px solid var(--admin-border-soft, var(--admin-border)); }
.admin .vt-row:first-child { padding-top:.2rem; }
.admin .vt-row-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
.admin .vt-row-label { font-size:var(--admin-text-sm); font-weight:700; color:var(--admin-text); }
.admin .vt-delta { flex-shrink:0; font-size:var(--admin-text-sm); font-weight:800; font-variant-numeric:tabular-nums; }
.admin .vt-delta-pos { color:var(--admin-success); }
.admin .vt-delta-neg { color:var(--admin-danger); }
.admin .vt-delta-zero { color:var(--admin-text-subtle); }
.admin .vt-row-note { margin:.25rem 0 0; font-size:var(--admin-text-xs); color:var(--admin-text-muted); line-height:1.5; }
.admin .vt-src { list-style:none; margin:.55rem 0 0; padding:0; display:flex; flex-direction:column; gap:6px; }
.admin .vt-src-item { display:flex; align-items:flex-start; gap:8px; padding:7px 10px; border-radius:10px; background:var(--admin-surface-alt); border:1px solid var(--admin-border); font-size:var(--admin-text-xs); line-height:1.5; color:var(--admin-text-secondary); }
.admin .vt-src-item svg { flex-shrink:0; margin-top:2px; }
.admin .vt-src-win svg { color:var(--admin-success); }
.admin .vt-src-miss svg { color:var(--admin-warning); }
.admin .vt-src-flag svg { color:var(--color-primary); }
.admin .vt-src-text { flex:1; min-width:0; }
.admin .vt-src-when { flex-shrink:0; font-weight:600; color:var(--admin-text-subtle); white-space:nowrap; }

.admin .vt-total { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-top:.9rem; padding-top:.9rem; border-top:2px solid var(--admin-border); }
.admin .vt-total-label { font-size:var(--admin-text-sm); font-weight:700; color:var(--admin-text-muted); }
.admin .vt-total-val { font-size:1.35rem; font-weight:800; font-variant-numeric:tabular-nums; }

.admin .vt-done { display:inline-flex; align-items:center; gap:7px; font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text-muted); text-decoration:none; padding:2px 0; transition:gap .14s ease, color .14s ease; }
.admin .vt-done:hover { gap:10px; color:var(--color-primary); text-decoration:none; }

@media (max-width:560px) {
  .admin .vt-hero { flex-direction:column; align-items:flex-start; gap:1rem; }
  .admin .vt-title { font-size:1.7rem; }
}
`
