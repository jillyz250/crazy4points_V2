'use client'

import { useState } from 'react'
import { track } from '@/lib/analytics'

/**
 * Inline newsletter capture for guide pages. Guides are a common ad + SEO
 * landing surface, but their only other signup is the footer band, which most
 * readers never scroll to. This drops a compact, on-brand email capture right
 * in the flow of the content so paid/organic guide traffic has a real chance to
 * convert instead of reading and bouncing.
 *
 * Email-only by design: guide traffic is low-intent, and every extra required
 * field bleeds signups. First name is captured on the fuller homepage/newsletter
 * forms; here we optimize purely for conversion (see EMAIL_ONLY_SOURCES in
 * app/api/subscribe/route.ts).
 */
export default function GuideNewsletterCTA() {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    const referrerPath = typeof window !== 'undefined' ? window.location.pathname : null
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, website, source: 'guide_inline', referrerPath }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('success')
      track('newsletter_signup', { surface: 'guide' })
      setEmail('')
    } else {
      setStatus('error')
      setMessage(data.error || 'Something went wrong. Please try again.')
    }
  }

  return (
    <aside
      data-primary-newsletter-signup
      className="my-10 overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-primary)] px-6 py-8 sm:px-8"
    >
      <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] !text-[var(--color-accent)]">
        The insider list
      </p>

      {status === 'success' ? (
        <p className="mt-3 font-display text-2xl font-semibold !text-white">
          You&rsquo;re in &mdash; check your inbox for a welcome email.
        </p>
      ) : (
        <>
          <h2 className="mt-2 font-display text-2xl font-semibold !text-white md:text-3xl">
            Deals worth your miles, in your inbox
          </h2>
          <p className="mt-2 max-w-xl font-body !text-white/85">
            One email with the transfer bonuses, award sweet spots, and points moves actually worth
            caring about. No spam, unsubscribe anytime.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:max-w-lg">
            {/* Honeypot — hidden from humans, bots fill it. */}
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
              {status === 'loading' ? 'Signing up…' : 'Subscribe'}
            </button>
          </form>

          {message && <p className="mt-3 font-body text-sm !text-white/90">{message}</p>}
        </>
      )}
    </aside>
  )
}
