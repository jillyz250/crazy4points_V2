import Link from 'next/link'
import type { AlertWithPrograms } from '@/utils/supabase/queries'
import type { PromoReward } from '@/utils/supabase/promoQueries'
import { formatExpiryLabel } from '@/lib/alertExpiry'

/**
 * "Live Now" hero on /programs/[slug]. Surfaces the time-sensitive
 * signals that matter to a reader landing on this page: active
 * transfer bonuses, scraped promo discounts, and — the moat moment —
 * the auto-detected stack when both are live for the same program.
 *
 * Renders nothing when there are no live signals. No icons or emoji;
 * typography + spacing carry the hierarchy.
 *
 * Stack callout follows the override-when-present pattern:
 *   - If programs.stack_note_override is set, render that text
 *   - Otherwise compute auto-text from available data
 *
 * Cardinal rule (per plans/promo-scraper.md): nothing renders unless
 * the underlying data is actually true at this moment. No
 * fabricated math, no "could-be" hypotheticals.
 */
export default function LiveNowSection({
  transferBonuses,
  promosCount,
  promosDiscountPercent,
  stackNoteOverride,
}: {
  /** Active transfer_bonus alerts targeting this program as destination. */
  transferBonuses: AlertWithPrograms[]
  /** Count of published+active scraped promos for this program. */
  promosCount: number
  /** Most-common discount % across active promos (e.g. 25 for "Flying Blue -25%"). */
  promosDiscountPercent: number | null
  /** Curator override for the stack callout copy (Migration 253). */
  stackNoteOverride: string | null
}) {
  const hasTransferBonus = transferBonuses.length > 0
  const hasPromos = promosCount > 0

  // Section auto-hides when nothing is live
  if (!hasTransferBonus && !hasPromos) return null

  const showStack = hasTransferBonus && hasPromos
  const transferBonusPct = hasTransferBonus
    ? extractBonusPct(transferBonuses[0]!.title)
    : null

  const autoStackText =
    showStack && transferBonusPct != null && promosDiscountPercent != null
      ? buildAutoStackText(transferBonusPct, promosDiscountPercent)
      : null

  const stackText = stackNoteOverride ?? autoStackText

  return (
    <section
      aria-labelledby="live-now-heading"
      style={{
        marginBottom: '2.5rem',
        padding: '1.5rem 1.5rem 1.25rem',
        background: 'linear-gradient(135deg, var(--color-background-soft) 0%, #FFFFFF 100%)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <h2
        id="live-now-heading"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          margin: '0 0 1rem',
        }}
      >
        Live now
      </h2>

      <dl style={{ display: 'grid', gap: '0.875rem', margin: 0 }}>
        {transferBonuses.map((alert) => (
          <Row
            key={alert.id}
            label="Transfer bonus"
            href={`/alerts/${alert.short_slug ?? alert.slug}`}
            primary={alert.title}
            secondary={formatExpiryLine(alert.end_date)}
          />
        ))}

        {hasPromos && (
          <Row
            label="Promos"
            href="#active-promos"
            primary={
              promosDiscountPercent != null
                ? `${promosCount} routes discounted ${promosDiscountPercent}% off this month`
                : `${promosCount} promo routes live this month`
            }
            secondary="Verified today. View promos below."
          />
        )}

        {stackText && (
          <Row
            label="Stack"
            primary={stackText}
            href="/hub/should-i-transfer"
            secondaryLink="Should I transfer? →"
          />
        )}
      </dl>
    </section>
  )
}

function Row({
  label,
  primary,
  secondary,
  secondaryLink,
  href,
}: {
  label: string
  primary: string
  secondary?: string
  secondaryLink?: string
  href?: string
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '7rem 1fr',
        gap: '1rem',
        alignItems: 'baseline',
      }}
    >
      <dt
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-primary)',
        }}
      >
        {label}
      </dt>
      <dd style={{ margin: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            color: 'var(--color-text-primary)',
            lineHeight: 1.45,
          }}
        >
          {href ? (
            <Link
              href={href}
              style={{
                color: 'var(--color-text-primary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              {primary}
            </Link>
          ) : (
            primary
          )}
        </div>
        {(secondary || secondaryLink) && (
          <div
            style={{
              marginTop: '0.25rem',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            {secondary}
            {secondaryLink && href && (
              <>
                {secondary && ' '}
                <Link
                  href={href}
                  style={{
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {secondaryLink}
                </Link>
              </>
            )}
          </div>
        )}
      </dd>
    </div>
  )
}

function formatExpiryLine(endDate: string | null): string {
  const lbl = formatExpiryLabel(endDate)
  if (!lbl) return ''
  return `${lbl}. Should I transfer? →`
}

/** Extract numeric bonus % from an alert title like "Chase UR → Flying Blue 20% Transfer Bonus". */
function extractBonusPct(title: string): number | null {
  const m = title.match(/(\d{1,3})%/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  if (isNaN(n) || n < 1 || n > 200) return null
  return n
}

/**
 * Build the auto-stack text from concrete bonus + discount numbers.
 *
 * Formula: combine multiplicatively (not additively, which would be wrong).
 *   - Transfer bonus B% means you get (1+B/100) destination miles per source mile
 *   - Promo discount D% means you pay (1-D/100) of the rate
 *   - Effective ratio of source-points-per-rack-rate-mile:
 *       (1 - D/100) / (1 + B/100)
 *   - Combined savings %: 100 * (1 - that ratio)
 *
 * Example: B=20, D=25 → ratio = 0.75 / 1.20 = 0.625 → 37.5% off rack rate.
 *
 * Returns null when math doesn't add up (defensive).
 */
function buildAutoStackText(
  bonusPercent: number,
  discountPercent: number,
): string | null {
  if (bonusPercent <= 0 || bonusPercent > 200) return null
  if (discountPercent <= 0 || discountPercent >= 100) return null

  const ratio = (1 - discountPercent / 100) / (1 + bonusPercent / 100)
  const combinedSavingsPct = Math.round((1 - ratio) * 100)
  if (combinedSavingsPct <= 0) return null

  return (
    `Combine the ${bonusPercent}% transfer bonus with a ${discountPercent}% promo and ` +
    `you pay roughly ${100 - combinedSavingsPct}% of the standard rate ` +
    `(${combinedSavingsPct}% combined savings). Confirm award space before transferring — ` +
    `transfers are one-way.`
  )
}
