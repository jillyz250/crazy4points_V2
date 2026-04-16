'use client'

import { useState } from 'react'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName }),
    })

    const data = await res.json()

    if (res.ok) {
      setStatus('success')
      setMessage('You\'re in! Check your inbox for a welcome email.')
      setEmail('')
      setFirstName('')
    } else {
      setStatus('error')
      setMessage(data.error || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      {status === 'success' ? (
        <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-background)] px-8 py-10 text-center">
          <p className="font-display text-2xl font-semibold text-[var(--color-primary)]">Welcome to the newsletter!</p>
          <p className="mt-2 font-body text-[var(--color-text-secondary)]">
            You're all set. Check your inbox for a welcome email from us.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-background)] px-8 py-10">
          <div className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
              className="w-full rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-4 py-3 font-body text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] sm:w-52 sm:shrink-0"
            />
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="min-w-0 flex-1 rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-4 py-3 font-body text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="rg-btn-primary shrink-0 disabled:opacity-60"
            >
              {status === 'loading' ? 'Signing up…' : 'Subscribe'}
            </button>
          </div>
          {message && (
            <p className={`mt-3 text-center font-body text-sm ${status === 'error' ? 'text-red-600' : 'text-[var(--color-text-secondary)]'}`}>
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
