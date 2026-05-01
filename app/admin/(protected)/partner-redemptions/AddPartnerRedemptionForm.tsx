'use client'

import { useRef, useState, useTransition } from 'react'
import { createPartnerRedemptionAction } from './actions'

type ProgramOption = { id: string; slug: string; name: string }

const labelStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  color: 'var(--admin-text-muted)',
  fontWeight: 700,
  marginBottom: '0.25rem',
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

export default function AddPartnerRedemptionForm({
  currencies,
  carriers,
}: {
  currencies: ProgramOption[]
  carriers: ProgramOption[]
}) {
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
        + Add Redemption
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
          const result = await createPartnerRedemptionAction(fd)
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
        gap: '0.75rem',
        alignItems: 'end',
      }}
    >
      <div>
        <label style={labelStyle}>Currency (miles spent) *</label>
        <select name="currency_program_id" required defaultValue="" className="admin-input">
          <option value="" disabled>Select…</option>
          {currencies.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Operating carrier *</label>
        <select name="operating_carrier_id" required defaultValue="" className="admin-input">
          <option value="" disabled>Select…</option>
          {carriers.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Cabin *</label>
        <select name="cabin" required defaultValue="" className="admin-input">
          <option value="" disabled>Select…</option>
          <option value="Economy">Economy</option>
          <option value="Premium Economy">Premium Economy</option>
          <option value="Business">Business</option>
          <option value="First">First</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Region or route *</label>
        <input name="region_or_route" required placeholder="HKG-JFK" className="admin-input" />
      </div>
      <div>
        <label style={labelStyle}>Pricing model *</label>
        <select name="pricing_model" required defaultValue="fixed" className="admin-input">
          <option value="fixed">Fixed</option>
          <option value="dynamic">Dynamic</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Cost low (miles)</label>
        <input name="cost_miles_low" type="number" min="0" placeholder="70000" className="admin-input" />
      </div>
      <div>
        <label style={labelStyle}>Cost high (miles)</label>
        <input name="cost_miles_high" type="number" min="0" placeholder="leave blank if fixed" className="admin-input" />
      </div>
      <div>
        <label style={labelStyle}>Confidence</label>
        <select name="confidence" defaultValue="MED" className="admin-input">
          <option value="HIGH">HIGH</option>
          <option value="MED">MED</option>
          <option value="LOW">LOW</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Last verified</label>
        <input name="last_verified" type="date" className="admin-input" />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={labelStyle}>Notes</label>
        <textarea
          name="notes"
          placeholder="Best availability via AA; no fuel surcharges"
          className="admin-input"
          rows={2}
        />
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
