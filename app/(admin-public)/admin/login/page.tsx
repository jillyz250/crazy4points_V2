'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      // Return to the page they were headed to (set by the admin middleware as
      // ?returnTo=), so a deep link / bookmark lands correctly after login.
      // Read from the live URL to avoid a Suspense boundary for useSearchParams.
      // Only allow local /admin paths (never protocol-relative "//host") so this
      // can't be turned into an open redirect.
      let dest = '/admin'
      try {
        const rt = new URLSearchParams(window.location.search).get('returnTo')
        if (rt && rt.startsWith('/admin') && !rt.startsWith('//')) dest = rt
      } catch {
        /* no-op: fall back to /admin */
      }
      router.push(dest)
    } else {
      setError('Incorrect password.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-background-soft)',
      fontFamily: 'var(--font-ui)',
    }}>
      <div style={{
        background: 'var(--color-background)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '24rem',
        boxShadow: 'var(--shadow-soft)',
      }}>
        <h1 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--color-primary)' }}>
          Admin Login
        </h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="password"
              style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-ui)',
                fontSize: '1rem',
                fontFamily: 'var(--font-body)',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {error && (
            <p style={{ color: '#c0392b', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rg-btn-primary"
            style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Checking…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
