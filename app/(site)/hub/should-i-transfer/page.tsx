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
            margin: '0 0 2rem',
            lineHeight: 1.55,
            maxWidth: '40rem',
          }}
        >
          Every other site screams &ldquo;TRANSFER NOW!&rdquo; the second a bonus
          drops. We&apos;ll tell you when it&apos;s actually worth it — and
          what breaks the deal when it isn&apos;t.
        </p>

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

        <div
          style={{
            marginTop: '3rem',
            padding: '1.25rem',
            background: 'var(--color-background-soft)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.0625rem',
              color: 'var(--color-primary)',
              margin: '0 0 0.5rem',
            }}
          >
            One rule of transfers: never speculate
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
              color: 'var(--color-text-secondary)',
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            Transferable points are flexible. Once they move into an airline
            program, they&apos;re stuck there. Confirm your award space first.
            Then transfer.
          </p>
        </div>
      </div>
    </main>
  )
}
