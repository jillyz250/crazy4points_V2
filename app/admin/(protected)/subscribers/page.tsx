import { createAdminClient } from '@/utils/supabase/server'
import { listSubscribers } from '@/utils/supabase/queries'
import { toggleSubscriberActiveAction } from './actions'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

export const dynamic = 'force-dynamic'

export default async function SubscribersPage() {
  const supabase = createAdminClient()
  const subscribers = await listSubscribers(supabase)

  const activeCount = subscribers.filter(s => s.active).length
  const inactiveCount = subscribers.length - activeCount

  return (
    <div>
      <PageHeader
        title="Subscribers"
        description="Newsletter subscribers. Review counts, deactivate individual addresses."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Badge tone="success">{activeCount} active</Badge>
            <Badge tone="neutral">{inactiveCount} inactive</Badge>
          </div>
        }
      />

      {subscribers.length === 0 ? (
        <EmptyState title="No subscribers yet" description="Nothing to manage until people sign up." />
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--admin-text)' }}>{s.email}</td>
                    <td style={{ color: 'var(--admin-text-muted)' }}>
                      {[s.first_name, s.last_name].filter(Boolean).join(' ') || (
                        <span style={{ color: 'var(--admin-text-subtle)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <Badge tone={s.active ? 'success' : 'neutral'}>
                        {s.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <form action={toggleSubscriberActiveAction.bind(null, s.id, !s.active)}>
                          <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm">
                            {s.active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
