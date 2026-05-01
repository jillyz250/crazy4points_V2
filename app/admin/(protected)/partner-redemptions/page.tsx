import { createAdminClient } from '@/utils/supabase/server'
import {
  getAllPartnerRedemptions,
  getAllPrograms,
} from '@/utils/supabase/queries'
import AddPartnerRedemptionForm from './AddPartnerRedemptionForm'
import PartnerRedemptionsTable from './PartnerRedemptionsTable'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'

// Programs that can be a redemption *currency* (you spend their miles).
// Airlines + transferable currencies. Hotels/cards/etc excluded — they're
// not redemption currencies for flights.
const CURRENCY_TYPES = new Set(['airline', 'loyalty_program'])

// Programs that can be the *operating carrier* (you fly them).
// Only carriers — alliances and credit cards aren't operated.
const CARRIER_TYPES = new Set(['airline'])

export default async function AdminPartnerRedemptionsPage() {
  const supabase = createAdminClient()
  const [redemptions, programs] = await Promise.all([
    getAllPartnerRedemptions(supabase),
    getAllPrograms(supabase),
  ])

  const currencies = programs
    .filter((p) => p.is_active && CURRENCY_TYPES.has(p.type))
    .map((p) => ({ id: p.id, slug: p.slug, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const carriers = programs
    .filter((p) => p.is_active && CARRIER_TYPES.has(p.type))
    .map((p) => ({ id: p.id, slug: p.slug, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <PageHeader
        title="Partner Redemptions"
        description="Structured partner-award data. Powers the Alliance Explorer cross-search and the per-airline 'where to spend your miles' grids."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Badge tone="neutral">{redemptions.length} total</Badge>
            <AddPartnerRedemptionForm currencies={currencies} carriers={carriers} />
          </div>
        }
      />

      <PartnerRedemptionsTable
        rows={redemptions}
        currencies={currencies}
        carriers={carriers}
      />
    </div>
  )
}
