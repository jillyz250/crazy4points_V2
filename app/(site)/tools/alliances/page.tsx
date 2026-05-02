import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import {
  getAllPartnerRedemptions,
  getAllPrograms,
} from '@/utils/supabase/queries'
import type {
  Program,
  PartnerRedemptionWithPrograms,
} from '@/utils/supabase/queries'
import ViewSwitcher, { type ExplorerView } from './ViewSwitcher'
import ByAllianceView from './ByAllianceView'
import ByAirlineView from './ByAirlineView'
import ByStatusView from './ByStatusView'
import BySearchView from './BySearchView'

export const metadata: Metadata = {
  title: 'Alliance Explorer | crazy4points',
  description:
    'A reference guide to oneworld, SkyTeam, and Star Alliance — tier ladders, lounge access rules, member airlines, in-alliance status equivalency, and partner-award redemptions.',
  alternates: { canonical: 'https://www.crazy4points.com/tools/alliances' },
}

const VALID_VIEWS: ExplorerView[] = ['alliance', 'airline', 'status', 'search']

function isValidView(v: string | undefined): v is ExplorerView {
  return !!v && (VALID_VIEWS as string[]).includes(v)
}

export default async function AllianceExplorerPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await props.searchParams
  const rawView = typeof sp.view === 'string' ? sp.view : undefined
  const view: ExplorerView = isValidView(rawView) ? rawView : 'alliance'

  const supabase = createAdminClient()
  const [programs, redemptions] = await Promise.all([
    getAllPrograms(supabase),
    getAllPartnerRedemptions(supabase),
  ])

  const alliances = programs.filter((p) => p.type === 'alliance' && p.is_active)
  const airlines = programs.filter((p) => p.type === 'airline' && p.is_active)
  const loyaltyPrograms = programs.filter(
    (p) => p.type === 'loyalty_program' && p.is_active
  )

  return (
    <main className="rg-major-section">
      <div className="rg-container">
        <header style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              color: 'var(--color-primary)',
              margin: 0,
            }}
          >
            Alliance Explorer
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.125rem',
              color: 'var(--color-text-secondary)',
              maxWidth: '50rem',
              marginTop: '0.5rem',
            }}
          >
            Your reference guide to the three global airline alliances —
            oneworld, SkyTeam, and Star Alliance. Browse tier ladders, lounge
            access rules, member airlines, in-alliance status equivalency, and
            (coming soon) partner-award redemptions across {airlines.length}{' '}
            carriers.
          </p>
        </header>

        <ViewSwitcher current={view} carrierCount={airlines.length} />

        <section style={{ marginTop: '2rem' }}>
          {view === 'alliance' && (
            <ByAllianceView
              alliances={alliances}
              airlines={airlines}
              loyaltyPrograms={loyaltyPrograms}
            />
          )}
          {view === 'airline' && (
            <ByAirlineView
              airlines={airlines}
              alliances={alliances}
              loyaltyPrograms={loyaltyPrograms}
              query={typeof sp.q === 'string' ? sp.q : ''}
              alliance={typeof sp.alliance === 'string' ? sp.alliance : ''}
            />
          )}
          {view === 'status' && (
            <ByStatusView
              alliances={alliances}
              airlines={airlines}
              loyaltyPrograms={loyaltyPrograms}
              selectedSlug={typeof sp.program === 'string' ? sp.program : ''}
              selectedTier={typeof sp.tier === 'string' ? sp.tier : ''}
            />
          )}
          {view === 'search' && (
            <BySearchView
              redemptions={redemptions}
              airlines={airlines}
              loyaltyPrograms={loyaltyPrograms}
              cabin={typeof sp.cabin === 'string' ? sp.cabin : ''}
              maxCost={typeof sp.max === 'string' ? sp.max : ''}
              currency={typeof sp.currency === 'string' ? sp.currency : ''}
            />
          )}
        </section>

        <footer
          style={{
            marginTop: '3rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--color-border-soft)',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          Data sourced from official alliance sites and member loyalty programs.
          Verify lounge access, tier benefits, and award pricing on the
          operating carrier&apos;s site before booking. Member alliance pages:{' '}
          <Link href="/programs/oneworld">oneworld</Link>,{' '}
          <Link href="/programs/skyteam">SkyTeam</Link>,{' '}
          <Link href="/programs/star_alliance">Star Alliance</Link>.
        </footer>
      </div>
    </main>
  )
}

export type { Program, PartnerRedemptionWithPrograms }
