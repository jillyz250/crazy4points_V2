import { createAdminClient } from '@/utils/supabase/server'
import { listSubscribers } from '@/utils/supabase/queries'
import { toggleSubscriberActiveAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function SubscribersPage() {
  const supabase = createAdminClient()
  const subscribers = await listSubscribers(supabase)

  const activeCount = subscribers.filter(s => s.active).length
  const inactiveCount = subscribers.length - activeCount

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Subscribers</h1>
        <div style={{ display: 'flex', gap: '1.25rem', fontFamily: 'var(--font-ui)', fontSize: '0.875rem' }}>
          <span>
            <strong style={{ color: 'var(--color-primary)' }}>{activeCount}</strong>{' '}
            <span style={{ color: 'var(--color-text-secondary)' }}>active</span>
          </span>
          <span>
            <strong style={{ color: 'var(--color-text-secondary)' }}>{inactiveCount}</strong>{' '}
            <span style={{ color: 'var(--color-text-secondary)' }}>inactive</span>
          </span>
          <span>
            <strong>{subscribers.length}</strong>{' '}
            <span style={{ color: 'var(--color-text-secondary)' }}>total</span>
          </span>
        </div>
      </div>

      {subscribers.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', marginTop: '2rem' }}>
          No subscribers yet.
        </p>
      ) : (
        <div style={{
          marginTop: '1.5rem',
          border: '1px solid var(--color-border-soft)',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
          background: 'var(--color-background)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '0.9375rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-background-soft)', textAlign: 'left' }}>
                <Th>Email</Th>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid var(--color-border-soft)' }}>
                  <Td>{s.email}</Td>
                  <Td>{s.first_name || <span style={{ color: 'var(--color-text-secondary)' }}>—</span>}</Td>
                  <Td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-ui)',
                      fontWeight: 600,
                      background: s.active ? '#E8F5E9' : '#F5F5F5',
                      color: s.active ? '#2E7D32' : '#757575',
                    }}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </Td>
                  <Td>
                    <form action={toggleSubscriberActiveAction.bind(null, s.id, !s.active)}>
                      <button
                        type="submit"
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--color-border-soft)',
                          borderRadius: 'var(--radius-ui)',
                          padding: '0.25rem 0.625rem',
                          fontFamily: 'var(--font-ui)',
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {s.active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </form>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{
      padding: '0.625rem 0.875rem',
      fontFamily: 'var(--font-ui)',
      fontSize: '0.75rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      color: 'var(--color-text-secondary)',
    }}>
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '0.625rem 0.875rem', verticalAlign: 'middle' }}>{children}</td>
}
