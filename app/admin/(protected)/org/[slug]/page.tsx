import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card, CardHeader, CardBody } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'

export const dynamic = 'force-dynamic'

type Platform = { platform: string; status: string; notes?: string }
type Emp = {
  id: string
  slug: string
  name: string
  role_title: string | null
  kind: 'owner' | 'chief' | 'agent'
  emoji: string | null
  status: string
  persona: string | null
  mission: string | null
  rules: string[] | null
  responsibilities: string[] | null
  skills: string[] | null
  allowed_scopes: string[] | null
  platforms: Platform[] | null
  reports_to_id: string | null
  last_regenerated_at: string | null
}
type Log = { id: string; type: string; note: string; actor: string | null; created_at: string }

const arr = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : [])
const statusTone = (s: string) =>
  s === 'active' ? 'success' : s === 'paused' ? 'warning' : s === 'retired' ? 'danger' : 'neutral'
const platTone = (s: string) => (s === 'active' ? 'success' : s === 'setup' ? 'info' : 'neutral')
const logTone = (t: string) => (t === 'improvement' ? 'success' : t === 'shortcoming' ? 'warning' : 'info')

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={{ marginBottom: '1rem' }}>
      <CardHeader>
        <strong style={{ fontSize: '.95rem' }}>{title}</strong>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  )
}

function Bullets({ items }: { items: string[] }) {
  if (!items.length) return <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>Not yet specified.</p>
  return (
    <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
      {items.map((x, i) => (
        <li key={i} style={{ fontSize: '.88rem', lineHeight: 1.45 }}>{x}</li>
      ))}
    </ul>
  )
}

export default async function EmployeePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = createAdminClient()
  const { data } = await db.from('employees').select('*').eq('slug', slug).maybeSingle()
  const e = data as Emp | null
  if (!e) notFound()

  const [{ data: logsData }, { data: mgr }] = await Promise.all([
    db.from('employee_logs').select('id, type, note, actor, created_at').eq('employee_id', e.id).order('created_at', { ascending: false }).limit(30),
    e.reports_to_id
      ? db.from('employees').select('name, slug, role_title').eq('id', e.reports_to_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  const logs = (logsData ?? []) as Log[]
  const manager = mgr as { name: string; slug: string; role_title: string | null } | null
  const platforms = arr<Platform>(e.platforms)

  return (
    <div>
      <PageHeader
        title={
          <span>
            <span style={{ marginRight: '.5rem' }}>{e.emoji || '👤'}</span>
            {e.name}
          </span>
        }
        description={e.role_title || undefined}
        actions={
          <Link href="/admin/org" className="admin-btn admin-btn-ghost admin-btn-sm">
            ← Org chart
          </Link>
        }
      />

      {/* At-a-glance header row */}
      <Card style={{ marginBottom: '1rem' }}>
        <CardBody>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
            <span>Status: <Badge tone={statusTone(e.status)}>{e.status}</Badge></span>
            <span style={{ color: 'var(--admin-text-muted)', fontSize: '.88rem' }}>
              Reports to:{' '}
              {manager ? (
                <Link href={`/admin/org/${manager.slug}`} style={{ color: 'var(--admin-accent)' }}>
                  {manager.name}
                </Link>
              ) : (
                <em>nobody (top of the org)</em>
              )}
            </span>
            {e.kind === 'agent' && (
              <span style={{ color: 'var(--admin-text-muted)', fontSize: '.88rem' }}>
                Agent file:{' '}
                {e.status === 'active'
                  ? e.last_regenerated_at
                    ? `generated ${new Date(e.last_regenerated_at).toLocaleDateString()}`
                    : 'not generated yet'
                  : 'not active (chart placeholder)'}
              </span>
            )}
          </div>
          {e.mission && <p style={{ margin: '.9rem 0 0', fontSize: '.92rem', lineHeight: 1.5 }}>{e.mission}</p>}
        </CardBody>
      </Card>

      {e.persona && <Section title="Persona">
        <p style={{ margin: 0, fontSize: '.9rem', lineHeight: 1.6 }}>{e.persona}</p>
      </Section>}

      <Section title="Rules"><Bullets items={arr(e.rules)} /></Section>
      <Section title="Responsibilities"><Bullets items={arr(e.responsibilities)} /></Section>

      <Section title="Platforms">
        {platforms.length === 0 ? (
          <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>None assigned.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {platforms.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '.6rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <Badge tone={platTone(p.status)}>{p.status}</Badge>
                <strong style={{ fontSize: '.88rem' }}>{p.platform}</strong>
                {p.notes && <span style={{ fontSize: '.82rem', color: 'var(--admin-text-muted)' }}>{p.notes}</span>}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Skills">
        {arr(e.skills).length === 0 ? (
          <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>None yet.</p>
        ) : (
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {arr(e.skills).map((s) => <Badge key={s} tone="accent">{s}</Badge>)}
          </div>
        )}
      </Section>

      <Section title="What they may touch (least privilege)"><Bullets items={arr(e.allowed_scopes)} /></Section>

      <Section title="Performance log">
        {logs.length === 0 ? (
          <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>No entries yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {logs.map((l) => (
              <div key={l.id} style={{ display: 'flex', gap: '.6rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <Badge tone={logTone(l.type)}>{l.type}</Badge>
                <span style={{ fontSize: '.88rem', flex: 1, minWidth: 200 }}>{l.note}</span>
                <span style={{ fontSize: '.75rem', color: 'var(--admin-text-subtle)' }}>
                  {l.actor ? `${l.actor} · ` : ''}{new Date(l.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
