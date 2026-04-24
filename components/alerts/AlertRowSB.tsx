import Link from 'next/link'
import type { AlertWithPrograms } from '@/utils/supabase/queries'

const TYPE_LABELS: Record<string, string> = {
  signup_bonus: 'Sign-Up',
  transfer_bonus: 'Transfer',
  referral_bonus: 'Referral',
  milestone_bonus: 'Milestone',
  shopping_portal_bonus: 'Portal',
  dining_bonus: 'Dining',
  point_purchase: 'Buy Points',
  award_availability: 'Awards',
  award_sale: 'Award Sale',
  sweet_spot: 'Sweet Spot',
  companion_pass: 'Companion',
  limited_time_offer: 'LTO',
  retention_offer: 'Retention',
  card_credit: 'Credit',
  card_refresh: 'Refresh',
  status_promo: 'Status',
  glitch: 'Glitch',
  devaluation: 'Devalue',
  fee_change: 'Fee',
  program_change: 'Program',
  partner_change: 'Partner',
  category_change: 'Category',
  earn_rate_change: 'Earn Rate',
  status_change: 'Status',
  policy_change: 'Policy',
  industry_news: 'News',
}

function endLabel(endDate: string | null): string | null {
  if (!endDate) return null
  const diffDays = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return null
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return '1d'
  if (diffDays <= 30) return `${diffDays}d`
  return null
}

export default function AlertRowSB({ alert }: { alert: AlertWithPrograms }) {
  const type = TYPE_LABELS[alert.type] ?? alert.type
  const primary = (alert.alert_programs ?? []).find((ap) => ap.role === 'primary')
  const end = endLabel(alert.end_date)

  return (
    <Link
      href={`/alerts/${alert.slug}`}
      className="group flex items-center gap-3 border-b border-[var(--color-border-soft)] px-3 py-2.5 transition-colors last:border-b-0 hover:bg-[var(--color-background-soft)]"
    >
      <span className="shrink-0 rounded-full bg-[var(--color-background-soft)] px-2 py-0.5 font-ui text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
        {type}
      </span>
      <span className="flex-1 truncate font-body text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] group-hover:underline">
        {alert.title}
      </span>
      {primary && (
        <span className="hidden shrink-0 font-ui text-xs text-[var(--color-text-secondary)] sm:inline">
          {primary.programs.name}
        </span>
      )}
      {end && (
        <span className="shrink-0 font-ui text-xs font-medium text-red-600">{end}</span>
      )}
    </Link>
  )
}
