'use client'

import Link from 'next/link'
import type { AlertWithPrograms } from '@/utils/supabase/queries'
import { formatExpiryLabel } from '@/lib/alertExpiry'

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

// Urgency tiers (simplified 2026-05-12 design pass: 5 colors → 3).
//
// Old model used red/orange/amber/blue/green — too many colors,
// none brand-aligned, and the page read chaotic. New model uses
// one alarm color (red for "act now"), one brand color (soft purple
// for normal-priority), and one neutral (long runway / FYI).
type UrgencyTier = 'urgent' | 'standard' | 'long_runway'

const URGENCY: Record<UrgencyTier, { border: string; bg: string; labelCls: string }> = {
  urgent: {
    border: 'border-l-red-500',
    bg: 'bg-red-50',
    labelCls: 'text-red-600 font-semibold',
  },
  standard: {
    border: 'border-l-[var(--color-primary)]',
    bg: 'bg-[var(--color-background-soft)]',
    labelCls: 'text-[var(--color-text-secondary)]',
  },
  long_runway: {
    border: 'border-l-[var(--color-border-soft)]',
    bg: 'bg-white',
    labelCls: 'text-[var(--color-text-secondary)]',
  },
}

function getUrgencyTier(endDate: string | null, impactScore: number): UrgencyTier {
  if (!endDate) {
    // Evergreen / open-ended: still worth surfacing in brand color if
    // it has editorial weight, otherwise fade it.
    return impactScore >= 5 ? 'standard' : 'long_runway'
  }
  const diffDays = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0)  return 'long_runway' // expired — shouldn't appear on public pages
  if (diffDays <= 7)  return 'urgent'
  if (diffDays <= 30) return 'standard'
  return 'long_runway'
}

function formatEndDate(endDate: string | null): string | null {
  return formatExpiryLabel(endDate)
}

const MAX_VISIBLE_PROGRAMS = 4

export default function AlertCardSB({ alert }: { alert: AlertWithPrograms }) {
  const badge     = TYPE_BADGE[alert.type] ?? { label: alert.type, cls: 'bg-slate-100 text-slate-600' }
  const endLabel  = formatEndDate(alert.end_date)
  const isExpired = endLabel === 'Expired'
  const urgency   = getUrgencyTier(alert.end_date, alert.impact_score)
  const urg       = URGENCY[urgency]

  // Primary program first, then secondaries in insertion order
  const sortedPrograms = [...(alert.alert_programs ?? [])].sort((a, b) => {
    if (a.role === b.role) return 0
    return a.role === 'primary' ? -1 : 1
  })
  const visible = sortedPrograms.slice(0, MAX_VISIBLE_PROGRAMS)
  const overflow = sortedPrograms.length - visible.length

  return (
    <div className={`group relative flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] border-l-4 ${urg.border} ${urg.bg} p-5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-md`}>
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

      {/* Title */}
      <h3 className="relative z-10 font-display text-base font-semibold leading-snug text-[var(--color-primary)] group-hover:underline">
        {alert.title}
      </h3>

      {/* Summary */}
      <p className="relative z-10 line-clamp-2 font-body text-sm text-[var(--color-text-secondary)]">
        {alert.summary}
      </p>

      {/* Program pills — bottom of card */}
      {visible.length > 0 && (
        <div className="relative z-10 flex flex-wrap gap-1">
          {visible.map((ap) => (
            <span
              key={ap.id}
              className={`rounded-full px-2 py-0.5 font-ui text-[10px] bg-white/70 ${
                ap.role === 'primary'
                  ? 'text-[var(--color-primary)] font-medium'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              {ap.programs.name}
            </span>
          ))}
          {overflow > 0 && (
            <span className="rounded-full px-2 py-0.5 font-ui text-[10px] bg-white/70 text-[var(--color-text-secondary)]">
              +{overflow} more
            </span>
          )}
        </div>
      )}

      <div className="relative z-10 mt-auto flex items-center justify-between gap-2 pt-1">
        {endLabel && (
          <span className={`font-ui text-xs ${isExpired ? 'text-slate-400' : urg.labelCls}`}>
            {endLabel}
          </span>
        )}
      </div>
    </div>
  )
}
