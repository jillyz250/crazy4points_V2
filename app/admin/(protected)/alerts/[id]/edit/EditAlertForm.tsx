'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateAlertAction } from './actions'
import type { Alert, Program, ProgramType } from '@/utils/supabase/queries'
import FactCheckWarnings from '@/components/admin/FactCheckWarnings'

const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  credit_card: 'Credit Card',
  airline: 'Airline',
  hotel: 'Hotel',
  car_rental: 'Car Rental',
  cruise: 'Cruise',
  shopping_portal: 'Shopping Portal',
  travel_portal: 'Travel Portal',
  lounge_network: 'Lounge Network',
  ota: 'OTA',
}

const ALERT_TYPES = [
  // ── Earning & Bonuses ──
  { value: 'signup_bonus', label: 'Sign-Up Bonus' },
  { value: 'transfer_bonus', label: 'Transfer Bonus' },
  { value: 'referral_bonus', label: 'Referral Bonus' },
  { value: 'milestone_bonus', label: 'Milestone Bonus' },
  { value: 'shopping_portal_bonus', label: 'Shopping Portal Bonus' },
  { value: 'dining_bonus', label: 'Dining Bonus' },
  { value: 'point_purchase', label: 'Buy Points / Miles' },
  // ── Redemptions ──
  { value: 'award_availability', label: 'Award Availability' },
  { value: 'award_sale', label: 'Award Sale' },
  { value: 'sweet_spot', label: 'Sweet Spot' },
  { value: 'companion_pass', label: 'Companion Pass' },
  // ── Card Offers ──
  { value: 'limited_time_offer', label: 'Limited Time Offer' },
  { value: 'retention_offer', label: 'Retention Offer' },
  { value: 'card_credit', label: 'Card Credit / Perk' },
  { value: 'card_refresh', label: 'Card Refresh' },
  // ── Status & Promos ──
  { value: 'status_promo', label: 'Status Promo' },
  // ── Warnings ──
  { value: 'glitch', label: 'Glitch' },
  { value: 'devaluation', label: 'Devaluation' },
  { value: 'fee_change', label: 'Fee Change' },
  // ── Program Changes ──
  { value: 'program_change', label: 'Program Change' },
  { value: 'partner_change', label: 'Partner Change' },
  { value: 'category_change', label: 'Category Change' },
  { value: 'earn_rate_change', label: 'Earn Rate Change' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'policy_change', label: 'Policy Change' },
  // ── News ──
  { value: 'industry_news', label: 'Industry News' },
] as const

const ACTION_TYPES = [
  { value: 'book', label: 'Book Now' },
  { value: 'transfer', label: 'Transfer Points' },
  { value: 'apply', label: 'Apply for Card' },
  { value: 'monitor', label: 'Monitor This Deal' },
  { value: 'learn', label: 'Learn More' },
] as const

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--color-border-soft)',
  borderRadius: 'var(--radius-ui)',
  fontSize: '0.9375rem',
  fontFamily: 'var(--font-body)',
  background: 'var(--color-background)',
  color: 'var(--color-text-primary)',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.375rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-ui)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const fieldStyle: React.CSSProperties = {
  marginBottom: '1.25rem',
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  return iso.split('T')[0]
}

interface Props {
  alert: Alert
  programs: Pick<Program, 'id' | 'name' | 'type'>[]
  taggedProgramIds: string[]
}

