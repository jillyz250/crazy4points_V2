'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { Program } from '@/utils/supabase/queries'

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

interface Props {
  programs: Pick<Program, 'id' | 'name' | 'slug' | 'type'>[]
  selectedProgram: string | null
  selectedType: string | null
}

export default function AlertsFiltersSB({ programs, selectedProgram, selectedType }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      const qs = params.toString()
      router.push(`/alerts${qs ? `?${qs}` : ''}`)
    },
    [router, searchParams]
  )

  const hasFilters = !!(selectedProgram || selectedType)

  const selectCls =
    'rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-3 py-2 font-ui text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none'

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      <select
        value={selectedProgram ?? ''}
        onChange={(e) => updateFilter('program', e.target.value)}
        className={selectCls}
      >
        <option value="">All Programs</option>
        {programs.map((p) => (
          <option key={p.id} value={p.slug}>{p.name}</option>
        ))}
      </select>

      <select
        value={selectedType ?? ''}
        onChange={(e) => updateFilter('type', e.target.value)}
        className={selectCls}
      >
        {TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {hasFilters && (
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
