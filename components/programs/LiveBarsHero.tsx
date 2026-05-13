import Link from 'next/link'
import type { AlertWithPrograms } from '@/utils/supabase/queries'
import type { ReactNode } from 'react'

/**
 * Two stacked horizontal "LIVE" bars at the top of /programs/[slug].
 * Replaces the previous "dateline frame" LiveNowSection — simpler,
 * more functional, less precious.
 *
 * Bar 1 (Transfer bonus): full-width clickable link → alert detail
 * Bar 2 (Promo rewards): full-width clickable <summary> → expands
 *   inline to reveal the full filterable promos table (via children)
 *
 * Renders nothing when no live signals are present. No icons; small-
 * caps "LIVE" eyebrow in gold carries the status signal.
 */
export default function LiveBarsHero({
  programName,
  transferBonus,
  promosCount,
  promosDiscountPercent,
  promosChildren,
}: {
  programName: string
  /** Single active transfer_bonus alert targeting this program, if any. */
  transferBonus: AlertWithPrograms | null
  /** Count of active published promos for this program. */
  promosCount: number
  /** Most-common discount % across promos (drives copy when present). */
  promosDiscountPercent: number | null
  /** The expandable detail content for the Promos bar (typically the
   *  ActivePromosSection table). Rendered inside <details> body. */
  promosChildren?: ReactNode
}) {
  const hasTransferBonus = !!transferBonus
  const hasPromos = promosCount > 0
  if (!hasTransferBonus && !hasPromos) return null

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
