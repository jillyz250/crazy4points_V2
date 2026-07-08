'use client'

import { useState } from 'react'
import { track } from '@/lib/analytics'

/** Compact email-only signup for the homepage newsletter band. Shares the
 *  /api/subscribe contract with the full form; first name is optional server-side. */
export default function NewsletterSignupInline({
  source = 'homepage_band',
  buttonClassName = 'rg-btn-primary',
}: {
  source?: string
  buttonClassName?: string
}) {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
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
      body: JSON.stringify({ email, website, source, referrerPath }),
    })
    const data = await res.json()

    if (res.ok) {
      setStatus('success')
      setMessage("You're in! Check your inbox for a welcome email.")
      track('newsletter_signup', { surface: 'home_band' })
      setEmail('')
    } else {
      setStatus('error')
      setMessage(data.error || 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <p className="font-body text-base font-semibold text-[var(--color-primary)]">{message}</p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Honeypot — bots fill it, humans don't see it. Do not remove. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          Subject
          <input type="text" name="subject_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" data-1p-ignore data-lpignore="true" data-form-type="other" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="min-w-0 flex-1 rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-4 py-3 font-body text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <button type="submit" disabled={status === 'loading'} className={`${buttonClassName} shrink-0 disabled:opacity-60`}>
          {status === 'loading' ? 'Signing up…' : 'Subscribe'}
        </button>
      </div>
      {message && status === 'error' && (
        <p className="mt-2 font-body text-sm text-red-600">{message}</p>
      )}
    </form>
  )
}
