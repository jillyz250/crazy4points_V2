/**
 * Dashboard-preview kit — shared craft for the two Phase 1 dashboard mockups
 * (Devon, 2026-09-02). Data loading + a consistent inline-SVG UI icon set +
 * ring-gauge Sims meters. The two preview routes import from here so they stay
 * on one visual system; each applies its own theme (playful vs sleek).
 *
 * RULE: character EMOJI are avatars (identity) and stay. Everything FUNCTIONAL
 * (queue rows, section headers, actions) uses these stroke icons — no
 * emoji-as-UI-chrome.
 */
import { createAdminClient } from '@/utils/supabase/server'
import { computeMeters, type Meters } from '@/lib/orgMeters'
import { getPagesByPriority, type AdminPage } from '@/lib/admin/registry'
import type { IconName } from './icons'

// Re-export the client-safe primitives so existing imports from kit keep working.
// (Client components must import them from './icons' directly — this module pulls
// in server-only code via createAdminClient.)
export { Icon, Ring, type IconName } from './icons'

// ── Data ────────────────────────────────────────────────────────────────────
export type Emp = {
  id: string
  slug: string
  name: string
  role_title: string | null
  kind: 'owner' | 'chief' | 'agent'
  emoji: string | null
  status: 'active' | 'paused' | 'planned' | 'retired'
  reports_to_id: string | null
  mission: string | null
  responsibilities: string[] | null
}
export type Lore = { id: string; lore_date: string; headline: string; body: string | null; involves: string[] | null }

export type OrgGame = {
  emps: Emp[]
  logsBy: Record<string, { type: string; created_at: string }[]>
  lore: Lore[]
  emojiBySlug: Record<string, string>
  owner?: Emp
  chief?: Emp
  heads: Emp[]
  metersFor: (e: Emp) => Meters
}

const statusRank = { active: 0, paused: 1, planned: 2, retired: 3 } as const

export async function loadOrgGame(loreLimit = 4): Promise<OrgGame> {
  const db = createAdminClient()
  const [{ data: empData }, { data: logData }, { data: loreData }] = await Promise.all([
    db.from('employees').select('id, slug, name, role_title, kind, emoji, status, reports_to_id, mission, responsibilities'),
    db.from('employee_logs').select('employee_id, type, created_at'),
    db.from('org_lore').select('id, lore_date, headline, body, involves').order('lore_date', { ascending: false }).order('created_at', { ascending: false }).limit(loreLimit),
  ])
  const emps = (empData ?? []) as Emp[]
  const lore = (loreData ?? []) as Lore[]
  const logsBy: Record<string, { type: string; created_at: string }[]> = {}
  for (const l of (logData ?? []) as { employee_id: string; type: string; created_at: string }[]) (logsBy[l.employee_id] ||= []).push(l)
  const emojiBySlug = Object.fromEntries(emps.map((e) => [e.slug, e.emoji || '👤']))
  return {
    emps,
    logsBy,
    lore,
    emojiBySlug,
    owner: emps.find((e) => e.kind === 'owner'),
    chief: emps.find((e) => e.kind === 'chief'),
    heads: emps.filter((e) => e.kind === 'agent').sort((a, b) => statusRank[a.status] - statusRank[b.status]),
    metersFor: (e: Emp) => computeMeters(e, logsBy[e.id] || []),
  }
}

// ── "Today" queue — representative counts, real registry destinations ────────
// lane splits the owner's command center: 'decision' = only Jill can do this
// (approve/publish/send); 'team' = a delegable work queue the heads run down.
type QueueSample = { id: string; icon: IconName; count: string; blurb: string; action: string; urgent?: boolean; lane: 'decision' | 'team' }

const QUEUE_SAMPLE: QueueSample[] = [
  { id: 'drafts', icon: 'pencil', count: '3 ready', urgent: true, lane: 'decision',
    blurb: 'Three alerts are written and fact-checked, waiting on your read-through to go live.', action: 'Review' },
  { id: 'newsletter', icon: 'mail', count: 'Fri', lane: 'decision',
    blurb: "This week's newsletter is drafting itself — 6 offers queued in date order.", action: 'Open' },
  { id: 'triage', icon: 'inbox', count: '12 new', urgent: true, lane: 'team',
    blurb: 'Fresh intel landed overnight — a few look like real, coverable stories.', action: 'Triage' },
  { id: 'data-integrity', icon: 'shield', count: '1 high', urgent: true, lane: 'team',
    blurb: 'A published fact may have drifted from its official source. One is high-severity.', action: 'Check it' },
  { id: 'fact-checks', icon: 'check', count: '4 queued', lane: 'team',
    blurb: 'Four items to confirm against the issuer before they can reach the newsletter.', action: 'Confirm' },
  { id: 'errors', icon: 'alert', count: '2 today', lane: 'team',
    blurb: 'Two runtime errors in the last 24h. Bill has eyes on them; nothing is down.', action: 'Look' },
]

export type QueueItem = { page: AdminPage; icon: IconName; count: string; blurb: string; action: string; urgent: boolean; lane: 'decision' | 'team' }

export function buildQueue(): QueueItem[] {
  const byId = new Map<string, AdminPage>(getPagesByPriority().map((p) => [p.id, p]))
  return QUEUE_SAMPLE
    .map((s) => {
      const page = byId.get(s.id)
      return page ? { page, icon: s.icon, count: s.count, blurb: s.blurb, action: s.action, urgent: !!s.urgent, lane: s.lane } : null
    })
    .filter((q): q is QueueItem => q !== null)
    .sort((a, b) => b.page.dashboardPriority - a.page.dashboardPriority)
}

// ── Meter config (shared math, per-variant rendering) ────────────────────────
export type MeterCell = { key: string; label: string; value: number; color: string; emoji: string }
export function meterCells(m: Meters): MeterCell[] {
  return [
    { key: 'morale', label: 'Morale', value: m.morale.value, color: 'var(--admin-success)', emoji: m.morale.emoji },
    { key: 'workload', label: 'Workload', value: m.workload.value, emoji: m.workload.emoji,
      color: m.workload.value >= 85 ? 'var(--admin-danger)' : m.workload.value >= 60 ? 'var(--admin-warning)' : 'var(--admin-success)' },
    { key: 'momentum', label: 'Momentum', value: m.momentum.value, color: 'var(--admin-info)', emoji: '⚡' },
    { key: 'performance', label: 'Performance', value: m.performance.value, color: 'var(--admin-accent)', emoji: '⭐' },
  ]
}

// Shared date string
export function todayLong(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

// A small preview-nav so Jill can jump between the two mockups + the real page.
export function CompareBar({ current }: { current: 'playful' | 'sleek' }) {
  const link = (href: string, label: string, active: boolean) => (
    <a
      href={href}
      style={{
        fontSize: 'var(--admin-text-xs)', fontWeight: 600, padding: '5px 12px', borderRadius: 9999,
        textDecoration: 'none', whiteSpace: 'nowrap',
        background: active ? 'var(--admin-accent)' : 'transparent',
        color: active ? '#fff' : 'var(--admin-text-muted)',
        border: `1px solid ${active ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
      }}
    >
      {label}
    </a>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--admin-space-4)' }}>
      <span style={{ fontSize: 'var(--admin-text-xs)', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--admin-text-subtle)', fontWeight: 700, marginRight: 4 }}>
        Compare
      </span>
      {link('/admin/org/dashboard-preview-playful', 'Playful', current === 'playful')}
      {link('/admin/org/dashboard-preview-sleek', 'Sleek', current === 'sleek')}
      {link('/admin', 'Real dashboard', false)}
    </div>
  )
}
