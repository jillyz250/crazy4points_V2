'use client'

import { useState, useTransition } from 'react'
import {
  deletePartnerRedemptionAction,
  markVerifiedTodayAction,
  updatePartnerRedemptionAction,
} from './actions'
import type {
  PartnerRedemptionWithPrograms,
  PricingModel,
  RedemptionCabin,
  RedemptionConfidence,
} from '@/utils/supabase/queries'

type ProgramOption = { id: string; slug: string; name: string }

const CABINS: RedemptionCabin[] = ['Economy', 'Premium Economy', 'Business', 'First']
const MODELS: PricingModel[] = ['fixed', 'dynamic', 'hybrid']
const CONFIDENCE: RedemptionConfidence[] = ['HIGH', 'MED', 'LOW']

function formatCost(low: number | null, high: number | null, model: PricingModel): string {
  if (low === null && high === null) return 'TBD'
  const fmt = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
    return String(n)
  }
  if (low !== null && high !== null && low !== high) return `${fmt(low)}–${fmt(high)}`
  const single = low ?? high!
  return model === 'dynamic' ? `~${fmt(single)}` : fmt(single)
}

const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  fontSize: '0.8125rem',
  borderBottom: '1px solid var(--admin-border, #e5e7eb)',
  verticalAlign: 'top',
}

const thStyle: React.CSSProperties = {
  ...tdStyle,
  fontSize: '0.6875rem',
  fontWeight: 700,
  textAlign: 'left',
  color: 'var(--admin-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: 'var(--admin-bg-subtle, #f9fafb)',
}

export default function PartnerRedemptionsTable({
  rows,
  currencies,
  carriers,
}: {
  rows: PartnerRedemptionWithPrograms[]
  currencies: ProgramOption[]
  carriers: ProgramOption[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null)

  if (rows.length === 0) {
    return (
      <div className="admin-card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
        No partner redemptions yet. Click <strong>+ Add Redemption</strong> above to add your first.
      </div>
    )
  }

  return (
    <div className="admin-card" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr>
            <th style={thStyle}>Currency</th>
            <th style={thStyle}>Carrier</th>
            <th style={thStyle}>Cabin</th>
            <th style={thStyle}>Route / region</th>
            <th style={thStyle}>Cost</th>
            <th style={thStyle}>Model</th>
            <th style={thStyle}>Conf.</th>
            <th style={thStyle}>Verified</th>
            <th style={thStyle}>Notes</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) =>
            editingId === r.id ? (
              <EditRow
                key={r.id}
                row={r}
                currencies={currencies}
                carriers={carriers}
                onCancel={() => setEditingId(null)}
                onSaved={() => setEditingId(null)}
              />
            ) : (
              <ViewRow
                key={r.id}
                row={r}
                onEdit={() => setEditingId(r.id)}
              />
            )
          )}
        </tbody>
      </table>
    </div>
  )
}

