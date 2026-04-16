'use client'

import Link from 'next/link'
import type { AlertWithPrograms } from '@/utils/supabase/queries'

// Full literal class names — Tailwind v4 JIT does not support string interpolation
const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  // Earning & Bonuses
  signup_bonus:          { label: 'Sign-Up Bonus',        cls: 'bg-purple-50 text-purple-700' },
  transfer_bonus:        { label: 'Transfer Bonus',       cls: 'bg-[var(--color-background-soft)] text-[var(--color-primary)]' },
  referral_bonus:        { label: 'Referral Bonus',       cls: 'bg-purple-50 text-purple-600' },
  milestone_bonus:       { label: 'Milestone Bonus',      cls: 'bg-indigo-50 text-indigo-700' },
  shopping_portal_bonus: { label: 'Portal Bonus',         cls: 'bg-teal-50 text-teal-700' },
  dining_bonus:          { label: 'Dining Bonus',         cls: 'bg-orange-50 text-orange-600' },
  point_purchase:        { label: 'Buy Points',           cls: 'bg-cyan-50 text-cyan-700' },
  // Redemptions
  award_availability:    { label: 'Award Availability',   cls: 'bg-blue-50 text-blue-700' },
  award_sale:            { label: 'Award Sale',           cls: 'bg-blue-50 text-blue-800' },
  sweet_spot:            { label: 'Sweet Spot',           cls: 'bg-green-50 text-green-700' },
  companion_pass:        { label: 'Companion Pass',       cls: 'bg-green-50 text-green-800' },
  // Card Offers
  limited_time_offer:    { label: 'Limited Offer',        cls: 'bg-red-50 text-red-700' },
  retention_offer:       { label: 'Retention Offer',      cls: 'bg-rose-50 text-rose-700' },
  card_credit:           { label: 'Card Credit',          cls: 'bg-emerald-50 text-emerald-700' },
  card_refresh:          { label: 'Card Refresh',         cls: 'bg-violet-50 text-violet-700' },
  // Status
  status_promo:          { label: 'Status Promo',         cls: 'bg-orange-50 text-orange-700' },
  // Warnings
  glitch:                { label: 'Glitch',               cls: 'bg-yellow-50 text-yellow-800' },
  devaluation:           { label: 'Devaluation',          cls: 'bg-red-50 text-red-800' },
  fee_change:            { label: 'Fee Change',           cls: 'bg-red-50 text-red-700' },
  // Program Changes
  program_change:        { label: 'Program Change',       cls: 'bg-amber-50 text-amber-700' },
  partner_change:        { label: 'Partner Change',       cls: 'bg-amber-50 text-amber-700' },
  category_change:       { label: 'Category Change',      cls: 'bg-amber-50 text-amber-700' },
  earn_rate_change:      { label: 'Earn Rate Change',     cls: 'bg-amber-50 text-amber-700' },
  status_change:         { label: 'Status Change',        cls: 'bg-amber-50 text-amber-700' },
  policy_change:         { label: 'Policy Change',        cls: 'bg-amber-50 text-amber-700' },
  // News
  industry_news:         { label: 'Industry News',        cls: 'bg-slate-100 text-slate-600' },
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

export default function AlertCardSB({ alert }: { alert: AlertWithPrograms }) {
  const badge = TYPE_BADGE[alert.type] ?? { label: alert.type, cls: 'bg-slate-100 text-slate-600' }
  const endLabel = formatEndDate(alert.end_date)
  const isExpired = endLabel === 'Expired'
  const isExpiringSoon =
    endLabel?.startsWith('Expires in') ||
    endLabel === 'Expires today' ||
    endLabel === 'Expires tomorrow'

  return (
    <div className="group relative flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-md">
      {/* Full-bleed card link */}
      <Link
        href={`/alerts/${alert.slug}`}
        className="absolute inset-0 z-0 rounded-[var(--radius-card)]"
        aria-label={alert.title}
      />

      {/* Type badge */}
      <span className={`relative z-10 self-start rounded-full px-2.5 py-0.5 font-ui text-[10px] font-semibold uppercase tracking-[0.1em] ${badge.cls}`}>
        {badge.label}
      </span>

      {/* Program pills */}
      {(alert.alert_programs?.length ?? 0) > 0 && (
        <div className="relative z-10 flex flex-wrap gap-1">
          {(alert.alert_programs ?? []).map((ap) => (
            <span
              key={ap.id}
              className={`rounded-full px-2 py-0.5 font-ui text-[10px] bg-[var(--color-background-soft)] ${
                ap.role === 'primary'
                  ? 'text-[var(--color-primary)] font-medium'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              {ap.programs.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h3 className="relative z-10 font-display text-base font-semibold leading-snug text-[var(--color-primary)] group-hover:underline">
        {alert.title}
      </h3>

      {/* Summary */}
      <p className="relative z-10 line-clamp-2 font-body text-sm text-[var(--color-text-secondary)]">
        {alert.summary}
      </p>

      <div className="relative z-10 mt-auto flex items-center justify-between gap-2 pt-1">
        {endLabel && (
          <span className={`font-ui text-xs font-medium ${isExpired ? 'text-slate-400' : isExpiringSoon ? 'text-red-600' : 'text-[var(--color-text-secondary)]'}`}>
            {endLabel}
          </span>
        )}
      </div>
    </div>
  )
}