export default function EditAlertForm({ alert, programs, taggedProgramIds }: Props) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(taggedProgramIds))

  function toggleTag(id: string) {
    setSelectedTags(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Group programs by type for display
  const grouped = programs.reduce<Record<string, typeof programs>>((acc, p) => {
    const key = p.type as string
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      await updateAlertAction(alert.id, formData)
    } catch (err) {
      // redirect() throws internally — ignore NEXT_REDIRECT
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
        router.push('/admin/alerts')
        return
      }
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
      {/* Preserve published_at so update action can keep it unchanged */}
      <input type="hidden" name="existing_published_at" value={alert.published_at ?? ''} />

      <div style={{ marginBottom: '1.25rem' }}>
        <FactCheckWarnings alertId={alert.id} claims={alert.fact_check_claims} />
      </div>

      {/* Title */}
      <div style={fieldStyle}>
        <label htmlFor="title" style={labelStyle}>Title *</label>
        <input id="title" name="title" type="text" required defaultValue={alert.title} style={inputStyle} />
      </div>

      {/* Summary */}
      <div style={fieldStyle}>
        <label htmlFor="summary" style={labelStyle}>Summary *</label>
        <input id="summary" name="summary" type="text" required defaultValue={alert.summary} style={inputStyle} />
      </div>

      {/* Type */}
      <div style={fieldStyle}>
        <label htmlFor="type" style={labelStyle}>Alert Type *</label>
        <select id="type" name="type" required defaultValue={alert.type} style={inputStyle}>
          {ALERT_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div style={fieldStyle}>
        <label htmlFor="status" style={labelStyle}>Status *</label>
        <select id="status" name="status" defaultValue={alert.status} style={inputStyle}>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending Review</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Program */}
      <div style={fieldStyle}>
        <label htmlFor="primary_program_id" style={labelStyle}>Program</label>
        <select id="primary_program_id" name="primary_program_id" defaultValue={alert.primary_program_id ?? ''} style={inputStyle}>
          <option value="">— None —</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Action Type */}
      <div style={fieldStyle}>
        <label htmlFor="action_type" style={labelStyle}>Action Type *</label>
        <select id="action_type" name="action_type" required defaultValue={alert.action_type} style={inputStyle}>
          {ACTION_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div style={fieldStyle}>
        <label htmlFor="description" style={labelStyle}>Description</label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={alert.description ?? ''}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* History Note */}
      <div style={fieldStyle}>
        <label htmlFor="history_note" style={labelStyle}>History Note</label>
        <textarea
          id="history_note"
          name="history_note"
          rows={2}
          placeholder="e.g. Last bonus was 50% in June 2025"
          defaultValue={alert.history_note ?? ''}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Start / End Date */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <label htmlFor="start_date" style={labelStyle}>Start Date</label>
          <input id="start_date" name="start_date" type="date" defaultValue={toDateInputValue(alert.start_date)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="end_date" style={labelStyle}>End Date</label>
          <input id="end_date" name="end_date" type="date" defaultValue={toDateInputValue(alert.end_date)} style={inputStyle} />
        </div>
      </div>

      {/* Confidence Level */}
      <div style={fieldStyle}>
        <label htmlFor="confidence_level" style={labelStyle}>Confidence Level *</label>
        <select id="confidence_level" name="confidence_level" defaultValue={alert.confidence_level} style={inputStyle}>
          <option value="high">High — Confirmed</option>
          <option value="medium">Medium — Probable</option>
          <option value="low">Low — Rumored</option>
        </select>
      </div>

      {/* Source URL */}
      <div style={fieldStyle}>
        <label htmlFor="source_url" style={labelStyle}>Source URL</label>
        <input id="source_url" name="source_url" type="url" defaultValue={alert.source_url ?? ''} style={inputStyle} placeholder="https://" />
      </div>

      {/* Tagged Programs */}
      <div style={{ ...fieldStyle, marginBottom: '1.5rem' }}>
        <div style={labelStyle}>Tag Programs</div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem', fontFamily: 'var(--font-body)' }}>
          Select all programs this alert is relevant to (United, Chase, El Al, etc.)
        </p>
        {Array.from(selectedTags).map(id => (
          <input key={id} type="hidden" name="tagged_program_ids" value={id} />
        ))}
        <div style={{
          border: '1px solid var(--color-border-soft)',
          borderRadius: 'var(--radius-card)',
          maxHeight: '280px',
          overflowY: 'auto',
          background: 'var(--color-background)',
        }}>
          {Object.entries(grouped).map(([type, progs]) => (
            <div key={type}>
              <div style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: 'var(--font-ui)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-secondary)',
                background: 'var(--color-background-soft)',
                borderBottom: '1px solid var(--color-border-soft)',
              }}>
                {PROGRAM_TYPE_LABELS[type as ProgramType] ?? type}
              </div>
              {progs.map(p => (
                <label key={p.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.375rem 0.75rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--color-border-soft)',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)',
                  background: selectedTags.has(p.id) ? '#f5eeff' : 'transparent',
                }}>
                  <input
                    type="checkbox"
                    checked={selectedTags.has(p.id)}
                    onChange={() => toggleTag(p.id)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          ))}
        </div>
        {selectedTags.size > 0 && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', marginTop: '0.5rem', fontFamily: 'var(--font-body)' }}>
            {selectedTags.size} program{selectedTags.size !== 1 ? 's' : ''} tagged
          </p>
        )}
      </div>

      {error && (
        <p style={{ color: '#c0392b', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button
          type="submit"
          disabled={submitting}
          className="rg-btn-primary"
          style={{ opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? 'Saving…' : 'Save Changes'}
        </button>
        <a
          href="/admin/alerts"
          style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textDecoration: 'underline' }}
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
