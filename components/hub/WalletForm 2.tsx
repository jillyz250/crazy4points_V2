'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Program } from '@/utils/supabase/queries'

const STORAGE_KEY = 'c4p_points_wallet_v1'

type WalletState = Record<string, number>

export default function WalletForm({
  options,
  initialWallet,
}: {
  options: Program[]
  initialWallet: WalletState
}) {
  const router = useRouter()
  const [wallet, setWallet] = useState<WalletState>(initialWallet)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on first render (overrides URL if URL is empty)
  useEffect(() => {
    if (hydrated) return
    if (Object.keys(initialWallet).length === 0) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as WalletState
          if (parsed && typeof parsed === 'object') setWallet(parsed)
        }
      } catch {
        // ignore parse errors
      }
    }
    setHydrated(true)
  }, [hydrated, initialWallet])

  function onChange(slug: string, value: string) {
    const n = parseInt(value.replace(/,/g, ''), 10)
    const next = { ...wallet }
    if (isNaN(n) || n <= 0) delete next[slug]
    else next[slug] = n
    setWallet(next)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet))
    } catch {
      // ignore quota errors
    }
    const params = new URLSearchParams()
    for (const [slug, amount] of Object.entries(wallet)) {
      if (amount > 0) params.set(slug, String(amount))
    }
    router.push(`/hub/where-can-i-go?${params.toString()}`)
  }

  function clearWallet() {
    setWallet({})
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    router.push('/hub/where-can-i-go')
  }

  // Group options by transferable vs airline vs hotel for cleaner display
  const transferable = options.filter(
    (p) => p.is_transferable_currency || ['amex', 'chase', 'citi', 'capital_one', 'bilt'].includes(p.slug),
  )
  const airlines = options.filter((p) => p.type === 'airline' && !transferable.includes(p))
  const hotels = options.filter((p) => p.type === 'hotel' && !transferable.includes(p))
  const others = options.filter(
    (p) => !transferable.includes(p) && p.type !== 'airline' && p.type !== 'hotel',
  )

  return (
    <form
      onSubmit={onSubmit}
      style={{
        padding: '1.25rem',
        background: 'var(--color-background-soft)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        marginBottom: '1.5rem',
        display: 'grid',
        gap: '1rem',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
        }}
      >
        Your points wallet (stored in this browser only)
      </div>

      <WalletSection title="Transferable currencies" options={transferable} wallet={wallet} onChange={onChange} />
      {airlines.length > 0 && (
        <WalletSection title="Airline programs" options={airlines} wallet={wallet} onChange={onChange} />
      )}
      {hotels.length > 0 && (
        <WalletSection title="Hotel programs" options={hotels} wallet={wallet} onChange={onChange} />
      )}
      {others.length > 0 && (
        <WalletSection title="Other programs" options={others} wallet={wallet} onChange={onChange} />
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="submit"
          disabled={Object.keys(wallet).length === 0}
          style={{
            padding: '0.75rem 1rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.9375rem',
            fontWeight: 700,
            color: '#fff',
            background:
              Object.keys(wallet).length === 0
                ? 'var(--color-text-secondary)'
                : 'var(--color-primary)',
            border: 'none',
            borderRadius: 'var(--radius-ui)',
            cursor: Object.keys(wallet).length === 0 ? 'not-allowed' : 'pointer',
            minHeight: '44px',
          }}
        >
          Find redemptions →
        </button>
        {Object.keys(wallet).length > 0 && (
          <button
            type="button"
            onClick={clearWallet}
            style={{
              padding: '0.75rem 1rem',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              background: 'transparent',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-ui)',
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            Clear wallet
          </button>
        )}
      </div>
    </form>
  )
}

function WalletSection({
  title,
  options,
  wallet,
  onChange,
}: {
  title: string
  options: Program[]
  wallet: WalletState
  onChange: (slug: string, value: string) => void
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.875rem',
          color: 'var(--color-primary)',
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
          gap: '0.5rem',
        }}
      >
        {options.map((p) => (
          <label
            key={p.slug}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.4375rem 0.625rem',
              background: '#fff',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-ui)',
              fontSize: '0.8125rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {p.name}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              placeholder="0"
              value={wallet[p.slug] ?? ''}
              onChange={(e) => onChange(p.slug, e.target.value)}
              style={{
                width: '5.5rem',
                padding: '0.25rem 0.4375rem',
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-ui)',
                background: '#fff',
                textAlign: 'right',
              }}
            />
          </label>
        ))}
      </div>
    </div>
  )
}
