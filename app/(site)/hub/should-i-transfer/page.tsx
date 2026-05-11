import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { getActiveTransferBonuses } from '@/utils/supabase/transferBonusQueries'
import type { ActiveTransferBonus } from '@/utils/supabase/transferBonusQueries'
import ShouldITransferClient from '@/components/hub/ShouldITransferClient'

export const metadata: Metadata = {
  title: 'Should I Transfer? — The Points Hub — crazy4points',
  description:
    'Active transfer bonuses, the real math, and what breaks the deal. The calm adult in the points-and-miles room.',
  alternates: {
    canonical: 'https://www.crazy4points.com/hub/should-i-transfer',
  },
}

export const revalidate = 300

export default async function Page() {
  const supabase = createAdminClient()
  let bonuses: ActiveTransferBonus[] = []
  try {
    bonuses = await getActiveTransferBonuses(supabase)
  } catch (err) {
    console.error('[hub/should-i-transfer] getActiveTransferBonuses failed:', err)
    bonuses = []
  }

  return (
    <main className="rg-major-section">
      <div className="rg-container" style={{ maxWidth: '56rem' }}>
        <Link
          href="/hub"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            marginBottom: '1rem',
          }}
        >
          ← Back to the Hub
        </Link>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: 'var(--color-primary)',
            margin: '0 0 0.75rem',
            lineHeight: 1.1,
          }}
        >
          Should I Transfer?
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.0625rem',
            color: 'var(--color-text-secondary)',
            margin: '0 0 1.25rem',
            lineHeight: 1.55,
            maxWidth: '40rem',
          }}
        >
          Every other site screams &ldquo;TRANSFER NOW!&rdquo; the second a bonus
          drops. We&apos;ll tell you when it&apos;s actually worth it — and
          what breaks the deal when it isn&apos;t.
        </p>

        {/* Hard red warning — anti-speculation rule, above everything */}
        <div
          role="alert"
          style={{
            margin: '0 0 1.75rem',
            padding: '1rem 1.125rem',
            background: '#FEF2F2',
            border: '2px solid #DC2626',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#7F1D1D',
              marginBottom: '0.5rem',
            }}
          >
            <span aria-hidden style={{ fontSize: '1rem' }}>⚠️</span>
            Never transfer speculatively
          </div>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
              color: '#7F1D1D',
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            We do not recommend transferring points unless you have a{' '}
            <strong>specific redemption in mind</strong> and have confirmed the
            award space first. Award charts, partner rosters, and dynamic
            pricing can shift before you get to book — and once points leave a
            flexible currency, they&apos;re stuck. Search availability,{' '}
            <em>then</em> transfer.
          </p>
        </div>

        {bonuses.length === 0 ? (
          <div
            style={{
              padding: '2rem 1.25rem',
              background: 'var(--color-background-soft)',
              border: '1px dashed var(--color-border-soft)',
              borderRadius: 'var(--radius-card)',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                color: 'var(--color-primary)',
                margin: '0 0 0.5rem',
              }}
            >
              No active transfer bonuses right now
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9375rem',
                color: 'var(--color-text-secondary)',
                margin: 0,
              }}
            >
              Bonuses run constantly across Amex, Chase, Citi, Cap1, and Bilt.
              Check back in a week — there&apos;s always something live.
            </p>
          </div>
        ) : (
          <ShouldITransferClient bonuses={bonuses} />
        )}

      </div>
    </main>
  )
}
