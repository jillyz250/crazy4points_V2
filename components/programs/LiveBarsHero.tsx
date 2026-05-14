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

/**
 * Label for the live-bar category eyebrow. `point_purchase` swaps between
 * "Buy Miles" (airline / loyalty_program) and "Buy Points" (hotel + others)
 * since the currency word is reader-facing and program-specific.
 */
function liveBarLabel(alertType: string, programType: string | null): string {
  if (alertType === 'point_purchase') {
    const isAirline = programType === 'airline' || programType === 'loyalty_program'
    return isAirline ? 'Buy Miles' : 'Buy Points'
  }
  return STATIC_LABEL[alertType] ?? alertType
}

const STATIC_LABEL: Record<string, string> = {
  limited_time_offer: 'Limited Offer',
  award_availability: 'Award Availability',
  award_sale: 'Award Sale',
  status_promo: 'Status Promo',
  devaluation: 'Devaluation',
}

/**
 * Strip the editor-typed "— Ends May 31" / "— Through June 2" suffix from
 * an alert title, and format a consistent end-date label from the alert's
 * structured end_date. Always includes the year so bars rendered side by
 * side don't have mixed formatting ("May 27, 2026" vs "May 31").
 */
function splitTitleAndDate(
  title: string,
  endDate: string | null
): { baseTitle: string; endLabel: string | null } {
  const SUFFIX = /\s*[—–\-]\s+(Ends?|Through|Until|Expires?)\s+.+$/i
  const baseTitle = title.replace(SUFFIX, '').trim() || title
  let endLabel: string | null = null
  if (endDate) {
    try {
      endLabel = `Ends ${new Date(endDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`
    } catch {
      endLabel = null
    }
  }
  return { baseTitle, endLabel }
}

export default function LiveBarsHero({
  programName,
  programType,
  transferBonus,
  otherAlerts = [],
  promosCount,
  promosDiscountPercent,
  promosChildren,
}: {
  programName: string
  /** Program.type — drives the "Buy Miles" vs "Buy Points" label swap. */
  programType: string | null
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
      {hasTransferBonus && transferBonus && (() => {
        const { baseTitle, endLabel } = splitTitleAndDate(transferBonus.title, transferBonus.end_date)
        return (
          <Link
            href={`/alerts/${transferBonus.short_slug ?? transferBonus.slug}`}
            className="rg-live-bar"
          >
            <span className="rg-live-bar-tag">Live</span>
            <span className="rg-live-bar-category">Transfer Bonus</span>
            <span className="rg-live-bar-content">
              <strong>{baseTitle}</strong>
              {endLabel && <span className="rg-live-bar-end-date">{endLabel}</span>}
            </span>
            <span className="rg-live-bar-cta">View →</span>
          </Link>
        )
      })()}

      {otherAlerts.map((alert) => {
        const { baseTitle, endLabel } = splitTitleAndDate(alert.title, alert.end_date)
        return (
          <Link
            key={alert.id}
            href={`/alerts/${alert.short_slug ?? alert.slug}`}
            className="rg-live-bar"
          >
            <span className="rg-live-bar-tag">Live</span>
            <span className="rg-live-bar-category">
              {liveBarLabel(alert.type, programType)}
            </span>
            <span className="rg-live-bar-content">
              <strong>{baseTitle}</strong>
              {endLabel && <span className="rg-live-bar-end-date">{endLabel}</span>}
            </span>
            <span className="rg-live-bar-cta">View →</span>
          </Link>
        )
      })}

      {hasPromos && (
        <details className="rg-live-bar-details">
          <summary className="rg-live-bar rg-live-bar-summary rg-live-bar-gold">
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
