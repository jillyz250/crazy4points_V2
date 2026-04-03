'use client'

import Link from 'next/link'
import type { SanityAlert } from '@/lib/types'
import { getProgramName } from '@/lib/programs'

// Full literal class names — Tailwind v4 JIT does not support string interpolation
const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  transfer_bonus:      { label: 'Transfer Bonus',    cls: 'bg-[var(--color-background-soft)] text-[var(--color-primary)]' },
  limited_time_offer:  { label: 'Limited Offer',     cls: 'bg-red-50 text-red-700' },
  award_availability:  { label: 'Award Availability',cls: 'bg-blue-50 text-blue-700' },
  status_promo:        { label: 'Status Promo',      cls: 'bg-orange-50 text-orange-700' },
  glitch:              { label: 'Glitch',            cls: 'bg-yellow-50 text-yellow-800' },
  devaluation:         { label: 'Devaluation',       cls: 'bg-red-50 text-red-800' },
  program_change:      { label: 'Program Change',    cls: 'bg-amber-50 text-amber-700' },
  partner_change:      { label: 'Partner Change',    cls: 'bg-amber-50 text-amber-700' },
  category_change:     { label: 'Category Change',   cls: 'bg-amber-50 text-amber-700' },
  earn_rate_change:    { label: 'Earn Rate Change',  cls: 'bg-amber-50 text-amber-700' },
  status_change:       { label: 'Status Change',     cls: 'bg-amber-50 text-amber-700' },
  policy_change:       { label: 'Policy Change',     cls: 'bg-amber-50 text-amber-700' },
  sweet_spot:          { label: 'Sweet Spot',        cls: 'bg-green-50 text-green-700' },
  industry_news:       { label: 'Industry News',     cls: 'bg-slate-100 text-slate-600' },
}



function formatEndDate(endDate: string | null): string | null {
  if (!endDate) return null
  const end = new Date(endDate)
  const now = new Date()
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Expired'
  if (diffDays === 0) return 'Expires today'
  if (diffDays === 1) return 'Expires tomorrow'
  if (diffDays <= 7) return `Expires in ${diffDays} days`
  return `Expires ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export default function AlertCard({ alert }: { alert: SanityAlert }) {
  const badge = TYPE_BADGE[alert.type] ?? { label: alert.type, cls: 'bg-slate-100 text-slate-600' }
  const endLabel = formatEndDate(alert.endDate)
  const isExpired = endLabel === 'Expired'
  const isExpiringSoon = endLabel?.startsWith('Expires in') || endLabel === 'Expires today' || endLabel === 'Expires tomorrow'

  const visiblePrograms = alert.programs.slice(0, 3)
  const extraPrograms = alert.programs.length - 3

  return (
    <div className="group relative flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-md">
      {/* Full-bleed card link — sits behind interactive elements */}
      <Link
        href={`/alerts/${alert.slug.current}`}
        className="absolute inset-0 z-0 rounded-[var(--radius-card)]"
        aria-label={alert.title}
      />

      {/* Type badge */}
      <span className={`relative z-10 self-start rounded-full px-2.5 py-0.5 font-ui text-[10px] font-semibold uppercase tracking-[0.1em] ${badge.cls}`}>
        {badge.label}
      </span>

      {/* Title */}
      <h3 className="relative z-10 font-display text-base font-semibold leading-snug text-[var(--color-primary)] group-hover:underline">
        {alert.title}
      </h3>

      {/* Summary */}
      <p className="relative z-10 line-clamp-2 font-body text-sm text-[var(--color-text-secondary)]">
        {alert.summary}
      </p>

      {/* Programs — individual clickable pills */}
      {visiblePrograms.length > 0 && (
        <div className="relative z-10 flex flex-wrap gap-1.5">
          {visiblePrograms.map((slug) => (
            <Link
              key={slug}
              href={`/programs/${slug}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-full border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-2 py-0.5 font-ui text-[10px] font-medium text-[var(--color-primary)] hover:border-[var(--color-primary)]"
            >
              {getProgramName(slug)}
            </Link>
          ))}
          {extraPrograms > 0 && (
            <span className="rounded-full border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-2 py-0.5 font-ui text-[10px] font-medium text-[var(--color-text-secondary)]">
              +{extraPrograms} more
            </span>
          )}
        </div>
      )}

      <div className="relative z-10 mt-auto flex items-center justify-between gap-2 pt-1">
        {/* End date */}
        {endLabel && (
          <span className={`font-ui text-xs font-medium ${isExpired ? 'text-slate-400' : isExpiringSoon ? 'text-red-600' : 'text-[var(--color-text-secondary)]'}`}>
            {endLabel}
          </span>
        )}

      </div>
    </div>
  )
}
