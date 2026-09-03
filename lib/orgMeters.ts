/**
 * orgMeters — Sims-style meters for each AI employee (Jill, 2026-09-02: "like sims...
 * each character should have a meter lol"). Fun on the outside, REAL signal inside: every
 * meter is derived from live org data (employees + employee_logs), so the game overlay
 * doubles as Morgan's at-a-glance health read. Nothing is stored; compute on render.
 */
export type EmployeeForMeters = {
  slug: string
  kind: 'owner' | 'chief' | 'agent'
  status: string
  responsibilities?: string[] | null
}
export type LogForMeters = { type: string; created_at: string }

export type Meter = { value: number; label: string; emoji: string }
export type Meters = { morale: Meter; workload: Meter; momentum: Meter; performance: Meter }

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
const arr = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : [])

// Meter weights — the single source of truth for BOTH the number and the "why"
// detail pages (/admin/org/[slug]/vitals/[meter]). Exported so a page can show
// the exact arithmetic behind a ring instead of a hand-copied approximation.
export const METER_WEIGHTS = {
  moraleBase: 70,
  winMorale: 8, // each 'improvement' log
  missMorale: 10, // each 'shortcoming' log
  activeMorale: 10, // +10 while hired/active
  plannedMorale: 15, // -15 while only planned
  workloadAssigned: 35, // each responsibility tagged ASSIGNED
  workloadResp: 6, // each responsibility (recurring duty)
  momentumRecent: 30, // each log within the recent window
  momentumActive: 20, // +20 while active
  recentDays: 7, // "recent" window for momentum
} as const

// Shared intermediate inputs, derived once from live org data. computeMeters and
// the vital "why" pages both read these, so the explanation can never drift from
// the value it explains.
export type MeterInputs = {
  respCount: number
  assigned: number
  active: boolean
  planned: boolean
  improvements: number
  shortcomings: number
  recent: number
  recentDays: number
}

export function meterInputs(e: EmployeeForMeters, logs: LogForMeters[]): MeterInputs {
  const resp = arr(e.responsibilities)
  const cutoff = Date.now() - METER_WEIGHTS.recentDays * 864e5
  return {
    respCount: resp.length,
    assigned: resp.filter((r) => /ASSIGNED/i.test(r)).length,
    active: e.status === 'active',
    planned: e.status === 'planned',
    improvements: logs.filter((l) => l.type === 'improvement').length,
    shortcomings: logs.filter((l) => l.type === 'shortcoming').length,
    recent: logs.filter((l) => Date.parse(l.created_at) >= cutoff).length,
    recentDays: METER_WEIGHTS.recentDays,
  }
}

// Small lore winks (fun, firewalled — never leaves the admin). Keyed by slug.
const MORALE_WINK: Record<string, string> = { 'janet-growth': '😍', 'devon-design': '😍' } // both crushing on Bill

function faceFor(v: number, slug: string): string {
  if (MORALE_WINK[slug]) return MORALE_WINK[slug]
  if (v >= 80) return '😄'
  if (v >= 60) return '🙂'
  if (v >= 40) return '😐'
  return '😖'
}

export function computeMeters(e: EmployeeForMeters, logs: LogForMeters[]): Meters {
  const { respCount, assigned, active, planned, improvements, shortcomings, recent } = meterInputs(e, logs)
  const w = METER_WEIGHTS

  // Workload: open ASSIGNED work weighs heavily; recurring duties add a little.
  const workloadV = clamp(assigned * w.workloadAssigned + respCount * w.workloadResp)
  const workloadLabel = workloadV >= 85 ? 'maxed' : workloadV >= 60 ? 'heavy' : workloadV >= 30 ? 'steady' : 'light'

  // Morale: baseline, lifted by wins + being active, dinged by shortcomings + being unhired.
  let moraleV = w.moraleBase + improvements * w.winMorale - shortcomings * w.missMorale + (active ? w.activeMorale : 0) - (planned ? w.plannedMorale : 0)
  moraleV = clamp(moraleV)

  // Momentum: recent activity; active-but-idle sits low.
  const momentumV = clamp(recent * w.momentumRecent + (active ? w.momentumActive : 0))

  // Performance: share of logged wins (neutral 70 with no history).
  const perfV = improvements + shortcomings === 0 ? 70 : clamp((improvements / (improvements + shortcomings)) * 100)

  return {
    morale: { value: moraleV, label: planned ? 'awaiting hire' : moraleV >= 80 ? 'great' : moraleV >= 60 ? 'good' : moraleV >= 40 ? 'meh' : 'low', emoji: MORALE_WINK[e.slug] ?? (planned ? '💤' : faceFor(moraleV, e.slug)) },
    workload: { value: workloadV, label: workloadLabel, emoji: workloadV >= 85 ? '🔴' : workloadV >= 60 ? '🟠' : '🟢' },
    momentum: { value: momentumV, label: momentumV >= 60 ? 'shipping' : momentumV >= 30 ? 'warming up' : active ? 'idle' : 'not started', emoji: '⚡' },
    performance: { value: perfV, label: perfV >= 80 ? 'strong' : perfV >= 50 ? 'solid' : 'needs work', emoji: '⭐' },
  }
}
