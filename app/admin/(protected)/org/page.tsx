import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'
import { computeMeters, type Meters } from '@/lib/orgMeters'

export const dynamic = 'force-dynamic'

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
  last_regenerated_at: string | null
}
type Lore = { id: string; lore_date: string; headline: string; body: string | null; involves: string[] | null }

const statusTone = (s: Emp['status']) =>
  s === 'active' ? 'success' : s === 'paused' ? 'warning' : s === 'retired' ? 'danger' : 'neutral'

// ── Department colour families ──────────────────────────────────────────────
// Each head owns a soft, low-saturation hue from the Royal Glow world; ALL of
// that head's specialists wear it, so a column reads as one family at a glance
// (Jill's ask: John's people green, Kesha's another colour, etc.). Hues are
// mixed into the theme surface/border tokens so the tints stay subtle and adapt
// to light/dark rather than hardcoding backgrounds.
type HeadTint = { soft: string; headBg: string; border: string; avatarBg: string; ink: string }
const mkTint = (hue: string): HeadTint => ({
  soft: `color-mix(in srgb, ${hue} 12%, var(--admin-surface))`,
  headBg: `color-mix(in srgb, ${hue} 7%, var(--admin-surface))`,
  border: `color-mix(in srgb, ${hue} 42%, var(--admin-border))`,
  avatarBg: `color-mix(in srgb, ${hue} 20%, var(--admin-surface))`,
  ink: hue,
})
const HEAD_HUE: Record<string, string> = {
  'john-content': '#3E9B57',    // green (Jill's example)
  'kesha-social': '#C6457A',    // rose
  'janet-growth': '#C58A22',    // amber
  'priya-sources': '#2E9C9C',   // teal
  'bill-security': '#3F63C4',   // blue
  'devon-design': '#7A3FB0',    // violet (on-brand)
  'erica-finance': '#5B6B8C',   // slate
}
// Distinct spares for any future head not in the map above (stable by index).
const FALLBACK_HUES = ['#4F8A8B', '#B5652A', '#6D6BC4', '#4E8C5A', '#B04A86', '#2F7DA6']
const tintForHead = (slug: string, idx: number): HeadTint =>
  mkTint(HEAD_HUE[slug] ?? FALLBACK_HUES[idx % FALLBACK_HUES.length])

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

function Node({ e, tint }: { e: Emp; tint?: HeadTint }) {
  const planned = e.status === 'planned'
  const gold = e.status === 'active' || e.kind === 'owner'
  return (
    <Link href={`/admin/org/${e.slug}`} style={{ textDecoration: 'none' }}>
      <div
        className="admin-card"
        style={{
          width: 190, padding: '1rem', textAlign: 'center', opacity: planned ? 0.65 : 1,
          background: tint ? tint.headBg : undefined,
          border: `1px solid ${gold ? 'var(--admin-accent)' : tint ? tint.border : 'var(--admin-border)'}`,
        }}
      >
        <div style={{ fontSize: '1.75rem', lineHeight: 1 }}>{e.emoji || '👤'}</div>
        <div style={{ fontWeight: 700, marginTop: '.4rem', color: 'var(--admin-text)' }}>{e.name}</div>
        <div style={{ fontSize: '.78rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>{e.role_title || ''}</div>
        <div style={{ marginTop: '.5rem' }}><Badge tone={statusTone(e.status)}>{e.status}</Badge></div>
      </div>
    </Link>
  )
}

const Connector = () => <div style={{ width: 2, height: 26, background: 'var(--admin-border-strong)' }} />

// A specialist (3rd tier): compact person-badge, visually subordinate to a head.
// Wears the head's colour family (tint) so it reads as part of that column.
function SubNode({ e, tint }: { e: Emp; tint?: HeadTint }) {
  const planned = e.status === 'planned'
  return (
    <Link href={`/admin/org/${e.slug}`} style={{ textDecoration: 'none' }}>
      <div
        className="admin-card"
        style={{
          display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.4rem .5rem',
          background: tint ? tint.soft : undefined,
          border: `1px solid ${tint ? tint.border : 'var(--admin-border)'}`, opacity: planned ? 0.65 : 1,
        }}
      >
        <span
          style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', lineHeight: 1,
            background: tint ? tint.avatarBg : 'var(--admin-surface-alt)',
            border: `1px solid ${tint ? tint.border : 'var(--admin-border)'}`,
            color: tint ? tint.ink : 'var(--admin-text-muted)', fontWeight: 700,
          }}
        >
          {e.emoji || e.name.charAt(0).toUpperCase()}
        </span>
        <span style={{ minWidth: 0, textAlign: 'left' }}>
          <span style={{ display: 'block', fontSize: '.76rem', fontWeight: 700, color: 'var(--admin-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
          <span style={{ display: 'block', fontSize: '.66rem', color: 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.role_title || ''}</span>
        </span>
      </div>
    </Link>
  )
}

// A head plus its specialist sub-tier, as one vertical column (wraps as a unit).
// Heads WITH specialists get a colour family; heads without are left untinted.
function HeadColumn({ head, specialists, idx }: { head: Emp; specialists: Emp[]; idx: number }) {
  const tint = specialists.length > 0 ? tintForHead(head.slug, idx) : undefined
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 190 }}>
      <Node e={head} tint={tint} />
      {specialists.length > 0 && (
        <>
          <div style={{ width: 2, height: 16, background: tint ? tint.border : 'var(--admin-border-strong)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem', width: '100%' }}>
            {specialists.map((s) => <SubNode key={s.id} e={s} tint={tint} />)}
          </div>
        </>
      )}
    </div>
  )
}

