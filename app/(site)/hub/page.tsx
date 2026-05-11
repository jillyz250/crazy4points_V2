import type { Metadata } from 'next'
import HubCard from '@/components/hub/HubCard'

export const metadata: Metadata = {
  title: 'The Points Hub — crazy4points',
  description:
    'Like having a friend who actually gets points. Decision-support tools for award redemptions, transfer bonuses, and travel rewards strategy.',
  alternates: { canonical: 'https://www.crazy4points.com/hub' },
  openGraph: {
    title: 'The Points Hub — crazy4points',
    description:
      'Like having a friend who actually gets points. Decision-support tools for award redemptions, transfer bonuses, and travel rewards strategy.',
    url: 'https://www.crazy4points.com/hub',
    type: 'website',
    siteName: 'crazy4points',
  },
}

export const revalidate = 300

const TOOLS = [
  {
    title: 'Should I Transfer?',
    description:
      'Active transfer bonuses, the math, and what breaks the deal. The calm adult in the room.',
    icon: '🔄',
    href: '/hub/should-i-transfer',
    status: 'live' as const,
  },
  {
    title: 'Best Way to Book It',
    description:
      'Punch in JFK→HNL and see every smart way to book it. Sorted by miles, with the catch up front.',
    icon: '✈️',
    href: '/hub/best-way-to-book',
    status: 'coming-soon' as const,
  },
  {
    title: 'Will My FNC Fit?',
    description:
      'Can your 35k Marriott cert cover this hotel? Yes / yes-with-topup / no, in three seconds.',
    icon: '🏨',
    href: '/hub/fnc-fit',
    status: 'coming-soon' as const,
  },
  {
    title: 'Earn Path',
    description:
      'Need 70k Atmos? Fastest, cheapest, or easiest path — three buttons, real answers.',
    icon: '🚀',
    href: '/hub/earn-path',
    status: 'coming-soon' as const,
  },
  {
    title: "Don't Sleep On These",
    description:
      'Living sweet spots — what still works in 2026 and what to grab before it dies.',
    icon: '⭐',
    href: '/hub/dont-sleep',
    status: 'coming-soon' as const,
  },
  {
    title: 'Where Can My Points Take Me?',
    description:
      'Got 100k MR doing nothing? See where your points are priced to fly — direct or one transfer away.',
    icon: '🗺️',
    href: '/hub/where-can-i-go',
    status: 'live' as const,
  },
  {
    title: 'Alliance Explorer',
    description:
      'oneworld, SkyTeam, Star Alliance — tier ladders, lounge access, member maps. Already live.',
    icon: '🌐',
    href: '/tools/alliances',
    status: 'live' as const,
  },
]

export default function HubPage() {
  return (
    <main className="rg-major-section">
      <div className="rg-container" style={{ maxWidth: '72rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.25rem, 6vw, 3.5rem)',
              color: 'var(--color-primary)',
              margin: '0 0 0.75rem',
              lineHeight: 1.1,
            }}
          >
            The Points Hub
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              color: 'var(--color-text-secondary)',
              margin: '0 auto 0.5rem',
              fontStyle: 'italic',
              maxWidth: '36rem',
            }}
          >
            Like having a friend who actually gets points.
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
              color: 'var(--color-text-secondary)',
              margin: '0 auto',
              maxWidth: '40rem',
              lineHeight: 1.5,
            }}
          >
            Decision-support tools for points and miles travel. Less reading,
            more flying.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
            gap: '1rem',
          }}
        >
          {TOOLS.map((t) => (
            <HubCard key={t.href} {...t} />
          ))}
        </div>
      </div>
    </main>
  )
}
