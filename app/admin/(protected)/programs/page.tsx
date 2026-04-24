import { createAdminClient } from '@/utils/supabase/server'
import { getAllPrograms } from '@/utils/supabase/queries'
import type { ProgramType, Program } from '@/utils/supabase/queries'
import { toggleProgramAction } from './actions'
import AddProgramForm from './AddProgramForm'
import FaqContentEditor from './FaqContentEditor'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

const TYPE_LABEL: Record<ProgramType, string> = {
  credit_card:     'Credit Card',
  airline:         'Airline',
  hotel:           'Hotel',
  car_rental:      'Car Rental',
  cruise:          'Cruise',
  shopping_portal: 'Shopping Portal',
  travel_portal:   'Travel Portal',
  lounge_network:  'Lounge Network',
  ota:             'OTA',
}

const TYPE_ORDER: ProgramType[] = [
  'credit_card',
  'airline',
  'hotel',
  'car_rental',
  'cruise',
  'shopping_portal',
  'travel_portal',
  'lounge_network',
  'ota',
]

function groupByType(programs: Program[]): Map<ProgramType, Program[]> {
  const map = new Map<ProgramType, Program[]>()
  for (const p of programs) {
    const key = p.type as ProgramType
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return map
}

export default async function AdminProgramsPage() {
  const supabase = createAdminClient()
  const programs = await getAllPrograms(supabase)
  const grouped = groupByType(programs)

  const presentTypes = TYPE_ORDER.filter((t) => grouped.has(t))
  for (const t of grouped.keys()) {
    if (!presentTypes.includes(t)) presentTypes.push(t)
  }

  return (
    <div>
      <PageHeader
        title="Programs"
        description="Loyalty programs (airlines, hotels, cards, portals) that alerts can be tagged against."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Badge tone="neutral">{programs.length} total</Badge>
            <AddProgramForm />
          </div>
        }
      />

      {programs.length === 0 ? (
        <EmptyState title="No programs yet" description="Add one to begin tagging alerts." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {presentTypes.map((type) => {
            const group = grouped.get(type)!
            return (
              <div key={type}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '0.9375rem' }}>
                    {TYPE_LABEL[type] ?? type.replace(/_/g, ' ')}
                  </h2>
                  <Badge tone="neutral">{group.length}</Badge>
                </div>
                <Card>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Tier</th>
                          <th>Monitor</th>
                          <th>URL</th>
                          <th>FAQ</th>
                          <th>Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.map((program) => (
                          <tr key={program.id}>
                            <td style={{ fontWeight: 500 }}>{program.name}</td>
                            <td style={{ color: 'var(--admin-text-muted)' }}>{program.tier ?? '—'}</td>
                            <td style={{ color: 'var(--admin-text-muted)' }}>{program.monitor_tier ?? '—'}</td>
                            <td>
                              {program.program_url ? (
                                <a href={program.program_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8125rem' }}>
                                  Link ↗
                                </a>
                              ) : (
                                <span style={{ color: 'var(--admin-text-subtle)' }}>—</span>
                              )}
                            </td>
                            <td>
                              <FaqContentEditor
                                programId={program.id}
                                programName={program.name}
                                initialContent={program.faq_content}
                                initialUpdatedAt={program.faq_updated_at}
                              />
                            </td>
                            <td>
                              <form action={toggleProgramAction.bind(null, program.id, !program.is_active)}>
                                <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm">
                                  <Badge tone={program.is_active ? 'success' : 'neutral'}>
                                    {program.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </button>
                              </form>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