export default async function OrgPage() {
  const db = createAdminClient()
  const [{ data: empData }, { data: logData }, { data: loreData }] = await Promise.all([
    db.from('employees').select('id, slug, name, role_title, kind, emoji, status, reports_to_id, mission, responsibilities, last_regenerated_at'),
    db.from('employee_logs').select('employee_id, type, created_at'),
    db.from('org_lore').select('id, lore_date, headline, body, involves').order('lore_date', { ascending: false }).order('created_at', { ascending: false }).limit(12),
  ])
  const emps = (empData ?? []) as Emp[]
  const lore = (loreData ?? []) as Lore[]
  const logsBy: Record<string, { type: string; created_at: string }[]> = {}
  for (const l of (logData ?? []) as { employee_id: string; type: string; created_at: string }[]) (logsBy[l.employee_id] ||= []).push(l)
  const emojiBySlug = Object.fromEntries(emps.map((e) => [e.slug, e.emoji || '👤']))

  const owner = emps.find((e) => e.kind === 'owner')
  const chief = emps.find((e) => e.kind === 'chief')
  const rank = { active: 0, paused: 1, planned: 2, retired: 3 }
  // Heads report to the chief; specialists (the 3rd tier) report to a head.
  const heads = emps
    .filter((e) => e.kind === 'agent' && e.reports_to_id === chief?.id)
    .sort((a, b) => rank[a.status] - rank[b.status])
  const specialistsByHead: Record<string, Emp[]> = {}
  for (const e of emps.filter((e) => e.kind === 'agent' && e.reports_to_id && e.reports_to_id !== chief?.id)) {
    ;(specialistsByHead[e.reports_to_id as string] ||= []).push(e)
  }
  for (const id in specialistsByHead) specialistsByHead[id].sort((a, b) => a.name.localeCompare(b.name))
  const specialistIds = new Set(Object.values(specialistsByHead).flat().map((e) => e.id))
  const activeCount = heads.filter((e) => e.status === 'active').length

  return (
    <div>
      <PageHeader
        title="Team"
        description={`Your crazy4points org — ${activeCount} department head${activeCount === 1 ? '' : 's'} hired, ${heads.length - activeCount} planned. Click anyone to open their section.`}
      />

      {/* Visual org chart */}
      <div className="admin-card" style={{ padding: '2rem 1rem', marginBottom: '2rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'min-content' }}>
          {owner && <Node e={owner} />}
          {owner && chief && <Connector />}
          {chief && <Node e={chief} />}
          {chief && heads.length > 0 && <Connector />}
          {heads.length > 0 && (
            <>
              <div style={{ height: 2, background: 'var(--admin-border-strong)', width: 'min(100%, 620px)' }} />
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', marginTop: '.9rem' }}>
                {heads.map((h, i) => <HeadColumn key={h.id} head={h} specialists={specialistsByHead[h.id] || []} idx={i} />)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Roster with Sims-style meters */}
      <h2 style={{ fontSize: '1rem', marginBottom: '.75rem', color: 'var(--admin-text)' }}>Roster</h2>
      <div style={{ display: 'grid', gap: '.75rem', marginBottom: '2rem' }}>
        {emps
          .filter((e) => !specialistIds.has(e.id))
          .sort((a, b) => ({ owner: 0, chief: 1, agent: 2 }[a.kind] - { owner: 0, chief: 1, agent: 2 }[b.kind]))
          .map((e) => (
            <Link key={e.id} href={`/admin/org/${e.slug}`} style={{ textDecoration: 'none' }}>
              <div className="admin-card" style={{ padding: '.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', opacity: e.status === 'planned' ? 0.75 : 1 }}>
                <div style={{ fontSize: '1.4rem' }}>{e.emoji || '👤'}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>
                    {e.name} <span style={{ fontWeight: 400, color: 'var(--admin-text-muted)' }}>· {e.role_title || ''}</span>
                  </div>
                  {e.mission && (
                    <div style={{ fontSize: '.82rem', color: 'var(--admin-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.mission}</div>
                  )}
                </div>
                {e.kind === 'agent' && <MeterStrip m={computeMeters(e, logsBy[e.id] || [])} />}
                <Badge tone={statusTone(e.status)}>{e.status}</Badge>
              </div>
            </Link>
          ))}
      </div>

      {/* The Breakroom — office lore feed (full hub lives at /admin/breakroom) */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: '.25rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1rem', margin: 0, color: 'var(--admin-text)' }}>☕ The Breakroom</h2>
        <Link href="/admin/breakroom" style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}>
          Open the Breakroom →
        </Link>
      </div>
      <p style={{ fontSize: '.8rem', color: 'var(--admin-text-subtle)', marginTop: 0, marginBottom: '.75rem' }}>
        Office lore. Internal only, never leaves the building.
      </p>
      <div style={{ display: 'grid', gap: '.6rem' }}>
        {lore.length === 0 ? (
          <div className="admin-card" style={{ padding: '1rem', color: 'var(--admin-text-muted)' }}>No lore yet.</div>
        ) : (
          lore.map((l) => (
            <div key={l.id} className="admin-card" style={{ padding: '.85rem 1.1rem' }}>
              <div style={{ display: 'flex', gap: '.6rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '.72rem', color: 'var(--admin-text-subtle)', fontVariantNumeric: 'tabular-nums' }}>{l.lore_date}</span>
                <strong style={{ fontSize: '.9rem', color: 'var(--admin-text)' }}>{l.headline}</strong>
                <span style={{ fontSize: '.9rem' }}>{(l.involves || []).map((s) => emojiBySlug[s]).filter(Boolean).join(' ')}</span>
              </div>
              {l.body && <p style={{ margin: '.35rem 0 0', fontSize: '.85rem', lineHeight: 1.5, color: 'var(--admin-text-secondary)' }}>{l.body}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
