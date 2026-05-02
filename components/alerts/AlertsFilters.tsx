'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const PROGRAMS = [
  { label: 'All Programs', value: '' },
  { label: 'Chase Ultimate Rewards', value: 'chase' },
  { label: 'Amex Membership Rewards', value: 'amex' },
  { label: 'Citi ThankYou', value: 'citi' },
  { label: 'Capital One Venture', value: 'capital_one' },
  { label: 'World of Hyatt', value: 'hyatt' },
  { label: 'Marriott Bonvoy', value: 'marriott' },
  { label: 'Hilton Honors', value: 'hilton' },
  { label: 'IHG One Rewards', value: 'ihg' },
  { label: 'United MileagePlus', value: 'united' },
  { label: 'Delta SkyMiles', value: 'delta' },
  { label: 'American AAdvantage', value: 'aa' },
  { label: 'Southwest Rapid Rewards', value: 'southwest' },
  { label: 'Air France/KLM Flying Blue', value: 'flying_blue' },
]

const TYPES = [
  { label: 'All Types', value: '' },
  { label: 'Transfer Bonus', value: 'transfer_bonus' },
  { label: 'Limited Time Offer', value: 'limited_time_offer' },
  { label: 'Award Availability', value: 'award_availability' },
  { label: 'Status Promo', value: 'status_promo' },
  { label: 'Glitch', value: 'glitch' },
  { label: 'Devaluation', value: 'devaluation' },
  { label: 'Program Change', value: 'program_change' },
  { label: 'Partner Change', value: 'partner_change' },
  { label: 'Category Change', value: 'category_change' },
  { label: 'Earn Rate Change', value: 'earn_rate_change' },
  { label: 'Status Change', value: 'status_change' },
  { label: 'Policy Change', value: 'policy_change' },
  { label: 'Sweet Spot', value: 'sweet_spot' },
  { label: 'Industry News', value: 'industry_news' },
]

export default function AlertsFilters({
  program,
  type,
}: {
  program: string | null
  type: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      const qs = params.toString()
      router.push(`/alerts${qs ? `?${qs}` : ''}`)
    },
    [router, searchParams]
  )

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      <select
        value={program ?? ''}
        onChange={(e) => updateFilter('program', e.target.value)}
        className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-3 py-2 font-ui text-base md:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
      >
        {PROGRAMS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>

      <select
        value={type ?? ''}
        onChange={(e) => updateFilter('type', e.target.value)}
        className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-3 py-2 font-ui text-base md:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
      >
        {TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {(program || type) && (
        <button
          type="button"
          onClick={() => router.push('/alerts')}
          className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] px-3 py-2 font-ui text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
