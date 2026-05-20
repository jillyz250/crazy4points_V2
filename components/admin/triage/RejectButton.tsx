/**
 * RejectButton — dropdown picker with preset rejection reasons.
 *
 * Mirrors the SnoozeButton pattern. On click opens a popover with preset
 * reason buttons; submitting fires the dismissCandidate server action with
 * the chosen rejected_reason. "Other..." opens an inline text input.
 */
'use client'

import { useState, useRef, useEffect } from 'react'
import { dismissCandidate } from '@/app/admin/(protected)/triage/actions'

const PRESETS: Array<{ value: string; label: string }> = [
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'low-signal', label: 'Low signal' },
  { value: 'wrong-program', label: 'Wrong program' },
  { value: 'off-brand', label: 'Off-brand' },
  { value: 'not-actionable', label: 'Not actionable' },
]

export function RejectButton({ intelId }: { intelId: string }) {
  const [open, setOpen] = useState(false)
  const [otherOpen, setOtherOpen] = useState(false)
  const [customText, setCustomText] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setOtherOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          padding: '0.5rem 0.875rem',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          background: 'transparent',
          color: 'var(--admin-text-muted)',
          border: '1px solid var(--admin-border)',
          borderRadius: 'var(--admin-radius)',
          cursor: 'pointer',
        }}
      >
        Reject ▾
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 50,
            minWidth: '13rem',
            background: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            borderRadius: 'var(--admin-radius)',
            boxShadow: 'var(--admin-shadow)',
            padding: '0.375rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.125rem',
          }}
        >
          {PRESETS.map((p) => (
            <form
              key={p.value}
              action={dismissCandidate}
              onSubmit={() => setOpen(false)}
            >
              <input type="hidden" name="intel_id" value={intelId} />
              <input type="hidden" name="rejected_reason" value={p.value} />
              <button
                type="submit"
                role="menuitem"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.375rem 0.625rem',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  background: 'transparent',
                  color: 'var(--admin-text)',
                  border: 'none',
                  borderRadius: 'var(--admin-radius)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--admin-surface-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {p.label}
              </button>
            </form>
          ))}
          <hr
            style={{
              border: 'none',
              borderTop: '1px solid var(--admin-border)',
              margin: '0.25rem 0',
            }}
          />
          {!otherOpen ? (
            <button
              type="button"
              onClick={() => setOtherOpen(true)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.375rem 0.625rem',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                background: 'transparent',
                color: 'var(--admin-text-muted)',
                border: 'none',
                borderRadius: 'var(--admin-radius)',
                cursor: 'pointer',
              }}
            >
              Other…
            </button>
          ) : (
            <form
              action={dismissCandidate}
              onSubmit={() => {
                setOpen(false)
                setOtherOpen(false)
                setCustomText('')
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.25rem 0.625rem' }}
            >
              <input type="hidden" name="intel_id" value={intelId} />
              <input
                type="text"
                name="rejected_reason"
                required
                autoFocus
                placeholder="reason..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                maxLength={500}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.8125rem',
                  padding: '0.25rem 0.375rem',
                  border: '1px solid var(--admin-border)',
                  borderRadius: 'var(--admin-radius)',
                  background: 'var(--admin-surface)',
                  color: 'var(--admin-text)',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.25rem 0.625rem',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: 'var(--color-chip-red)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--admin-radius)',
                  cursor: 'pointer',
                }}
              >
                Reject with reason
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
