import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { getRefreshQueue, getRefreshQueueByType } from '@/utils/supabase/queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { markVerifiedAction } from './actions'

// Always reflect the live queue (no caching) so a just-cleared item disappears.
export const dynamic = 'force-dynamic'

// Friendly labels for the entity_type values the admin_refresh_queue view emits.
function typeLabel(t: string): string {
  if (t === 'transfer_partners') return 'transfer partners'
  if (t === 'hotel_properties_program') return 'properties'
  if (t === 'credit_card_welcome_bonus') return 'welcome bonus'
  return t.replace(/^program_/, '').replace(/_/g, ' ')
}

export default async function RefreshQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const supabase = createAdminClient()
  const [items, byType] = await Promise.all([
    getRefreshQueue(supabase, type ? { entityType: type } : {}),
    getRefreshQueueByType(supabase),
  ])
  const total = Object.values(byType).reduce((s, n) => s + n, 0)

  const chipStyle = (active: boolean) => ({
    display: 'inline-block',
    padding: '0.25rem 0.625rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    textDecoration: 'none',
    border: '1px solid var(--admin-border)',
    background: active ? 'var(--admin-accent, #6B2D8F)' : 'transparent',
    color: active ? '#fff' : 'var(--admin-text-muted)',
  })

  return (
    <div>
      <PageHeader
        title="Refresh Queue"
        description="Editorial content due for re-verification — cards, programs, transfer partners, issuers, and properties. Open each to update, or mark it verified if it's still current."
      />

      {/* Type filter chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Link href="/admin/refresh-queue" style={chipStyle(!type)}>
          All {total}
        </Link>
        {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, n]) => (
          <Link key={t} href={`/admin/refresh-queue?type=${encodeURIComponent(t)}`} style={chipStyle(type === t)}>
            {typeLabel(t)} {n}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <Card style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
          Nothing due for re-verification. The queue is clear.
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--admin-text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.625rem 1rem' }}>Type</th>
                <th style={{ padding: '0.625rem 1rem' }}>Entity</th>
                <th style={{ padding: '0.625rem 1rem' }}>Age</th>
                <th style={{ padding: '0.625rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.entity_type}-${item.entity_id}`} style={{ borderTop: '1px solid var(--admin-border)' }}>
                  <td style={{ padding: '0.625rem 1rem', color: 'var(--admin-text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {typeLabel(item.entity_type)}
                  </td>
                  <td style={{ padding: '0.625rem 1rem' }}>
                    <Link href={item.edit_url} style={{ fontWeight: 500 }}>{item.entity_name}</Link>
                  </td>
                  <td style={{ padding: '0.625rem 1rem', color: 'var(--admin-text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {item.last_verified ? `${item.age_days}d (cadence ${item.cadence_days}d)` : 'never verified'}
                  </td>
                  <td style={{ padding: '0.625rem 1rem', textAlign: 'right' }}>
                    <form action={markVerifiedAction} style={{ display: 'inline' }}>
                      <input type="hidden" name="entity_type" value={item.entity_type} />
                      <input type="hidden" name="entity_id" value={item.entity_id} />
                      <button
                        type="submit"
                        style={{
                          padding: '0.25rem 0.625rem',
                          borderRadius: 'var(--radius-ui, 0.375rem)',
                          border: '1px solid var(--admin-border)',
                          background: 'transparent',
                          color: 'var(--admin-text)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Mark verified
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
