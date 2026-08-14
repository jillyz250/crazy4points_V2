import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { listTakes, addTakeAction, setTakeStatusAction, type JillsTake } from './actions'

export const metadata: Metadata = { title: "Jill's Takes" }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const inputStyle: React.CSSProperties = {
  width: '100%', fontSize: '0.95rem', padding: '0.55rem 0.7rem', borderRadius: 'var(--admin-radius)',
  border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text)',
  fontFamily: 'inherit', resize: 'vertical',
}

function TakeRow({ take, actions }: { take: JillsTake; actions: { label: string; status: 'new' | 'used' | 'archived'; title: string }[] }) {
  return (
    <li style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', padding: '0.6rem 0', borderBottom: '1px solid var(--admin-border)' }}>
      <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--admin-text)', lineHeight: 1.45 }}>
        {take.note}
        <span style={{ display: 'block', marginTop: '0.2rem', fontSize: '0.72rem', color: 'var(--admin-text-subtle)' }}>
          {formatDate(take.created_at)}
          {take.program_slug ? ` · ${take.program_slug}` : ''}
          {take.used_at ? ` · used ${formatDate(take.used_at)}` : ''}
        </span>
      </span>
      <span style={{ display: 'flex', gap: '0.3rem', flex: '0 0 auto' }}>
        {actions.map((a) => (
          <form key={a.status + a.label} action={setTakeStatusAction}>
            <input type="hidden" name="id" value={take.id} />
            <input type="hidden" name="status" value={a.status} />
            <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm" title={a.title}>{a.label}</button>
          </form>
        ))}
      </span>
    </li>
  )
}

export default async function TakesPage() {
  const [backlog, used, archived] = await Promise.all([
    listTakes('new'),
    listTakes('used'),
    listTakes('archived'),
  ])

  return (
    <div>
      <PageHeader
        title="Jill's Takes"
        description="Real-life travel experiences captured for the biweekly newsletter. Jot them as they happen; mark them used when they make an issue."
      />

      {/* Add box */}
      <Card style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <form action={addTakeAction} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <textarea name="note" rows={3} required placeholder="What happened? The rawer and more honest, the better the newsletter material." style={inputStyle} />
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input name="program_slug" placeholder="program (optional, e.g. flying-blue)" style={{ ...inputStyle, flex: 1 }} />
            <button type="submit" className="admin-btn admin-btn-primary">Add take</button>
          </div>
        </form>
      </Card>

      {/* Backlog */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', margin: '0 0 0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--admin-text)' }}>Backlog</h2>
        <Badge tone="accent">{backlog.length}</Badge>
      </div>
      <Card style={{ padding: '0.4rem 1.25rem', marginBottom: '1.5rem' }}>
        {backlog.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)', padding: '0.6rem 0' }}>Nothing in the backlog. Add a take above.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {backlog.map((t) => (
              <TakeRow key={t.id} take={t} actions={[
                { label: 'Used', status: 'used', title: 'Mark used in a newsletter' },
                { label: 'Archive', status: 'archived', title: 'Archive (not using)' },
              ]} />
            ))}
          </ul>
        )}
      </Card>

      {/* Used */}
      {used.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', margin: '0 0 0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--admin-text)' }}>Used in a newsletter</h2>
            <Badge tone="success">{used.length}</Badge>
          </div>
          <Card style={{ padding: '0.4rem 1.25rem', marginBottom: '1.5rem' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {used.map((t) => (
                <TakeRow key={t.id} take={t} actions={[{ label: 'Back to backlog', status: 'new', title: 'Return to backlog' }]} />
              ))}
            </ul>
          </Card>
        </>
      )}

      {/* Archived */}
      {archived.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', margin: '0 0 0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--admin-text-muted)' }}>Archived</h2>
            <Badge tone="neutral">{archived.length}</Badge>
          </div>
          <Card style={{ padding: '0.4rem 1.25rem', marginBottom: '1.5rem' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {archived.map((t) => (
                <TakeRow key={t.id} take={t} actions={[{ label: 'Restore', status: 'new', title: 'Restore to backlog' }]} />
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}
