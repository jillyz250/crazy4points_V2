'use client'

import { useState } from 'react'
import { track } from '@/lib/analytics'

/**
 * Compact signup that sits as a band at the top of the sitewide Footer.
 * Reuses /api/subscribe (same endpoint as the homepage hero form).
 *
 * First/last name are optional — collected so welcome emails can address
 * the reader by name. Email is the only required field.
 *
 * Tracks `newsletter_signup` with `surface: 'footer'` so we can split
 * conversion vs. the homepage hero form in analytics.
 */
export default function FooterNewsletterSignup() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName, lastName, website }),
    })

    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setStatus('success')
      setMessage("You're in! Check your inbox for a welcome email.")
      track('newsletter_signup', { surface: 'footer' })
      setFirstName('')
      setLastName('')
      setEmail('')
    } else {
      setStatus('error')
      setMessage(data.error || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="rg-container px-6 py-10 md:px-8 md:py-12">
      <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-10">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">
            From the friend who actually gets points
          </h2>
          <p className="mt-2 font-body text-base text-[var(--color-text-secondary)]">
            A weekly digest of points-and-miles deals worth your inbox space —
            plus the occasional alert when something time-sensitive hits.
          </p>
        </div>

        {status === 'success' ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-6 py-5 text-center">
            <p className="font-display text-lg font-semibold text-[var(--color-primary)]">
              Welcome aboard!
            </p>
            <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full">
            {/* Honeypot — hidden from humans, bots fill it. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
              <label>
                Subject
                <input
                  type="text"
                  name="subject_hp"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="footer-newsletter-first" className="sr-only">
                    First name (optional)
                  </label>
                  <input
                    id="footer-newsletter-first"
                    type="text"
                    placeholder="First name (optional)"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    className="w-full rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-4 py-3 font-body text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    style={{ fontSize: '1rem' }}
                  />
                </div>
                <div>
                  <label htmlFor="footer-newsletter-last" className="sr-only">
                    Last name (optional)
                  </label>
                  <input
                    id="footer-newsletter-last"
                    type="text"
                    placeholder="Last name (optional)"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    className="w-full rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-4 py-3 font-body text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    style={{ fontSize: '1rem' }}
                  />
                </div>
              </div>

              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email address
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="footer-newsletter-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="min-w-0 flex-1 rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-4 py-3 font-body text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  style={{ fontSize: '1rem' }}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="rg-btn-primary shrink-0 disabled:opacity-60"
                  style={{ minHeight: '44px' }}
                >
                  {status === 'loading' ? 'Signing up…' : 'Subscribe'}
                </button>
              </div>
              <p className="font-body text-xs text-[var(--color-text-secondary)]">
                Unsubscribe anytime. We&apos;ll never share your email.
              </p>
              {message && status === 'error' && (
                <p className="font-body text-sm text-red-600">{message}</p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
