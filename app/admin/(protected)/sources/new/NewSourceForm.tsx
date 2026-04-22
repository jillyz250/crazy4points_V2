'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSourceAction } from './actions'

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

export default function NewSourceForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await createSourceAction(formData)
      if (result && !result.ok) {
        setError(result.error)
        setSubmitting(false)
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
        router.push('/admin/sources')
        return
      }
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
      <div style={fieldStyle}>
        <label htmlFor="name" style={labelStyle}>Name *</label>
        <input id="name" name="name" type="text" required style={inputStyle} placeholder="One Mile at a Time" />
      </div>

      <div style={fieldStyle}>
        <label htmlFor="url" style={labelStyle}>URL *</label>
        <input id="url" name="url" type="url" required style={inputStyle} placeholder="https://" />
      </div>

      <div style={fieldStyle}>
        <label htmlFor="type" style={labelStyle}>Type *</label>
        <select id="type" name="type" required defaultValue="blog" style={inputStyle}>
          <option value="official_partner">Official Partner</option>
          <option value="blog">Blog</option>
          <option value="community">Community</option>
          <option value="social">Social</option>
          <option value="email">Email</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label htmlFor="tier" style={labelStyle}>Tier *</label>
        <select id="tier" name="tier" required defaultValue="3" style={inputStyle}>
          <option value="1">1 — Official / Highest Trust</option>
          <option value="2">2 — Known Reliable</option>
          <option value="3">3 — Standard</option>
          <option value="4">4 — Low Trust</option>
          <option value="5">5 — Experimental</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label htmlFor="scrape_frequency" style={labelStyle}>Scrape Frequency</label>
        <select id="scrape_frequency" name="scrape_frequency" defaultValue="daily" style={inputStyle}>
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label htmlFor="notes" style={labelStyle}>Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="Anything worth remembering about this source"
        />
      </div>

      <div style={fieldStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
          <input
            type="checkbox"
            name="use_firecrawl"
            style={{ accentColor: 'var(--color-primary)' }}
          />
          Use Firecrawl for this source
        </label>
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
          {submitting ? 'Saving…' : 'Create Source'}
        </button>
        <a
          href="/admin/sources"
          style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textDecoration: 'underline' }}
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
