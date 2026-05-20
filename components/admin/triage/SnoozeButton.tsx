/**
 * SnoozeButton — dropdown picker with 1d / 3d / 1w / custom date.
 *
 * On click, opens a small popover. On selection, posts to /api/triage/snooze
 * via a hidden form that runs the snoozeIntel server action.
 *
 * Lives next to the existing Write / Reject buttons in the Triage row.
 */
'use client'

import { useState, useRef, useEffect } from 'react'
import { snoozeIntel } from '@/app/admin/(protected)/triage/actions'

export function SnoozeButton({ intelId }: { intelId: string }) {
  const [open, setOpen] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Click-outside closes the popover.
  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const presets = [
    { label: '1 day', days: 1 },
    { label: '3 days', days: 3 },
    { label: '1 week', days: 7 },
  ]

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
        Snooze ▾
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 50,
            minWidth: '12rem',
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
          {presets.map((p) => (
            <form
              key={p.label}
              action={snoozeIntel}
              onSubmit={() => setOpen(false)}
            >
              <input type="hidden" name="intel_id" value={intelId} />
              <input
                type="hidden"
                name="snoozed_until"
                value={new Date(Date.now() + p.days * 24 * 60 * 60 * 1000).toISOString()}
              />
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
          <form
            action={snoozeIntel}
            onSubmit={() => setOpen(false)}
            style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem 0.625rem' }}
          >
            <input type="hidden" name="intel_id" value={intelId} />
            <input
              type="date"
              name="snoozed_until"
              required
              min={new Date().toISOString().slice(0, 10)}
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              style={{
                flex: 1,
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
                background: 'var(--admin-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--admin-radius)',
                cursor: 'pointer',
              }}
            >
              Go
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
