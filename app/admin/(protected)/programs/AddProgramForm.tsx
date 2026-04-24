'use client'

import { useState, useTransition, useRef } from 'react'
import { createProgramAction } from './actions'

const TYPES: Array<{ value: string; label: string }> = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'airline', label: 'Airline' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'car_rental', label: 'Car Rental' },
  { value: 'cruise', label: 'Cruise' },
  { value: 'shopping_portal', label: 'Shopping Portal' },
  { value: 'travel_portal', label: 'Travel Portal' },
  { value: 'lounge_network', label: 'Lounge Network' },
  { value: 'ota', label: 'OTA' },
]

const labelStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  color: 'var(--admin-text-muted)',
  fontWeight: 700,
  marginBottom: '0.25rem',
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

export default function AddProgramForm() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-btn admin-btn-secondary admin-btn-sm"
      >
        + Add Program
      </button>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          const result = await createProgramAction(fd)
          if (result.error) {
            setError(result.error)
          } else {
            formRef.current?.reset()
            setOpen(false)
          }
        })
      }}
      className="admin-card"
      style={{
        padding: '1rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
        gap: '0.75rem',
        alignItems: 'end',
      }}
    >
      <div>
        <label style={labelStyle}>Slug *</label>
        <input name="slug" required placeholder="atmos" className="admin-input" />
      </div>
      <div>
        <label style={labelStyle}>Name *</label>
        <input name="name" required placeholder="Atmos Rewards" className="admin-input" />
      </div>
      <div>
        <label style={labelStyle}>Type *</label>
        <select name="type" required defaultValue="" className="admin-input">
          <option value="" disabled>Select…</option>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Tier</label>
        <input name="tier" placeholder="optional" className="admin-input" />
      </div>
      <div>
        <label style={labelStyle}>Monitor</label>
        <select name="monitor_tier" defaultValue="" className="admin-input">
          <option value="">—</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={labelStyle}>Program URL</label>
        <input name="program_url" type="url" placeholder="https://…" className="admin-input" />
      </div>
      {error && (
        <div style={{ gridColumn: '1 / -1', color: 'var(--admin-danger)', fontSize: '0.8125rem' }}>{error}</div>
      )}
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
        <button type="submit" disabled={isPending} className="admin-btn admin-btn-primary admin-btn-sm">
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          disabled={isPending}
          className="admin-btn admin-btn-ghost admin-btn-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
