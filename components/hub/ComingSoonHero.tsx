'use client'

import { useState } from 'react'
import Link from 'next/link'

export type ComingSoonHeroProps = {
  toolName: string
  question: string
  description: string
  whatItWillDo: string[]
  tag: string // future use — funnel into tagged Resend list
}

export default function ComingSoonHero({
  toolName,
  question,
  description,
  whatItWillDo,
}: ComingSoonHeroProps) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle',
  )
  const [errorMsg, setErrorMsg] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'submitting') return
    setState('submitting')
    setErrorMsg('')
    try {
      const referrerPath = typeof window !== 'undefined' ? window.location.pathname : null
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, source: 'hub_hero', referrerPath }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data?.error ?? 'Something went wrong.')
        setState('error')
        return
      }
      setState('success')
    } catch {
      setErrorMsg('Network error. Try again.')
      setState('error')
    }
  }

  return (
    <main className="rg-major-section">
      <div className="rg-container" style={{ maxWidth: '52rem' }}>
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

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.25rem 0.625rem',
            borderRadius: '999px',
            background: 'var(--color-accent)',
            color: '#1A1A1A',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}
        >
          Coming soon
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: 'var(--color-primary)',
            margin: '0 0 0.75rem',
            lineHeight: 1.1,
          }}
        >
          {toolName}
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.0625rem',
            color: 'var(--color-text-primary)',
            margin: '0 0 1.5rem',
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}
        >
          &ldquo;{question}&rdquo;
        </p>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            color: 'var(--color-text-secondary)',
            margin: '0 0 1.5rem',
            lineHeight: 1.55,
          }}
        >
          {description}
        </p>

        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.125rem',
            color: 'var(--color-primary)',
            margin: '2rem 0 0.75rem',
          }}
        >
          What it will do
        </h2>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gap: '0.5rem',
          }}
        >
          {whatItWillDo.map((line, i) => (
            <li
              key={i}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9375rem',
                color: 'var(--color-text-primary)',
                lineHeight: 1.5,
                paddingLeft: '1.5rem',
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '0.125rem',
                  color: 'var(--color-accent)',
                }}
              >
                ✦
              </span>
              {line}
            </li>
          ))}
        </ul>

        <div
          style={{
            marginTop: '2.5rem',
            padding: '1.5rem',
            background: 'var(--color-background-soft)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
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
            Get notified when this launches
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
              color: 'var(--color-text-secondary)',
              margin: '0 0 1rem',
            }}
          >
            You&apos;ll also get the crazy4points newsletter: best
            redemptions, transfer bonuses, and what we&apos;d skip.
          </p>

          {state === 'success' ? (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9375rem',
                color: '#065F46',
                fontWeight: 600,
                margin: 0,
              }}
            >
              ✅ You&apos;re on the list. We&apos;ll ping you when {toolName} ships.
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              style={{ display: 'grid', gap: '0.5rem' }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                }}
              >
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={state === 'submitting'}
                style={{
                  padding: '0.625rem 1rem',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#fff',
                  background:
                    state === 'submitting'
                      ? 'var(--color-text-secondary)'
                      : 'var(--color-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-ui)',
                  cursor: state === 'submitting' ? 'wait' : 'pointer',
                  minHeight: '44px',
                }}
              >
                {state === 'submitting' ? 'Subscribing…' : 'Notify me'}
              </button>
              {state === 'error' && errorMsg && (
                <p
                  style={{
                    margin: '0.25rem 0 0',
                    fontSize: '0.8125rem',
                    color: '#7F1D1D',
                  }}
                >
                  {errorMsg}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.625rem 0.75rem',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  border: '1px solid var(--color-border-soft)',
  borderRadius: 'var(--radius-ui)',
  background: '#fff',
  minHeight: '44px',
}
