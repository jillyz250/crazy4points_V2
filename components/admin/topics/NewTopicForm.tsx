'use client'

import { useState, useTransition } from 'react'
import { createTopicAction } from '@/app/admin/(protected)/topics/actions'
import { MultiSelectChecklist, type MultiSelectOption } from './MultiSelectChecklist'

const TOPIC_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'promo', label: 'Promo' },
  { value: 'transfer_bonus', label: 'Transfer bonus' },
  { value: 'signup_bonus', label: 'Signup bonus' },
  { value: 'referral_bonus', label: 'Referral bonus' },
  { value: 'retention_offer', label: 'Retention offer' },
  { value: 'limited_time_offer', label: 'Limited-time offer' },
  { value: 'shopping_portal_bonus', label: 'Shopping portal bonus' },
  { value: 'award_sale', label: 'Award sale' },
  { value: 'companion_pass', label: 'Companion pass' },
  { value: 'dining_bonus', label: 'Dining bonus' },
  { value: 'milestone_bonus', label: 'Milestone bonus' },
  { value: 'card_credit', label: 'Card credit' },
  { value: 'card_refresh', label: 'Card refresh' },
  { value: 'fee_change', label: 'Fee change' },
  { value: 'devaluation', label: 'Devaluation' },
  { value: 'sweet_spot', label: 'Sweet spot' },
  { value: 'program_change', label: 'Program change' },
  { value: 'partner_change', label: 'Partner change' },
  { value: 'category_change', label: 'Category change' },
  { value: 'earn_rate_change', label: 'Earn-rate change' },
  { value: 'status_change', label: 'Status change' },
  { value: 'status_promo', label: 'Status promo' },
  { value: 'policy_change', label: 'Policy change' },
  { value: 'industry_news', label: 'Industry news' },
  { value: 'award_availability', label: 'Award availability' },
  { value: 'glitch', label: 'Glitch' },
  { value: 'other', label: 'Other' },
]

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  marginBottom: '0.25rem',
  display: 'block',
  color: 'var(--color-text-secondary)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.625rem',
  fontSize: '1rem',
  border: '1px solid var(--color-border-soft)',
  borderRadius: 'var(--radius-ui)',
  background: '#fff',
}

export default function NewTopicForm({
  programs,
  cards,
}: {
  programs: MultiSelectOption[]
  cards: MultiSelectOption[]
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createTopicAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '50rem' }}
    >
      {error && (
        <div
          style={{
            padding: '0.75rem',
            background: '#fdf3f3',
            border: '1px solid #f5c2c2',
            borderRadius: 'var(--radius-ui)',
            color: '#8a1f1f',
          }}
        >
          {error}
        </div>
      )}

      <div>
        <label style={labelStyle}>Title</label>
        <input name="title" required style={inputStyle} placeholder="e.g. Amex MR transfer bonus: 30% to British Airways through July 15" />
      </div>

      <div>
        <label style={labelStyle}>Slug (optional — auto-generated from title if blank)</label>
        <input name="slug" style={inputStyle} placeholder="e.g. amex-ba-30-jul-2026" />
      </div>

      <div>
        <label style={labelStyle}>Summary (one-liner; optional)</label>
        <input name="summary" style={inputStyle} placeholder="Editorial summary visible in topic list." />
      </div>

      <div>
        <label style={labelStyle}>Topic type</label>
        <select name="topic_type" required style={inputStyle} defaultValue="">
          <option value="" disabled>
            Pick a type…
          </option>
          {TOPIC_TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>End date (when the offer / promo expires; blank = evergreen)</label>
        <input name="end_date" type="date" style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Source URLs (one per line, issuer-domain only)</label>
        <textarea
          name="source_urls"
          style={{ ...inputStyle, minHeight: '5rem', fontFamily: 'monospace', fontSize: '0.875rem' }}
          placeholder={'https://www.americanexpress.com/...\nhttps://news.americanexpress.com/...'}
        />
      </div>

      <div>
        <label style={labelStyle}>Source markdown (verified content from issuer pages — paste full text)</label>
        <textarea
          name="source_markdown"
          style={{ ...inputStyle, minHeight: '16rem', fontFamily: 'monospace', fontSize: '0.875rem' }}
          placeholder="Paste the verified issuer-page text or press release here. The Haiku extractor will pull atomic claims from this, and every claim must have an exact substring quote from this text."
        />
      </div>

      <div>
        <label style={labelStyle}>Programs (multi-select)</label>
        <MultiSelectChecklist name="programs" options={programs} placeholder="Search programs..." />
      </div>

      <div>
        <label style={labelStyle}>Cards (multi-select)</label>
        <MultiSelectChecklist name="cards" options={cards} placeholder="Search cards..." />
      </div>

      <div>
        <label style={labelStyle}>Created by</label>
        <input name="created_by" defaultValue="admin" style={inputStyle} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" disabled={isPending} className="rg-btn-primary">
          {isPending ? 'Creating…' : 'Create topic'}
        </button>
      </div>
    </form>
  )
}
