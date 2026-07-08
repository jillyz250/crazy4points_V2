'use client'

import { useState } from 'react'
import { track } from '@/lib/analytics'

type Props = {
  /** Public path to the PDF, e.g. /downloads/csr-2026-benefits-checklist.pdf */
  pdfHref: string
  /** Suggested filename when the user saves it. */
  downloadName: string
  /** Short label describing which checklist this is (for analytics). */
  checklistId: string
}

/**
 * Free-download-with-signup-nudge card for a card-benefits checklist.
 * The PDF is NEVER gated — the download works immediately. The email capture
 * sits beside it as an optional nudge and posts to /api/subscribe with the
 * 'tools_checklist' source. Bot defenses (honeypot named subject_hp, mapped to
 * the `website` field the API treats as a honeypot) mirror the site's other
 * signup forms.
 */
export default function ChecklistDownloadCard({ pdfHref, downloadName, checklistId }: Props) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  function handleDownload() {
    track('checklist_download', { checklist: checklistId })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const referrerPath = typeof window !== 'undefined' ? window.location.pathname : null
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName, website, source: 'tools_checklist', referrerPath }),
    })
    const data = await res.json()

    if (res.ok) {
      setStatus('success')
      setMessage("You're in! Check your inbox for a welcome email.")
      track('newsletter_signup', { surface: 'tools_checklist', checklist: checklistId })
      setEmail('')
      setFirstName('')
    } else {
      setStatus('error')
      setMessage(data.error || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
      {/* Primary action — always available, never gated */}
      <a
        href={pdfHref}
        download={downloadName}
        onClick={handleDownload}
        className="rg-btn-primary flex w-full items-center justify-center gap-2 text-center"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
          <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
          <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
        </svg>
        Download the free PDF
      </a>
      <p className="mt-2 text-center font-body text-xs text-[var(--color-text-secondary)]">
        Fillable &amp; printable · works in Preview, Acrobat &amp; phone PDF apps · free, no email required
      </p>

      {/* Optional nudge */}
      <div className="mt-6 border-t border-[var(--color-border-soft)] pt-6">
        {status === 'success' ? (
          <p className="text-center font-body text-sm text-[var(--color-text-secondary)]">
            <span className="font-display text-lg font-semibold text-[var(--color-primary)]">Welcome aboard!</span>
            <br />
            {message}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <p className="text-center font-body text-sm text-[var(--color-text-secondary)]">
              Want the next one? Get new checklists, deals &amp; points tips in your inbox.
            </p>
            {/* Honeypot — hidden from humans, bots fill it. Do not remove. */}
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
                  onChange={e => setWebsite(e.target.value)}
                />
              </label>
            </div>
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
              className="w-full rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-4 py-3 font-body text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="min-w-0 flex-1 rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-4 py-3 font-body text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="rg-btn-secondary shrink-0 disabled:opacity-60"
              >
                {status === 'loading' ? 'Joining…' : 'Join free'}
              </button>
            </div>
            {message && status === 'error' && (
              <p className="text-center font-body text-sm text-red-600">{message}</p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
