import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { listSubscribers } from '@/utils/supabase/queries'
import type { Subscriber } from '@/utils/supabase/queries'
import { toggleSubscriberActiveAction } from './actions'
import AddSubscriberForm from './AddSubscriberForm'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

export const dynamic = 'force-dynamic'

type SortKey = 'date' | 'name' | 'email'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date',  label: 'Latest first' },
  { key: 'name',  label: 'Name (A→Z)' },
  { key: 'email', label: 'Email (A→Z)' },
]

function compareSubs(sort: SortKey) {
  return (a: Subscriber, b: Subscriber) => {
    if (sort === 'date') {
      const av = a.subscribed_at ? new Date(a.subscribed_at).getTime() : 0
      const bv = b.subscribed_at ? new Date(b.subscribed_at).getTime() : 0
      return bv - av // newest first
    }
    if (sort === 'name') {
      const an = `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim().toLowerCase() || '~'
      const bn = `${b.first_name ?? ''} ${b.last_name ?? ''}`.trim().toLowerCase() || '~'
      return an.localeCompare(bn)
    }
    return a.email.toLowerCase().localeCompare(b.email.toLowerCase())
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const sp = await searchParams
  const sort = (sp.sort && ['date', 'name', 'email'].includes(sp.sort) ? sp.sort : 'date') as SortKey

  const supabase = createAdminClient()
  const rawSubscribers = await listSubscribers(supabase)
  // Default sort 'date' already comes back newest-first from listSubscribers,
  // but we run the comparator to honor explicit sort params too.
  const subscribers = [...rawSubscribers].sort(compareSubs(sort))

  const activeCount = subscribers.filter((s) => s.active).length
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

      <AddSubscriberForm />

      {subscribers.length === 0 ? (
        <EmptyState title="No subscribers yet" description="Use the form above to add one manually, or wait for someone to sign up." />
      ) : (
        <>
          {/* Sort chip row — same style as the Drafts hub */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--admin-text-muted)',
                  marginRight: '0.5rem',
                  minWidth: '4.5rem',
                }}
              >
                Sort
              </span>
              {SORT_OPTIONS.map((o) => {
                const active = sort === o.key
                const href = o.key === 'date' ? '/admin/subscribers' : `/admin/subscribers?sort=${o.key}`
                return (
                  <Link
                    key={o.key}
                    href={href}
                    scroll={false}
                    className={`chip chip--neutral${active ? ' chip--active' : ''}`}
                  >
                    {o.label}
                  </Link>
                )
              })}
            </div>
          </Card>

          <Card>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Subscribed</th>
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
                      <td style={{ color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(s.subscribed_at)}
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
        </>
      )}
    </div>
  )
}
