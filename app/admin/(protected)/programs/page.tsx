import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { getAllPrograms } from '@/utils/supabase/queries'
import type { ProgramType, Program } from '@/utils/supabase/queries'
import AddProgramForm from './AddProgramForm'
import ProgramsTable from './ProgramsTable'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'

const TYPE_LABEL: Record<ProgramType, string> = {
  credit_card:     'Currencies',  // points currencies (Chase UR, Amex MR, etc.) — actual cards live in /admin/cards
  airline:         'Airlines',
  hotel:           'Hotels',
  loyalty_program: 'Loyalty Programs',
  alliance:        'Alliances',
  car_rental:      'Car Rentals',
  cruise:          'Cruises',
  shopping_portal: 'Shopping Portals',
  travel_portal:   'Travel Portals',
  lounge_network:  'Lounge Networks',
  ota:             'OTAs',
}

// Tab order — biggest sets first since that's where the user spends time.
const TYPE_ORDER: ProgramType[] = [
  'airline',
  'credit_card',
  'hotel',
  'loyalty_program',
  'alliance',
  'car_rental',
  'cruise',
  'shopping_portal',
  'travel_portal',
  'lounge_network',
  'ota',
]

const DEFAULT_TYPE: ProgramType = 'airline'

function groupByType(programs: Program[]): Map<ProgramType, Program[]> {
  const map = new Map<ProgramType, Program[]>()
  for (const p of programs) {
    const key = p.type as ProgramType
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return map
}

function isProgramType(s: string | undefined): s is ProgramType {
  return !!s && (TYPE_ORDER as string[]).includes(s)
}

export default async function AdminProgramsPage(props: {
  searchParams: Promise<{ type?: string }>
}) {
  const sp = await props.searchParams
  const activeType: ProgramType = isProgramType(sp.type) ? sp.type : DEFAULT_TYPE

  const supabase = createAdminClient()
  const programs = await getAllPrograms(supabase)
  const grouped = groupByType(programs)

  // Tabs render in TYPE_ORDER, but include any unexpected types found in DB at the end.
  // Hide types with zero rows so the strip stays tidy (Car Rentals 0, Cruises 0, etc.
  // clutter the UI when nothing's been authored yet).
  const tabTypes: ProgramType[] = [...TYPE_ORDER]
  for (const t of grouped.keys()) {
    if (!tabTypes.includes(t)) tabTypes.push(t)
  }
  const visibleTabs = tabTypes.filter((t) => (grouped.get(t)?.length ?? 0) > 0 || t === activeType)

  // Per-tab counts: "authored / total" where authored = is_active AND not
  // a reference stub. Surfaces the data state at a glance: e.g. Airlines
  // shows 78 / 98 (78 page-worthy, 98 in DB including stubs + inactive).
  function countsFor(type: ProgramType): { authored: number; total: number } {
    const rows = grouped.get(type) ?? []
    const authored = rows.filter((p) => p.is_active && !p.is_reference_stub).length
    return { authored, total: rows.length }
  }

  const visibleRows = grouped.get(activeType) ?? []

  return (
    <div>
      <PageHeader
        title="Programs"
        description={
          'Loyalty programs (airlines, hotels, currencies, portals) that alerts can be tagged against. ' +
          'Tab counts show "authored / total" — authored = page-worthy (active + non-stub); total includes inactive + FK-only reference stubs. ' +
          'Note: the Currencies tab holds points currencies (Chase UR, Amex MR, etc.); actual credit cards live under /admin/cards.'
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Badge tone="neutral">{programs.length} total</Badge>
            <AddProgramForm />
          </div>
        }
      />

      {/* Tab strip */}
      <div
        role="tablist"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.25rem',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--admin-border, #e5e7eb)',
          paddingBottom: '0.25rem',
        }}
      >
        {visibleTabs.map((type) => {
          const { authored, total } = countsFor(type)
          const active = type === activeType
          const countLabel = authored === total ? `${total}` : `${authored} / ${total}`
          const titleHint = authored === total
            ? `${total} ${type}`
            : `${authored} authored (active + non-stub) of ${total} total`
          return (
            <Link
              key={type}
              href={`/admin/programs?type=${type}`}
              role="tab"
              aria-selected={active}
              title={titleHint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--admin-text-primary)' : 'var(--admin-text-muted)',
                background: active ? 'var(--admin-bg-subtle, #f3f4f6)' : 'transparent',
                borderRadius: '0.375rem 0.375rem 0 0',
                borderBottom: active ? '2px solid var(--admin-primary, #6B2D8F)' : '2px solid transparent',
                marginBottom: '-0.25rem',
                textDecoration: 'none',
                transition: 'background-color 0.1s, color 0.1s',
              }}
            >
              {TYPE_LABEL[type] ?? type.replace(/_/g, ' ')}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '1.5rem',
                  padding: '0 0.4rem',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  background: active
                    ? 'var(--admin-primary, #6B2D8F)'
                    : 'var(--admin-bg-subtle, #e5e7eb)',
                  color: active ? '#fff' : 'var(--admin-text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {countLabel}
              </span>
            </Link>
          )
        })}
      </div>

      <ProgramsTable programs={visibleRows} />
    </div>
  )
}
