import Link from 'next/link'
import type { AlertWithPrograms, AlertType } from '@/utils/supabase/queries'
import type { ReactNode } from 'react'

/**
 * Stacked horizontal "LIVE" bars at the top of /programs/[slug]. Surfaces
 * the urgent stuff so readers see what's hot before scrolling into the
 * program reference content.
 *
 * Bar order:
 *   1. Transfer bonus (one at most) — full-width clickable link to alert
 *   2. Other urgent alerts (limited_time_offer, point_purchase,
 *      award_availability, award_sale, status_promo, devaluation) —
 *      one bar per alert, up to a cap; primary program scope only
 *   3. Promo Rewards (count) — expandable <details> for full route table
 *
 * Renders nothing when no live signals are present.
 */

export const OTHER_LIVE_TYPES: AlertType[] = [
  'limited_time_offer',
  'point_purchase',
  'award_availability',
  'award_sale',
  'status_promo',
  'devaluation',
]

const OTHER_TYPE_LABEL: Record<string, string> = {
  limited_time_offer: 'Limited Offer',
  point_purchase: 'Buy Points',
  award_availability: 'Award Availability',
  award_sale: 'Award Sale',
  status_promo: 'Status Promo',
  devaluation: 'Devaluation',
}

export default function LiveBarsHero({
  programName,
  transferBonus,
  otherAlerts = [],
  promosCount,
  promosDiscountPercent,
  promosChildren,
}: {
  programName: string
  /** Single active transfer_bonus alert targeting this program, if any. */
  transferBonus: AlertWithPrograms | null
  /** Other urgent alerts where this program is primary. Limit handled by caller. */
  otherAlerts?: AlertWithPrograms[]
  /** Count of active published promos for this program. */
  promosCount: number
  /** Most-common discount % across promos (drives copy when present). */
  promosDiscountPercent: number | null
  /** The expandable detail content for the Promos bar (typically the
   *  ActivePromosSection table). Rendered inside <details> body. */
  promosChildren?: ReactNode
}) {
  const hasTransferBonus = !!transferBonus
  const hasOther = otherAlerts.length > 0
  const hasPromos = promosCount > 0
  if (!hasTransferBonus && !hasOther && !hasPromos) return null

  return (
    <section
      aria-label="Live offers"
      style={{
        display: 'grid',
        gap: '0.625rem',
        marginBottom: '2.5rem',
      }}
    >
      {hasTransferBonus && transferBonus && (
        <Link
          href={`/alerts/${transferBonus.short_slug ?? transferBonus.slug}`}
          className="rg-live-bar"
        >
          <span className="rg-live-bar-tag">Live</span>
          <span className="rg-live-bar-category">Transfer Bonus</span>
          <span className="rg-live-bar-content">
            <strong>{transferBonus.title}</strong>
          </span>
          <span className="rg-live-bar-cta">View →</span>
        </Link>
      )}

      {otherAlerts.map((alert) => (
        <Link
          key={alert.id}
          href={`/alerts/${alert.short_slug ?? alert.slug}`}
          className="rg-live-bar"
        >
          <span className="rg-live-bar-tag">Live</span>
          <span className="rg-live-bar-category">
            {OTHER_TYPE_LABEL[alert.type] ?? alert.type}
          </span>
          <span className="rg-live-bar-content">
            <strong>{alert.title}</strong>
          </span>
          <span className="rg-live-bar-cta">View →</span>
        </Link>
      ))}

      {hasPromos && (
        <details className="rg-live-bar-details">
          <summary className="rg-live-bar rg-live-bar-summary">
            <span className="rg-live-bar-tag">Live</span>
            <span className="rg-live-bar-category">Promo Rewards</span>
            <span className="rg-live-bar-content">
              <strong>{promosCount} routes</strong>
              {promosDiscountPercent != null
                ? ` discounted ${promosDiscountPercent}% off this month`
                : ` live this month`}
              {' '}on {programName}
            </span>
            <span className="rg-live-bar-cta">View routes →</span>
          </summary>
          {promosChildren && (
            <div className="rg-live-bar-body">{promosChildren}</div>
          )}
        </details>
      )}
    </section>
  )
}