function ViewRow({
  row,
  onEdit,
}: {
  row: PartnerRedemptionWithPrograms
  onEdit: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    if (!confirm('Delete this redemption? This cannot be undone.')) return
    startTransition(async () => {
      const result = await deletePartnerRedemptionAction(row.id)
      if (result.error) setError(result.error)
    })
  }

  const handleVerify = () => {
    startTransition(async () => {
      const result = await markVerifiedTodayAction(row.id)
      if (result.error) setError(result.error)
    })
  }

  const cost = formatCost(row.cost_miles_low, row.cost_miles_high, row.pricing_model)
  const isInactive = !row.is_active

  return (
    <tr style={{ opacity: isInactive ? 0.5 : 1 }}>
      <td style={tdStyle}>{row.currency_program?.name ?? '—'}</td>
      <td style={tdStyle}>{row.operating_carrier?.name ?? '—'}</td>
      <td style={tdStyle}>{row.cabin}</td>
      <td style={tdStyle}>{row.region_or_route}</td>
      <td style={tdStyle}>{cost}</td>
      <td style={tdStyle}>{row.pricing_model}</td>
      <td style={tdStyle}>
        <span
          style={{
            display: 'inline-block',
            padding: '0.0625rem 0.375rem',
            borderRadius: '9999px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            background:
              row.confidence === 'HIGH'
                ? 'rgba(16,185,129,0.12)'
                : row.confidence === 'LOW'
                  ? 'rgba(239,68,68,0.12)'
                  : 'rgba(217,119,6,0.12)',
            color:
              row.confidence === 'HIGH'
                ? '#047857'
                : row.confidence === 'LOW'
                  ? '#b91c1c'
                  : '#92400e',
          }}
        >
          {row.confidence}
        </span>
      </td>
      <td style={tdStyle}>{row.last_verified ?? '—'}</td>
      <td style={{ ...tdStyle, maxWidth: '14rem' }}>
        <span
          style={{
            display: 'block',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={row.notes ?? ''}
        >
          {row.notes ?? ''}
        </span>
      </td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onEdit}
            className="admin-btn admin-btn-ghost admin-btn-sm"
            disabled={isPending}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleVerify}
            className="admin-btn admin-btn-ghost admin-btn-sm"
            disabled={isPending}
            title="Mark verified today"
          >
            ✓ Today
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="admin-btn admin-btn-ghost admin-btn-sm"
            disabled={isPending}
            style={{ color: 'var(--admin-danger, #b91c1c)' }}
          >
            Delete
          </button>
        </div>
        {error && (
          <div style={{ color: 'var(--admin-danger)', fontSize: '0.6875rem', marginTop: '0.25rem' }}>{error}</div>
        )}
      </td>
    </tr>
  )
}

function EditRow({
  row,
  currencies,
  carriers,
  onCancel,
  onSaved,
}: {
  row: PartnerRedemptionWithPrograms
  currencies: ProgramOption[]
  carriers: ProgramOption[]
  onCancel: () => void
  onSaved: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const inputStyle: React.CSSProperties = { width: '100%' }

  return (
    <tr>
      <td colSpan={10} style={{ padding: '0.75rem', background: 'var(--admin-bg-subtle, #f9fafb)' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              const result = await updatePartnerRedemptionAction(row.id, fd)
              if (result.error) setError(result.error)
              else onSaved()
            })
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))',
            gap: '0.5rem',
            alignItems: 'end',
          }}
        >
          <select name="currency_program_id" defaultValue={row.currency_program_id} className="admin-input" style={inputStyle}>
            {currencies.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select name="operating_carrier_id" defaultValue={row.operating_carrier_id} className="admin-input" style={inputStyle}>
            {carriers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select name="cabin" defaultValue={row.cabin} className="admin-input" style={inputStyle}>
            {CABINS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input name="region_or_route" defaultValue={row.region_or_route} className="admin-input" style={inputStyle} />
          <select name="pricing_model" defaultValue={row.pricing_model} className="admin-input" style={inputStyle}>
            {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input name="cost_miles_low" type="number" min="0" defaultValue={row.cost_miles_low ?? ''} className="admin-input" style={inputStyle} placeholder="low" />
          <input name="cost_miles_high" type="number" min="0" defaultValue={row.cost_miles_high ?? ''} className="admin-input" style={inputStyle} placeholder="high" />
          <select name="confidence" defaultValue={row.confidence} className="admin-input" style={inputStyle}>
            {CONFIDENCE.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input name="last_verified" type="date" defaultValue={row.last_verified ?? ''} className="admin-input" style={inputStyle} />
          <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <input name="is_active" type="checkbox" defaultChecked={row.is_active} />
            Active
          </label>
          <textarea name="notes" defaultValue={row.notes ?? ''} className="admin-input" style={{ ...inputStyle, gridColumn: '1 / -1' }} rows={2} />
          {error && (
            <div style={{ gridColumn: '1 / -1', color: 'var(--admin-danger)', fontSize: '0.75rem' }}>{error}</div>
          )}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={isPending} className="admin-btn admin-btn-primary admin-btn-sm">
              {isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={onCancel} disabled={isPending} className="admin-btn admin-btn-ghost admin-btn-sm">
              Cancel
            </button>
          </div>
        </form>
      </td>
    </tr>
  )
}
