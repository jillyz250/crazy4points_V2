import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import {
  buildTransferGraph,
  getWalletPickerOptions,
  getWalletRedemptions,
} from '@/utils/supabase/whereCanIGoQueries'
import type { Wallet, WalletRedemption } from '@/utils/supabase/whereCanIGoQueries'
import type { Program } from '@/utils/supabase/queries'
import WalletForm from '@/components/hub/WalletForm'
import WalletRedemptionRow from '@/components/hub/WalletRedemptionRow'
import ChartDisclaimer from '@/components/hub/ChartDisclaimer'

export const metadata: Metadata = {
  title: 'Where Can My Points Take Me? — The Points Hub — crazy4points',
  description:
    "Plug in your balances. See which published partner redemptions your points are priced for — direct and one transfer away.",
  alternates: { canonical: 'https://www.crazy4points.com/hub/where-can-i-go' },
}

export const revalidate = 60

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams

  // Build wallet from URL params (every numeric param is treated as a balance)
  const wallet: Wallet = {}
  for (const [k, v] of Object.entries(sp)) {
    const n = parseInt(v, 10)
    if (!isNaN(n) && n > 0) wallet[k] = n
  }
  const hasWallet = Object.keys(wallet).length > 0

  const supabase = createAdminClient()
  let options: Program[] = []
  let items: WalletRedemption[] = []
  let queryError: string | null = null

  try {
    options = await getWalletPickerOptions(supabase)
    if (hasWallet) {
      const graph = await buildTransferGraph(supabase)
      items = await getWalletRedemptions(supabase, wallet, graph)
    }
  } catch (err) {
    console.error('[hub/where-can-i-go] query failed:', err)
    queryError = 'Something went wrong loading data. Refresh and try again.'
  }

  const ready = items.filter((i) => i.tier === 'ready')
  const oneAway = items.filter((i) => i.tier === 'one_transfer_away')
  const unreachable = items.filter((i) => i.tier === 'unreachable')

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
          Where Can My Points Take Me?
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.0625rem',
            color: 'var(--color-text-secondary)',
            margin: '0 0 1.5rem',
            lineHeight: 1.55,
            maxWidth: '40rem',
          }}
        >
          Plug in your balances. We&apos;ll match them against published
          partner award charts so you can see what&apos;s priced within your
          reach — direct, one transfer away, and (optionally) the
          aspirational stuff in a separate section.
        </p>

        <ChartDisclaimer />
        <WalletForm options={options} initialWallet={wallet} />

        {queryError && (
          <p
            style={{
              padding: '0.875rem 1rem',
              background: '#FECACA',
              border: '1px solid #F87171',
              borderRadius: 'var(--radius-card)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
              color: '#7F1D1D',
              margin: '0 0 1.5rem',
            }}
          >
            {queryError}
          </p>
        )}

        {hasWallet && !queryError && (
          <>
            {ready.length === 0 && oneAway.length === 0 && (
              <div
                style={{
                  padding: '1.5rem',
                  background: 'var(--color-background-soft)',
                  border: '1px dashed var(--color-border-soft)',
                  borderRadius: 'var(--radius-card)',
                  textAlign: 'center',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.125rem',
                    color: 'var(--color-primary)',
                    margin: '0 0 0.5rem',
                  }}
                >
                  Nothing reachable from your wallet yet
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9375rem',
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Your balances don&apos;t yet reach the sweet spots we&apos;ve
                  authored. Either bump those balances or wait for us to
                  author more redemption rows in other programs.
                </p>
              </div>
            )}

            {ready.length > 0 && (
              <Section
                title="✅ Priced within your reach"
                subtitle={`${ready.length} ${ready.length === 1 ? 'redemption rate is' : 'redemption rates are'} fully covered by what you hold. Search the operating airline for actual availability before booking.`}
              >
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {ready.map((i) => (
                    <WalletRedemptionRow key={i.row.id} item={i} />
                  ))}
                </div>
              </Section>
            )}

            {oneAway.length > 0 && (
              <Section
                title="⚠️ One transfer away"
                subtitle={`${oneAway.length} ${oneAway.length === 1 ? 'rate is' : 'rates are'} covered after a single transfer in. Confirm availability before transferring — transfers are irreversible.`}
              >
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {oneAway.map((i) => (
                    <WalletRedemptionRow key={i.row.id} item={i} />
                  ))}
                </div>
              </Section>
            )}

            {unreachable.length > 0 && (
              <Section
                title="❌ Out of reach from this wallet"
                subtitle={`${unreachable.length} more sweet spots that need different points to book.`}
              >
                <details style={{ display: 'grid', gap: '0.5rem' }}>
                  <summary
                    style={{
                      cursor: 'pointer',
                      padding: '0.625rem 0.875rem',
                      background: 'var(--color-background-soft)',
                      border: '1px solid var(--color-border-soft)',
                      borderRadius: 'var(--radius-ui)',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Show me anyway ({unreachable.length})
                  </summary>
                  <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {unreachable.slice(0, 12).map((i) => (
                      <WalletRedemptionRow key={i.row.id} item={i} />
                    ))}
                  </div>
                </details>
              </Section>
            )}
          </>
        )}

        {!hasWallet && (
          <div
            style={{
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
              Why fill in your wallet?
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9375rem',
                color: 'var(--color-text-secondary)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              We split results into three tiers so you stop chasing
              redemptions you can&apos;t book.{' '}
              <strong>Ready</strong> means you have the miles right now.{' '}
              <strong>One transfer away</strong> means you have enough
              transferable points to make it work today.{' '}
              <strong>Out of reach</strong> goes in a collapsed section so
              fantasy redemptions don&apos;t distract you.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                margin: '0.75rem 0 0',
                fontStyle: 'italic',
              }}
            >
              Wallet stays in your browser — nothing leaves your device.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          color: 'var(--color-primary)',
          margin: '0 0 0.25rem',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          margin: '0 0 0.875rem',
        }}
      >
        {subtitle}
      </p>
      {children}
    </section>
  )
}
