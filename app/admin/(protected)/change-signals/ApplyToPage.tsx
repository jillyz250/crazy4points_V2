'use client'

import { useState, useTransition } from 'react'
import { draftQuirkForSignal, applyQuirkToProgram } from './actions'

/**
 * "Apply to page" — the human-in-the-loop control for turning a STANDING change
 * signal into a program-page quirk. Never auto-applies:
 *   1. Click "Apply to page" -> Haiku drafts a house-style quirk (server).
 *   2. The draft appears in an EDITABLE box for Jill to review/tweak.
 *   3. Confirm -> the approved text is appended to the program page.
 *
 * When the page already documents the change, the parent renders the subtle
 * "already on page" note instead and this control is not shown.
 */
export default function ApplyToPage({
  signalId,
  programSlug,
}: {
  signalId: string
  programSlug: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drafting, startDrafting] = useTransition()
  const [applying, startApplying] = useTransition()

  function handleDraft() {
    setError(null)
    startDrafting(async () => {
      const res = await draftQuirkForSignal(signalId)
      if (!res.ok) {
        setError(res.error ?? 'Could not draft the edit.')
        return
      }
      setDraft(res.draft ?? '')
      setOpen(true)
    })
  }

  function handleApply() {
    setError(null)
    startApplying(async () => {
      const res = await applyQuirkToProgram(signalId, draft ?? '')
      if (!res.ok) {
        setError(res.error ?? 'Could not apply the edit.')
        return
      }
      setDone(true)
      setOpen(false)
    })
  }

  if (done) {
    return (
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--admin-success, #197A4B)' }}>
        ✓ Added to page
      </span>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      {!open && (
        <button
          type="button"
          onClick={handleDraft}
          disabled={drafting}
          className="admin-btn admin-btn-primary"
          style={{ fontSize: '0.8125rem' }}
        >
          {drafting ? 'Drafting…' : 'Apply to page'}
        </button>
      )}

      {open && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            borderRadius: 'var(--radius-card, 0.75rem)',
            border: '1px solid color-mix(in srgb, var(--color-primary) 30%, var(--admin-border))',
            background: 'color-mix(in srgb, var(--color-primary) 5%, var(--admin-surface))',
          }}
        >
          <label
            htmlFor={`quirk-${signalId}`}
            style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--admin-text)' }}
          >
            Review the edit before it goes on the page
          </label>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            This bullet will be appended to <code>{programSlug}</code>&rsquo;s &ldquo;good to know&rdquo; quirks. Edit
            freely, then confirm. Nothing is written until you confirm.
          </p>
          <textarea
            id={`quirk-${signalId}`}
            value={draft ?? ''}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              fontSize: '1rem',
              fontFamily: 'var(--font-body, inherit)',
              lineHeight: 1.5,
              padding: '0.5rem 0.6rem',
              borderRadius: 'var(--radius-ui, 0.375rem)',
              border: '1px solid var(--admin-border)',
              background: 'var(--admin-surface)',
              color: 'var(--admin-text)',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleApply}
              disabled={applying}
              className="admin-btn admin-btn-primary"
              style={{ fontSize: '0.8125rem' }}
            >
              {applying ? 'Adding…' : 'Confirm & add to page'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setError(null)
              }}
              disabled={applying}
              className="admin-btn admin-btn-ghost"
              style={{ fontSize: '0.8125rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', color: 'var(--admin-danger, #B42318)', fontWeight: 500 }}>
          {error}
        </p>
      )}
    </div>
  )
}
