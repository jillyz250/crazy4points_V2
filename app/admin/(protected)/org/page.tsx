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
    <Link href={`/admin/org/${e.slug}`} style={{ textDecoration: 'none' }}>
      <div
        className="admin-card"
        style={{
          width: 190, padding: '1rem', textAlign: 'center', opacity: planned ? 0.65 : 1,
          border: `1px solid ${e.status === 'active' || e.kind === 'owner' ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
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
  const heads = emps.filter((e) => e.kind === 'agent').sort((a, b) => rank[a.status] - rank[b.status])
  const activeCount = emps.filter((e) => e.status === 'active' && e.kind === 'agent').length

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
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '.9rem' }}>
                {heads.map((h) => <Node key={h.id} e={h} />)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Roster with Sims-style meters */}
      <h2 style={{ fontSize: '1rem', marginBottom: '.75rem', color: 'var(--admin-text)' }}>Roster</h2>
      <div style={{ display: 'grid', gap: '.75rem', marginBottom: '2rem' }}>
        {emps
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

      {/* The Breakroom — office lore feed */}
      <h2 style={{ fontSize: '1rem', marginBottom: '.25rem', color: 'var(--admin-text)' }}>☕ The Breakroom</h2>
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
