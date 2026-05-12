'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FNC_CERTS } from '@/lib/fncCerts'

export default function FncFitForm({
  initialCert = '',
  initialQuery = '',
}: {
  initialCert?: string
  initialQuery?: string
}) {
  const router = useRouter()
  const [cert, setCert] = useState(initialCert)
  const [query, setQuery] = useState(initialQuery)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cert || !query.trim()) return
    const params = new URLSearchParams({
      cert,
      q: query.trim(),
    })
    router.push(`/hub/fnc-fit?${params.toString()}`)
  }

  // Group certs by program for cleaner picker
  const groups: Record<string, typeof FNC_CERTS> = {}
  for (const c of FNC_CERTS) {
    (groups[c.programSlug] ??= []).push(c)
  }
  const programLabels: Record<string, string> = {
    marriott: 'Marriott Bonvoy',
    hyatt: 'World of Hyatt',
    ihg: 'IHG One Rewards',
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
        gap: '1rem',
      }}
    >
      {/* Top-of-form expiry heads-up. The tool exists to beat expiry,
          so the very first thing a user sees should be a reminder to
          check their account. Each cert's specific expiry surfaces in
          the result card after a match.

          Hyatt + IHG nuance worth flagging upfront: the full STAY must
          be completed before the cert expires, not just booked. */}
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          margin: 0,
          lineHeight: 1.45,
        }}
      >
        <strong style={{ color: 'var(--color-text-primary)' }}>Before you start:</strong>{' '}
        Free Night Cert expirations vary (typically 6–12 months from issue).
        For Hyatt and IHG, your stay must be <strong>completed</strong> before
        the cert expires — not just booked. Log into your loyalty account to
        confirm the exact date.
      </p>

      <div>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
            marginBottom: '0.5rem',
          }}
        >
          Your cert
        </div>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {Object.entries(groups).map(([slug, certs]) => (
            <div key={slug}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.875rem',
                  color: 'var(--color-primary)',
                  marginBottom: '0.375rem',
                }}
              >
                {programLabels[slug] ?? slug}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {certs.map((c) => {
                  const active = cert === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCert(c.id)}
                      style={{
                        padding: '0.4375rem 0.75rem',
                        fontFamily: 'var(--font-ui)',
                        fontSize: '0.75rem',
                        fontWeight: active ? 700 : 600,
                        border: active ? 'none' : '1px solid var(--color-border-soft)',
                        background: active
                          ? 'var(--color-primary)'
                          : '#fff',
                        color: active ? '#fff' : 'var(--color-text-primary)',
                        borderRadius: '999px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.label.replace(/ Free Night.*$/, '')}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <label style={{ display: 'grid', gap: '0.375rem' }}>
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
          Hotel name or city
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Andaz Maui, Park Hyatt Vienna, St Regis NYC"
          required
          style={{
            padding: '0.625rem 0.75rem',
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-ui)',
            background: '#fff',
            minHeight: '44px',
          }}
        />
      </label>

      <button
        type="submit"
        disabled={!cert || !query.trim()}
        style={{
          padding: '0.75rem 1rem',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: '#fff',
          background:
            !cert || !query.trim()
              ? 'var(--color-text-secondary)'
              : 'var(--color-primary)',
          border: 'none',
          borderRadius: 'var(--radius-ui)',
          cursor: !cert || !query.trim() ? 'not-allowed' : 'pointer',
          minHeight: '44px',
          justifySelf: 'start',
        }}
      >
        Will it fit? →
      </button>
    </form>
  )
}
