import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'

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
  last_regenerated_at: string | null
}

const statusTone = (s: Emp['status']) =>
  s === 'active' ? 'success' : s === 'paused' ? 'warning' : s === 'retired' ? 'danger' : 'neutral'

function Node({ e }: { e: Emp }) {
  const planned = e.status === 'planned'
  return (
    <Link href={`/admin/org/${e.slug}`} style={{ textDecoration: 'none' }}>
      <div
        className="admin-card"
        style={{
          width: 190,
          padding: '1rem',
          textAlign: 'center',
          opacity: planned ? 0.65 : 1,
          border: `1px solid ${e.status === 'active' || e.kind === 'owner' ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
          transition: 'box-shadow .15s',
        }}
      >
        <div style={{ fontSize: '1.75rem', lineHeight: 1 }}>{e.emoji || '👤'}</div>
        <div style={{ fontWeight: 700, marginTop: '.4rem', color: 'var(--admin-text)' }}>{e.name}</div>
        <div style={{ fontSize: '.78rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>{e.role_title || ''}</div>
        <div style={{ marginTop: '.5rem' }}>
          <Badge tone={statusTone(e.status)}>{e.status}</Badge>
        </div>
      </div>
    </Link>
  )
}

function Connector() {
  return <div style={{ width: 2, height: 26, background: 'var(--admin-border-strong)' }} />
}

export default async function OrgPage() {
  const db = createAdminClient()
  const { data } = await db
    .from('employees')
    .select('id, slug, name, role_title, kind, emoji, status, reports_to_id, mission, last_regenerated_at')
  const emps = (data ?? []) as Emp[]

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

      {/* Visual org chart — owner at the top */}
      <div
        className="admin-card"
        style={{ padding: '2rem 1rem', marginBottom: '2rem', overflowX: 'auto' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'min-content' }}>
          {owner && <Node e={owner} />}
          {owner && chief && <Connector />}
          {chief && <Node e={chief} />}
          {chief && heads.length > 0 && <Connector />}
          {heads.length > 0 && (
            <>
              {/* horizontal spine */}
              <div style={{ height: 2, background: 'var(--admin-border-strong)', width: 'min(100%, 620px)' }} />
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '.9rem' }}>
                {heads.map((h) => (
                  <Node key={h.id} e={h} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Roster — each employee gets their own summary row that opens their section */}
      <h2 style={{ fontSize: '1rem', marginBottom: '.75rem', color: 'var(--admin-text)' }}>Roster</h2>
      <div style={{ display: 'grid', gap: '.75rem' }}>
        {emps
          .sort((a, b) => ({ owner: 0, chief: 1, agent: 2 }[a.kind] - { owner: 0, chief: 1, agent: 2 }[b.kind]))
          .map((e) => (
            <Link key={e.id} href={`/admin/org/${e.slug}`} style={{ textDecoration: 'none' }}>
              <div
                className="admin-card"
                style={{ padding: '.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', opacity: e.status === 'planned' ? 0.7 : 1 }}
              >
                <div style={{ fontSize: '1.4rem' }}>{e.emoji || '👤'}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>
                    {e.name} <span style={{ fontWeight: 400, color: 'var(--admin-text-muted)' }}>· {e.role_title || ''}</span>
                  </div>
                  {e.mission && (
                    <div style={{ fontSize: '.82rem', color: 'var(--admin-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.mission}
                    </div>
                  )}
                </div>
                <Badge tone={statusTone(e.status)}>{e.status}</Badge>
              </div>
            </Link>
          ))}
      </div>
    </div>
  )
}
