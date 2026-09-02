import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { Badge } from '@/components/admin/ui/Badge'
import { computeMeters, type Meters } from '@/lib/orgMeters'
import { getPagesByPriority, type AdminPage } from '@/lib/admin/registry'

export const dynamic = 'force-dynamic'

/**
 * Phase 1 dashboard MOCKUP (Devon, 2026-09-02).
 * ---------------------------------------------
 * A VIEWABLE PREVIEW of the redesigned /admin home — NOT the live dashboard.
 * The real /admin page is untouched; this route exists only so Jill can see and
 * feel the redesign inside her real admin before we build it for real.
 *
 * Everything here uses representative/sample numbers for the "Today" queue (the
 * point is the FEEL, not wired queries) but the queue items link to REAL pages
 * from the registry, ordered by their real dashboardPriority. The org game below
 * reads LIVE employees + logs + lore, same as /admin/org.
 *
 * Built on the new admin spacing + type tokens (--admin-space-*, --admin-text-*)
 * to demonstrate the polished, consistent look Phase 1 will roll out.
 */

// ── Types (mirror /admin/org) ───────────────────────────────────────────────
type Emp = {
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
type Lore = { id: string; lore_date: string; headline: string; body: string | null; involves: string[] | null }

// ── "Today" queue — representative copy keyed to real registry pages ─────────
// count = sample; blurb = plain-English "what this means"; action = the verb.
type QueueSample = { count: string; blurb: string; action: string; urgent?: boolean }
const QUEUE_SAMPLE: Record<string, QueueSample> = {
  triage: {
    count: '12 new',
    blurb: 'Fresh intel signals landed overnight — a few look like real, coverable stories.',
    action: 'Triage them',
    urgent: true,
  },
  drafts: {
    count: '3 ready',
    blurb: 'Three alerts are written and fact-checked, just waiting on your read-through to go live.',
    action: 'Review & publish',
    urgent: true,
  },
  'data-integrity': {
    count: '1 high · 4 total',
    blurb: 'A published fact may have drifted from its official source. One is high-severity.',
    action: 'Check it',
    urgent: true,
  },
  errors: {
    count: '2 today',
    blurb: 'Two runtime errors in the last 24 hours. Bill has eyes on them; nothing is down.',
    action: 'Take a look',
  },
  'fact-checks': {
    count: '4 queued',
    blurb: 'Four items to confirm against the issuer before they can reach the newsletter.',
    action: 'Confirm facts',
  },
  newsletter: {
    count: 'Fri',
    blurb: "This week's newsletter is drafting itself — 6 offers queued in date order, ready when you are.",
    action: 'Open builder',
  },
}

const statusTone = (s: Emp['status']) =>
  s === 'active' ? 'success' : s === 'paused' ? 'warning' : s === 'retired' ? 'danger' : 'neutral'

// ── Org-game bits (compact reuse of the /admin/org patterns) ────────────────
function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 5, borderRadius: 3, background: 'var(--admin-surface-alt)', overflow: 'hidden', width: 46 }}>
      <div style={{ width: `${value}%`, height: '100%', background: color }} />
    </div>
  )
}
function MeterStrip({ m }: { m: Meters }) {
  const cell = (emoji: string, label: string, value: number, color: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }} title={`${label}: ${value}`}>
      <span style={{ fontSize: '.95rem', lineHeight: 1 }}>{emoji}</span>
      <MiniBar value={value} color={color} />
    </div>
  )
  return (
    <div style={{ display: 'flex', gap: '.7rem', flexShrink: 0 }}>
      {cell(m.morale.emoji, 'Morale', m.morale.value, 'var(--admin-success)')}
      {cell(m.workload.emoji, 'Workload', m.workload.value, m.workload.value >= 85 ? 'var(--admin-danger)' : m.workload.value >= 60 ? 'var(--admin-warning)' : 'var(--admin-success)')}
      {cell('⚡', 'Momentum', m.momentum.value, 'var(--admin-info)')}
      {cell('⭐', 'Performance', m.performance.value, 'var(--admin-accent)')}
    </div>
  )
}
function Node({ e }: { e: Emp }) {
  const planned = e.status === 'planned'
  return (
    <div
      className="admin-card"
      style={{
        width: 158, padding: 'var(--admin-space-4)', textAlign: 'center', opacity: planned ? 0.6 : 1,
        border: `1px solid ${e.status === 'active' || e.kind === 'owner' ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
      }}
    >
      <div style={{ fontSize: '1.6rem', lineHeight: 1 }}>{e.emoji || '👤'}</div>
      <div style={{ fontWeight: 700, marginTop: 'var(--admin-space-2)', color: 'var(--admin-text)', fontSize: 'var(--admin-text-sm)' }}>{e.name}</div>
      <div style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-muted)', marginTop: 2 }}>{e.role_title || ''}</div>
    </div>
  )
}
const Connector = () => <div style={{ width: 2, height: 22, background: 'var(--admin-border-strong)' }} />

// Small section heading used across the mockup.
function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--admin-space-4)' }}>
      <h2 style={{ margin: 0, fontSize: 'var(--admin-text-lg)', color: 'var(--admin-text)', lineHeight: 'var(--admin-leading-tight)' }}>{children}</h2>
      {sub && <p style={{ margin: 'var(--admin-space-1) 0 0', fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-subtle)' }}>{sub}</p>}
    </div>
  )
}

export default async function DashboardPreviewPage() {
  const db = createAdminClient()
  const [{ data: empData }, { data: logData }, { data: loreData }] = await Promise.all([
    db.from('employees').select('id, slug, name, role_title, kind, emoji, status, reports_to_id, mission, responsibilities'),
    db.from('employee_logs').select('employee_id, type, created_at'),
    db.from('org_lore').select('id, lore_date, headline, body, involves').order('lore_date', { ascending: false }).order('created_at', { ascending: false }).limit(3),
  ])
  const emps = (empData ?? []) as Emp[]
  const lore = (loreData ?? []) as Lore[]
  const logsBy: Record<string, { type: string; created_at: string }[]> = {}
  for (const l of (logData ?? []) as { employee_id: string; type: string; created_at: string }[]) (logsBy[l.employee_id] ||= []).push(l)
  const emojiBySlug = Object.fromEntries(emps.map((e) => [e.slug, e.emoji || '👤']))

  const owner = emps.find((e) => e.kind === 'owner')
  const chief = emps.find((e) => e.kind === 'chief')
  const rank = { active: 0, paused: 1, planned: 2, retired: 3 }
  const heads = emps.filter((e) => e.kind === 'agent').sort((a, b) => rank[a.status] - rank[b.status])

  // Build the Today queue: real registry pages, priority order, sample copy.
  const byId = new Map<string, AdminPage>(getPagesByPriority().map((p) => [p.id, p]))
  const queue = Object.keys(QUEUE_SAMPLE)
    .map((id) => ({ page: byId.get(id), sample: QUEUE_SAMPLE[id] }))
    .filter((q): q is { page: AdminPage; sample: QueueSample } => Boolean(q.page))
    .sort((a, b) => b.page.dashboardPriority - a.page.dashboardPriority)
  const urgentCount = queue.filter((q) => q.sample.urgent).length

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* ── Unmistakable mockup banner ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--admin-space-3)', flexWrap: 'wrap',
          padding: 'var(--admin-space-3) var(--admin-space-4)', marginBottom: 'var(--admin-space-6)',
          borderRadius: 'var(--admin-radius)', background: 'var(--admin-warning-soft)',
          border: '1px solid var(--admin-warning)', color: 'var(--admin-warning)',
        }}
      >
        <span style={{ fontSize: 'var(--admin-text-base)' }}>🔍</span>
        <span style={{ fontSize: 'var(--admin-text-sm)', fontWeight: 600 }}>
          MOCKUP — a design preview of the redesigned dashboard, not the live one.
        </span>
        <span style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-muted)' }}>
          Queue numbers are illustrative; the org game below is live. The real dashboard stays put until you approve this.
        </span>
        <Link href="/admin" style={{ marginLeft: 'auto', fontSize: 'var(--admin-text-sm)', color: 'var(--admin-accent)', fontWeight: 600 }}>
          ← Back to the real dashboard
        </Link>
      </div>

      {/* ── Quiet hero ── */}
      <div
        style={{
          padding: 'var(--admin-space-6)', marginBottom: 'var(--admin-space-6)',
          borderRadius: 'var(--admin-radius-lg)',
          background: 'linear-gradient(135deg, var(--admin-accent-soft), var(--admin-surface) 70%)',
          border: '1px solid var(--admin-border)',
        }}
      >
        <div style={{ fontSize: 'var(--admin-text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--admin-text-subtle)', fontWeight: 700 }}>
          {today}
        </div>
        <h1 style={{ margin: 'var(--admin-space-2) 0 0', fontSize: 'var(--admin-text-2xl)', color: 'var(--admin-text)', lineHeight: 'var(--admin-leading-tight)' }}>
          Good morning, Jill
        </h1>
        <p style={{ margin: 'var(--admin-space-3) 0 0', fontSize: 'var(--admin-text-base)', color: 'var(--admin-text-secondary)', lineHeight: 'var(--admin-leading-normal)' }}>
          <strong style={{ color: 'var(--admin-text)' }}>{urgentCount} things need you today.</strong> The team handled the rest overnight — everything else is calm.
        </p>
      </div>

      {/* ── The single "Today" queue ── */}
      <div style={{ marginBottom: 'var(--admin-space-6)' }}>
        <SectionTitle sub="One list, most important first. Clear these and you're done for the day.">Today</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--admin-space-3)' }}>
          {queue.map(({ page, sample }, i) => (
            <Link key={page.id} href={page.path} style={{ textDecoration: 'none' }}>
              <div
                className="admin-card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--admin-space-4)',
                  padding: 'var(--admin-space-4) var(--admin-space-5)',
                  borderLeft: sample.urgent ? '3px solid var(--admin-accent)' : '3px solid transparent',
                }}
              >
                {/* rank + icon */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 30, flexShrink: 0 }}>
                  <span style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-subtle)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1.4 }}>{page.icon}</span>
                </div>
                {/* body */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--admin-space-2)', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 'var(--admin-text-base)', color: 'var(--admin-text)' }}>{page.title}</strong>
                    <span
                      style={{
                        fontSize: 'var(--admin-text-xs)', fontWeight: 700, color: 'var(--admin-accent)',
                        background: 'var(--admin-accent-soft)', padding: '1px 8px', borderRadius: 9999,
                      }}
                    >
                      {sample.count}
                    </span>
                  </div>
                  <p style={{ margin: 'var(--admin-space-1) 0 0', fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-muted)', lineHeight: 'var(--admin-leading-normal)' }}>
                    {sample.blurb}
                  </p>
                </div>
                {/* action */}
                <span
                  className="admin-btn admin-btn-sm"
                  style={{ flexShrink: 0, background: 'var(--admin-surface-alt)', color: 'var(--admin-accent)', fontWeight: 600 }}
                >
                  {sample.action} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── The org game ── */}
      <div style={{ marginBottom: 'var(--admin-space-6)' }}>
        <SectionTitle sub="Your AI team, front and center. Click through to the full org on the real page.">
          🎮 The team
        </SectionTitle>

        {/* org chart */}
        <div className="admin-card" style={{ padding: 'var(--admin-space-6) var(--admin-space-4)', marginBottom: 'var(--admin-space-4)', overflowX: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'min-content' }}>
            {owner && <Node e={owner} />}
            {owner && chief && <Connector />}
            {chief && <Node e={chief} />}
            {chief && heads.length > 0 && <Connector />}
            {heads.length > 0 && (
              <>
                <div style={{ height: 2, background: 'var(--admin-border-strong)', width: 'min(100%, 640px)', marginTop: 'var(--admin-space-3)' }} />
                <div style={{ display: 'flex', gap: 'var(--admin-space-3)', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'var(--admin-space-4)' }}>
                  {heads.map((h) => <Node key={h.id} e={h} />)}
                </div>
              </>
            )}
          </div>
        </div>

        {/* roster with Sims meters */}
        <div style={{ display: 'grid', gap: 'var(--admin-space-2)' }}>
          {emps
            .filter((e) => e.kind === 'agent')
            .sort((a, b) => rank[a.status] - rank[b.status])
            .map((e) => (
              <div key={e.id} className="admin-card" style={{ padding: 'var(--admin-space-3) var(--admin-space-4)', display: 'flex', alignItems: 'center', gap: 'var(--admin-space-4)', opacity: e.status === 'planned' ? 0.7 : 1 }}>
                <div style={{ fontSize: '1.3rem' }}>{e.emoji || '👤'}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 'var(--admin-text-sm)' }}>
                    {e.name} <span style={{ fontWeight: 400, color: 'var(--admin-text-muted)' }}>· {e.role_title || ''}</span>
                  </div>
                </div>
                <MeterStrip m={computeMeters(e, logsBy[e.id] || [])} />
                <Badge tone={statusTone(e.status)}>{e.status}</Badge>
              </div>
            ))}
        </div>
      </div>

      {/* ── Breakroom teaser ── */}
      <div>
        <SectionTitle sub="Office lore. Internal only, never leaves the building.">☕ The Breakroom</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--admin-space-2)' }}>
          {lore.length === 0 ? (
            <div className="admin-card" style={{ padding: 'var(--admin-space-4)', color: 'var(--admin-text-muted)', fontSize: 'var(--admin-text-sm)' }}>
              No lore yet — the office has been suspiciously well-behaved.
            </div>
          ) : (
            lore.map((l) => (
              <div key={l.id} className="admin-card" style={{ padding: 'var(--admin-space-3) var(--admin-space-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--admin-space-2)', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-subtle)', fontVariantNumeric: 'tabular-nums' }}>{l.lore_date}</span>
                  <strong style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text)' }}>{l.headline}</strong>
                  <span style={{ fontSize: 'var(--admin-text-sm)' }}>{(l.involves || []).map((s) => emojiBySlug[s]).filter(Boolean).join(' ')}</span>
                </div>
                {l.body && <p style={{ margin: 'var(--admin-space-1) 0 0', fontSize: 'var(--admin-text-sm)', lineHeight: 'var(--admin-leading-normal)', color: 'var(--admin-text-secondary)' }}>{l.body}</p>}
              </div>
            ))
          )}
        </div>
        <div style={{ marginTop: 'var(--admin-space-3)' }}>
          <Link href="/admin/org" style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-accent)', fontWeight: 600 }}>
            See the full team + Breakroom →
          </Link>
        </div>
      </div>
    </div>
  )
}
