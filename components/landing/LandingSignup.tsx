'use client'

import { useState } from 'react'
import { track } from '@/lib/analytics'

/**
 * Newsletter capture for ad-campaign landing pages (/go/[slug]). The primary
 * conversion on a paid-traffic landing: subscribers are the real payoff of a small
 * ad spend, not clicks through to the offer. Tags source='campaign_landing' with
 * referrerPath=/go/<slug>, so each campaign's signups are attributable in analytics.
 */
export default function LandingSignup({ campaign }: { campaign: string }) {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    const referrerPath = typeof window !== 'undefined' ? window.location.pathname : null
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website, source: 'campaign_landing', referrerPath }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        track('newsletter_signup', { surface: 'campaign_landing', campaign })
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <p className="font-display text-xl font-semibold !text-white">
        You&rsquo;re in &mdash; check your inbox for a welcome email.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          Subject
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>
      <input
        type="email"
        required
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="min-w-0 flex-1 rounded-[var(--radius-ui)] border border-white/30 bg-white px-4 py-3 font-body text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="rg-tap-target shrink-0 rounded-[var(--radius-ui)] !bg-[var(--color-accent)] px-6 py-3 font-ui text-sm font-bold uppercase tracking-[0.1em] !text-[#1A1A1A] transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === 'loading' ? 'Signing up…' : 'Get the newsletter'}
      </button>
      {message && <p className="mt-2 font-body text-sm !text-white/90">{message}</p>}
    </form>
  )
}
