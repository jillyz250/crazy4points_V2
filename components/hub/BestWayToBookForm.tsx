'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Airport } from '@/lib/airports'
import type { RedemptionCabin } from '@/utils/supabase/queries'

const CABINS: RedemptionCabin[] = ['Economy', 'Premium Economy', 'Business', 'First']

export default function BestWayToBookForm({
  airports,
  initialFrom = '',
  initialTo = '',
  initialCabin = 'Economy',
}: {
  airports: Airport[]
  initialFrom?: string
  initialTo?: string
  initialCabin?: RedemptionCabin
}) {
  const router = useRouter()
  const [from, setFrom] = useState(initialFrom.toUpperCase())
  const [to, setTo] = useState(initialTo.toUpperCase())
  const [cabin, setCabin] = useState<RedemptionCabin>(initialCabin)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!from || !to) return
    const params = new URLSearchParams({
      from: from.trim().toUpperCase(),
      to: to.trim().toUpperCase(),
      cabin,
    })
    router.push(`/hub/best-way-to-book?${params.toString()}`)
  }

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
        gap: '0.875rem',
      }}
    >
      <datalist id="airport-codes">
        {airports.map((a) => (
          <option key={a.iata} value={a.iata}>{`${a.iata} — ${a.city}, ${a.country}`}</option>
        ))}
      </datalist>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
          gap: '0.5rem',
        }}
      >
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
            }}
          >
            From
          </span>
          <input
            type="text"
            list="airport-codes"
            value={from}
            onChange={(e) => setFrom(e.target.value.toUpperCase().slice(0, 3))}
            placeholder="JFK"
            maxLength={3}
            required
            autoCapitalize="characters"
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
            }}
          >
            To
          </span>
          <input
            type="text"
            list="airport-codes"
            value={to}
            onChange={(e) => setTo(e.target.value.toUpperCase().slice(0, 3))}
            placeholder="HNL"
            maxLength={3}
            required
            autoCapitalize="characters"
            style={inputStyle}
          />
        </label>
      </div>

      <div>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
            marginBottom: '0.375rem',
          }}
        >
          Cabin
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {CABINS.map((c) => {
            const active = c === cabin
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCabin(c)}
                style={{
                  padding: '0.4375rem 0.75rem',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.75rem',
                  fontWeight: active ? 700 : 600,
                  border: active ? 'none' : '1px solid var(--color-border-soft)',
                  background: active ? 'var(--color-primary)' : '#fff',
                  color: active ? '#fff' : 'var(--color-text-primary)',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="submit"
        style={{
          padding: '0.75rem 1rem',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: '#fff',
          background: 'var(--color-primary)',
          border: 'none',
          borderRadius: 'var(--radius-ui)',
          cursor: 'pointer',
          minHeight: '44px',
          justifySelf: 'start',
        }}
      >
        Find redemptions →
      </button>
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.625rem 0.75rem',
  fontFamily: 'var(--font-display)',
  fontSize: '1.125rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--color-primary)',
  border: '1px solid var(--color-border-soft)',
  borderRadius: 'var(--radius-ui)',
  background: '#fff',
  minHeight: '44px',
}
