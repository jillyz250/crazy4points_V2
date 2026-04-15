'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAlertAction } from './actions'
import type { Program, ProgramType } from '@/utils/supabase/queries'

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
  { value: 'transfer_bonus', label: 'Transfer Bonus' },
  { value: 'award_availability', label: 'Award Availability' },
  { value: 'limited_time_offer', label: 'Limited Time Offer' },
  { value: 'sweet_spot', label: 'Sweet Spot' },
  { value: 'program_change', label: 'Program Change' },
  { value: 'status_promo', label: 'Status Promo' },
  { value: 'glitch', label: 'Glitch' },
  { value: 'devaluation', label: 'Devaluation' },
  { value: 'partner_change', label: 'Partner Change' },
  { value: 'category_change', label: 'Category Change' },
  { value: 'earn_rate_change', label: 'Earn Rate Change' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'policy_change', label: 'Policy Change' },
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

interface Props {
  programs: Pick<Program, 'id' | 'name' | 'type'>[]
}

export default function NewAlertForm({ programs }: Props) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

  function toggleTag(id: string) {
    setSelectedTags(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
      await createAlertAction(formData)
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
      {/* Title */}
      <div style={fieldStyle}>
        <label htmlFor="title" style={labelStyle}>Title *</label>
        <input id="title" name="title" type="text" required style={inputStyle} />
      </div>

      {/* Type */}
      <div style={fieldStyle}>
        <label htmlFor="type" style={labelStyle}>Alert Type *</label>
        <select id="type" name="type" required style={inputStyle}>
          {ALERT_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div style={fieldStyle}>
        <label htmlFor="status" style={labelStyle}>Status *</label>
        <select id="status" name="status" defaultValue="draft" style={inputStyle}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Program */}
      <div style={fieldStyle}>
        <label htmlFor="primary_program_id" style={labelStyle}>Program</label>
        <select id="primary_program_id" name="primary_program_id" style={inputStyle}>
          <option value="">— None —</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Action Type */}
      <div style={fieldStyle}>
        <label htmlFor="action_type" style={labelStyle}>Action Type *</label>
        <select id="action_type" name="action_type" required style={inputStyle}>
          {ACTION_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div style={fieldStyle}>
        <label htmlFor="description" style={labelStyle}>Description *</label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
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
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Start Date */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <label htmlFor="start_date" style={labelStyle}>Start Date *</label>
          <input id="start_date" name="start_date" type="date" required style={inputStyle} />
        </div>
        <div>
          <label htmlFor="end_date" style={labelStyle}>End Date</label>
          <input id="end_date" name="end_date" type="date" style={inputStyle} />
        </div>
      </div>

      {/* Confidence Level */}
      <div style={fieldStyle}>
        <label htmlFor="confidence_level" style={labelStyle}>Confidence Level *</label>
        <select id="confidence_level" name="confidence_level" defaultValue="medium" style={inputStyle}>
          <option value="high">High — Confirmed</option>
          <option value="medium">Medium — Probable</option>
          <option value="low">Low — Rumored</option>
        </select>
      </div>

      {/* Source URL */}
      <div style={fieldStyle}>
        <label htmlFor="source_url" style={labelStyle}>Source URL</label>
        <input id="source_url" name="source_url" type="url" style={inputStyle} placeholder="https://" />
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
          {submitting ? 'Saving…' : 'Create Alert'}
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
