'use client'

import Link from 'next/link'
import type { AlertWithPrograms } from '@/utils/supabase/queries'

const TYPE_LABELS: Record<string, string> = {
  signup_bonus: 'Sign-Up Bonus',
  transfer_bonus: 'Transfer Bonus',
  referral_bonus: 'Referral Bonus',
  milestone_bonus: 'Milestone Bonus',
  shopping_portal_bonus: 'Portal Bonus',
  dining_bonus: 'Dining Bonus',
  point_purchase: 'Buy Points',
  award_availability: 'Award Availability',
  award_sale: 'Award Sale',
  sweet_spot: 'Sweet Spot',
  companion_pass: 'Companion Pass',
  limited_time_offer: 'Limited Offer',
  retention_offer: 'Retention Offer',
  card_credit: 'Card Credit',
  card_refresh: 'Card Refresh',
  status_promo: 'Status Promo',
  glitch: 'Glitch',
  devaluation: 'Devaluation',
  fee_change: 'Fee Change',
  program_change: 'Program Change',
  partner_change: 'Partner Change',
  category_change: 'Category Change',
  earn_rate_change: 'Earn Rate Change',
  status_change: 'Status Change',
  policy_change: 'Policy Change',
  industry_news: 'Industry News',
}

function formatEndDate(endDate: string | null): string | null {
  if (!endDate) return null
  const end = new Date(endDate)
  const diffDays = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'Expired'
  if (diffDays === 0) return 'Expires today'
  if (diffDays === 1) return 'Expires tomorrow'
  if (diffDays <= 7) return `Expires in ${diffDays} days`
  return `Expires ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

export default function AlertHeroCardSB({ alert }: { alert: AlertWithPrograms }) {
  const typeLabel = TYPE_LABELS[alert.type] ?? alert.type
  const endLabel = formatEndDate(alert.end_date)
  const isExpired = endLabel === 'Expired'
  const primary = (alert.alert_programs ?? []).find((ap) => ap.role === 'primary')

  return (
    <Link
      href={`/alerts/${alert.slug}`}
      className="group relative flex flex-col gap-3 rounded-[var(--radius-card)] border-2 border-[var(--color-primary)] bg-[var(--color-background-soft)] p-6 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-lg md:p-7"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[var(--color-primary)] px-3 py-1 font-ui text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
          {alert.is_hot ? '🔥 Hot' : 'Top Alert'}
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 font-ui text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)]">
          {typeLabel}
        </span>
        {endLabel && (
          <span className={`font-ui text-xs font-medium ${isExpired ? 'text-slate-400' : 'text-red-600'}`}>
            {endLabel}
          </span>
        )}
      </div>

      <h2 className="font-display text-xl font-bold leading-tight text-[var(--color-primary)] group-hover:underline md:text-2xl">
        {alert.title}
      </h2>

      <p className="font-body text-base leading-relaxed text-[var(--color-text-primary)]">
        {alert.summary}
      </p>

      {primary && (
        <div className="mt-auto pt-1">
          <span className="font-ui text-xs text-[var(--color-text-secondary)]">
            {primary.programs.name}
          </span>
        </div>
      )}
    </Link>
  )
}
