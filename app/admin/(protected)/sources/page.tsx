import { createAdminClient } from '@/utils/supabase/server'
import { getSources, getLastFindingBySource } from '@/utils/supabase/queries'
import type { SourceType } from '@/utils/supabase/queries'
import { toggleSourceAction } from './actions'
import DeleteSourceButton from './DeleteSourceButton'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { LinkButton } from '@/components/admin/ui/Button'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

const TIER_TONE: Record<number, Tone> = {
  1: 'accent',
  2: 'success',
  3: 'warning',
  4: 'danger',
  5: 'neutral',
}

const TYPE_LABEL: Record<SourceType, string> = {
  official_partner: 'Official',
  blog: 'Blog',
  community: 'Community',
  social: 'Social',
  email: 'Email',
}

function freshness(iso: string | null | undefined): { tone: Tone; label: string } {
  if (!iso) return { tone: 'danger', label: 'never' }
  const ageMs = Date.now() - new Date(iso).getTime()
  const hours = ageMs / (1000 * 60 * 60)
  let label: string
  if (hours < 1) label = `${Math.max(1, Math.round(ageMs / 60000))}m`
  else if (hours < 24) label = `${Math.round(hours)}h`
  else label = `${Math.round(hours / 24)}d`
  if (hours < 24) return { tone: 'success', label }
  if (hours < 24 * 7) return { tone: 'warning', label }
  return { tone: 'danger', label }
}

function approvalRate(produced: number, approved: number): { tone: Tone; label: string } | null {
  if (produced <= 0) return null
  const rate = approved / produced
  const label = `${Math.round(rate * 100)}%`
  if (rate >= 0.5) return { tone: 'success', label }
  if (rate >= 0.2) return { tone: 'warning', label }
  return { tone: 'danger', label }
}

export default async function AdminSourcesPage() {
  const supabase = createAdminClient()
  const [sources, lastFindings] = await Promise.all([
    getSources(supabase),
    getLastFindingBySource(supabase),
  ])

  return (
    <div>
      <PageHeader
        title="Sources"
        description="Intelligence sources scraped by Claude Scout. Control tiers, frequency, and activity."
        actions={<LinkButton href="/admin/sources/new" variant="primary">+ Add Source</LinkButton>}
      />

      {sources.length === 0 ? (
        <EmptyState title="No sources yet" description="Add one to start feeding Scout." />
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'center' }}>Feeds</th>
                  <th>Active</th>
                  <th>Last Finding</th>
                  <th style={{ textAlign: 'center' }}>Produced</th>
                  <th style={{ textAlign: 'center' }}>Approved</th>
                  <th style={{ textAlign: 'center' }}>Rate</th>
                  <th>Notes</th>
                  <th style={{ width: '2rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => {
                  const fresh = freshness(lastFindings.get(source.name) ?? null)
                  const rate = approvalRate(source.items_produced, source.items_approved)
                  return (
                    <tr key={source.id}>
                      <td><Badge tone={TIER_TONE[source.tier] ?? 'neutral'}>T{source.tier}</Badge></td>
                      <td style={{ fontWeight: 500 }}>
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          {source.name}
                        </a>
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>
                        {TYPE_LABEL[source.type] ?? source.type.replace(/_/g, ' ')}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                        {source.feed_count}
                      </td>
                      <td>
                        <form action={toggleSourceAction.bind(null, source.id, !source.is_active)}>
                          <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm">
                            <Badge tone={source.is_active ? 'success' : 'neutral'}>
                              {source.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </button>
                        </form>
                      </td>
                      <td>
                        <Badge tone={fresh.tone}>{fresh.label}</Badge>
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>{source.items_produced}</td>
                      <td style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>{source.items_approved}</td>
                      <td style={{ textAlign: 'center' }}>
                        {rate ? (
                          <Badge tone={rate.tone}>{rate.label}</Badge>
                        ) : (
                          <span style={{ color: 'var(--admin-text-subtle)' }}>—</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)', maxWidth: '14rem' }}>
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {source.notes ?? '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <DeleteSourceButton id={source.id} name={source.name} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
