/**
 * /wallet — personal credit-card-benefit checklist.
 *
 * Server loads the catalog of extracted cards + their checklist-eligible
 * benefits. Client takes over for state (which cards the user owns + which
 * credits they've used per period), persisted to browser localStorage.
 *
 * No auth required. No DB writes. Pure read of public card catalog.
 */

import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { getWalletBundle } from '@/utils/wallet/queries'
import WalletClient from '@/components/wallet/WalletClient'

export const metadata: Metadata = {
  title: 'My Wallet — track your credit card credits',
  description:
    'Personal monthly checklist of every credit card credit, statement perk, and free night cert you have. Pick your cards, mark them off as you use them, never miss an annual expiration again.',
}

// Public card catalog data — safe to cache aggressively
export const revalidate = 3600

export default async function WalletPage() {
  const supabase = createAdminClient()
  const bundle = await getWalletBundle(supabase)

  return (
    <main className="rg-container rg-major-section">
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', marginBottom: '0.5rem' }}>
          My Wallet
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', maxWidth: '42rem' }}>
          Your personal monthly checklist of every credit, perk, and free night your cards give you.
          Pick the cards you carry below — your wallet stays on this device.
        </p>
      </header>

      <WalletClient bundle={bundle} />
    </main>
  )
}
