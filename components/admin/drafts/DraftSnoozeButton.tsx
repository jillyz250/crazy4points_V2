/**
 * DraftSnoozeButton — dropdown picker with 1d / 7d / 14d / 30d presets + a
 * custom calendar date input. Mirrors the Triage SnoozeButton, but posts to
 * snoozeVariantAction (content_variants) instead of snoozeIntel.
 *
 * On selection, a hidden form runs the server action; the row drops out of
 * "Needs review" and reappears under the "Snoozed" chip until it wakes.
 */
'use client'

import { useState, useRef, useEffect } from 'react'
import { snoozeVariantAction } from '@/app/admin/(protected)/drafts/actions'

export function DraftSnoozeButton({ variantId }: { variantId: string }) {
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
    { label: '7 days', days: 7 },
    { label: '14 days', days: 14 },
    { label: '30 days', days: 30 },
  ]

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="admin-btn admin-btn-ghost admin-btn-sm"
      >
        Snooze ▾
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
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
              action={snoozeVariantAction}
              onSubmit={() => setOpen(false)}
            >
              <input type="hidden" name="variant_id" value={variantId} />
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
            action={snoozeVariantAction}
            onSubmit={() => setOpen(false)}
            style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem 0.625rem' }}
          >
            <input type="hidden" name="variant_id" value={variantId} />
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
                fontSize: '1rem',
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
