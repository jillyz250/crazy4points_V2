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
export type IconName =
  | 'inbox' | 'pencil' | 'alert' | 'shield' | 'check' | 'mail'
  | 'sun' | 'users' | 'coffee' | 'arrow' | 'flag' | 'spark' | 'bolt' | 'star' | 'gauge'

type QueueSample = { id: string; icon: IconName; count: string; blurb: string; action: string; urgent?: boolean }

const QUEUE_SAMPLE: QueueSample[] = [
  { id: 'triage', icon: 'inbox', count: '12 new', urgent: true,
    blurb: 'Fresh intel landed overnight — a few look like real, coverable stories.', action: 'Triage' },
  { id: 'drafts', icon: 'pencil', count: '3 ready', urgent: true,
    blurb: 'Three alerts are written and fact-checked, waiting on your read-through to go live.', action: 'Review' },
  { id: 'data-integrity', icon: 'shield', count: '1 high', urgent: true,
    blurb: 'A published fact may have drifted from its official source. One is high-severity.', action: 'Check it' },
  { id: 'errors', icon: 'alert', count: '2 today',
    blurb: 'Two runtime errors in the last 24h. Bill has eyes on them; nothing is down.', action: 'Look' },
  { id: 'fact-checks', icon: 'check', count: '4 queued',
    blurb: 'Four items to confirm against the issuer before they can reach the newsletter.', action: 'Confirm' },
  { id: 'newsletter', icon: 'mail', count: 'Fri',
    blurb: "This week's newsletter is drafting itself — 6 offers queued in date order.", action: 'Open' },
]

export type QueueItem = { page: AdminPage; icon: IconName; count: string; blurb: string; action: string; urgent: boolean }

export function buildQueue(): QueueItem[] {
  const byId = new Map<string, AdminPage>(getPagesByPriority().map((p) => [p.id, p]))
  return QUEUE_SAMPLE
    .map((s) => {
      const page = byId.get(s.id)
      return page ? { page, icon: s.icon, count: s.count, blurb: s.blurb, action: s.action, urgent: !!s.urgent } : null
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

// ── Inline SVG icon set (consistent 24×24 stroke, currentColor) ──────────────
const PATHS: Record<IconName, React.ReactNode> = {
  inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
  pencil: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  check: <><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" /></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  coffee: <><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><path d="M6 2v2M10 2v2M14 2v2" /></>,
  arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22v-7" /></>,
  spark: <path d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3z" />,
  bolt: <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />,
  star: <path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.3 5.8 20.9l1.6-6.8L2.2 8.9l6.9-.6L12 2z" />,
  gauge: <><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /><path d="M13.4 12.6 19 7M4 20a8 8 0 1 1 16 0" /></>,
}

export function Icon({ name, size = 20, stroke = 1.75, className, style }: {
  name: IconName; size?: number; stroke?: number; className?: string; style?: React.CSSProperties
}) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}

// ── Ring gauge — an SVG progress ring, optionally with a centered value ───────
export function Ring({
  value, color, size = 46, stroke = 4, track = 'var(--admin-surface-alt)',
  showValue = true, valueColor, children,
}: {
  value: number; color: string; size?: number; stroke?: number; track?: string
  showValue?: boolean; valueColor?: string; children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100)
  const cx = size / 2
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children ?? (showValue && (
          <span style={{ fontSize: size * 0.3, fontWeight: 700, color: valueColor ?? color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {Math.round(value)}
          </span>
        ))}
      </div>
    </div>
  )
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
