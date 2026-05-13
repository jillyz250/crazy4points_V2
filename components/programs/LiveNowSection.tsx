import Link from 'next/link'
import type { AlertWithPrograms } from '@/utils/supabase/queries'
import type { PromoReward } from '@/utils/supabase/promoQueries'
import { formatExpiryLabel } from '@/lib/alertExpiry'

/**
 * "Live Now" hero on /programs/[slug]. Editorial "dateline frame"
 * treatment — small-caps eyebrow + thin gold rule + Playfair italic
 * pull quote for the auto-detected stack + two-column data grid below.
 *
 * Renders nothing when there are no live signals. No icons; the gold
 * rule + typography hierarchy carry the signal.
 *
 * Design notes (from 2026-05-13 FE audit):
 *   - Stack is the moat moment. Promote it to a pull quote, don't
 *     bury it as a row in a definition list.
 *   - The percentage number inside the italic ("62% of the standard
 *     rate") stays non-italic + purple — classic print trick to pop
 *     a single phrase inside a flowing serif.
 *   - One tinted background per page. This is it.
 */
export default function LiveNowSection({
  programName,
  transferBonuses,
  promosCount,
  promosDiscountPercent,
  newestScrapeAt,
  stackNoteOverride,
}: {
  programName: string
  transferBonuses: AlertWithPrograms[]
  promosCount: number
  promosDiscountPercent: number | null
  newestScrapeAt: Date | null
  stackNoteOverride: string | null
}) {
  const hasTransferBonus = transferBonuses.length > 0
  const hasPromos = promosCount > 0
  if (!hasTransferBonus && !hasPromos) return null

  const showStack = hasTransferBonus && hasPromos
  const transferBonus = transferBonuses[0]
  const transferBonusPct = transferBonus
    ? extractBonusPct(transferBonus.title)
    : null

  const autoStack =
    showStack && transferBonusPct != null && promosDiscountPercent != null
      ? buildAutoStackParts(transferBonusPct, promosDiscountPercent)
      : null

  return (
    <section
      aria-labelledby="live-now-heading"
      style={{
        marginBottom: '4rem',
        padding: 'clamp(1.75rem, 4vw, 2.5rem) clamp(1.25rem, 3vw, 2rem)',
        background:
          'linear-gradient(180deg, #FBF7F0 0%, #F8F5FB 100%)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        boxShadow: '0 12px 32px -16px rgba(107, 45, 143, 0.18)',
      }}
    >
      {/* Gold rule + eyebrow ─────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          width: '48px',
          height: '2px',
          background: 'var(--color-accent)',
          marginBottom: '0.625rem',
        }}
      />
      <p
        id="live-now-heading"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--color-primary)',
          margin: 0,
        }}
      >
        Live on {programName}
        {newestScrapeAt && (
          <>
            <span style={{ margin: '0 0.5em', color: 'var(--color-text-secondary)' }}>·</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Updated {formatRelativeTime(newestScrapeAt)}
            </span>
          </>
        )}
      </p>

      {/* Pull quote — only when stack is detected ───────────────────── */}
      {(stackNoteOverride || autoStack) && (
        <>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              lineHeight: 1.25,
              color: 'var(--color-text-primary)',
              maxWidth: '38ch',
              margin: '1.75rem 0 0',
              fontWeight: 400,
            }}
          >
            {stackNoteOverride ? (
              stackNoteOverride
            ) : (
              <PullQuoteWithHighlight parts={autoStack!} />
            )}
          </p>

          {/* "THE STACK" rule */}
          <RuleWithLabel label="The Stack" />
        </>
      )}

      {/* Two-column data grid ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            hasTransferBonus && hasPromos
              ? 'repeat(auto-fit, minmax(15rem, 1fr))'
              : '1fr',
          gap: '2rem',
          position: 'relative',
          marginTop: (stackNoteOverride || autoStack) ? '1.5rem' : '2rem',
        }}
      >
        {hasTransferBonus && transferBonus && (
          <DataCell
            label="Transfer bonus"
            primary={transferBonus.title}
            secondary={formatExpiryLabel(transferBonus.end_date)}
            href={`/alerts/${transferBonus.short_slug ?? transferBonus.slug}`}
            cta="Should I transfer? →"
          />
        )}
        {hasPromos && (
          <DataCell
            label="Promo Rewards"
            primary={
              promosDiscountPercent != null
                ? `${promosCount} routes discounted ${promosDiscountPercent}% off`
                : `${promosCount} routes live this month`
            }
            secondary="Verified today"
            href="#active-promos"
            cta="View promos →"
          />
        )}
        {/* Vertical gold hairline at desktop, between cells */}
        {hasTransferBonus && hasPromos && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: '50%',
              top: '15%',
              bottom: '15%',
              width: '1px',
              background: 'var(--color-accent)',
              opacity: 0.3,
              display: 'none',
            }}
            className="rg-live-now-divider"
          />
        )}
      </div>
    </section>
  )
}

/** Render the pull quote with the "X% of the standard rate" phrase as
 *  a non-italic purple accent — classic print "popped highlight" inside
 *  a flowing serif. */
function PullQuoteWithHighlight({
  parts,
}: {
  parts: { lead: string; highlight: string; tail: string }
}) {
  return (
    <>
      {parts.lead}
      <span
        style={{
          fontStyle: 'normal',
          color: 'var(--color-primary)',
          fontWeight: 600,
        }}
      >
        {parts.highlight}
      </span>
      {parts.tail}
    </>
  )
}

/** A thin gold horizontal rule with a small-caps centered label. */
function RuleWithLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        position: 'relative',
        margin: '1.75rem 0 0',
        height: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: '1px',
          background: 'var(--color-accent)',
          opacity: 0.4,
        }}
      />
      <span
        style={{
          position: 'relative',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.625rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontWeight: 600,
          color: '#8A6D1F',
          background:
            'linear-gradient(180deg, #FBF7F0 0%, #FBF7F0 50%, #FCF6F0 100%)',
          padding: '0 0.75rem',
        }}
      >
        {label}
      </span>
    </div>
  )
}

function DataCell({
  label,
  primary,
  secondary,
  href,
  cta,
}: {
  label: string
  primary: string
  secondary: string | null
  href: string
  cta: string
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.625rem',
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          margin: '0 0 0.5rem',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 700,
          lineHeight: 1.2,
          color: 'var(--color-primary)',
          margin: 0,
        }}
      >
        {primary}
      </p>
      {secondary && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            margin: '0.375rem 0 0',
          }}
        >
          {secondary}
        </p>
      )}
      <Link
        href={href}
        style={{
          display: 'inline-block',
          marginTop: '0.625rem',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: 'var(--color-primary)',
          textDecoration: 'none',
        }}
      >
        {cta}
      </Link>
    </div>
  )
}

/** "X hours ago" / "today" / "yesterday" / "N days ago". Tight. */
function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 1) return 'minutes ago'
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function extractBonusPct(title: string): number | null {
  const m = title.match(/(\d{1,3})%/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  if (isNaN(n) || n < 1 || n > 200) return null
  return n
}

/**
 * Build the auto-stack pull quote split into three parts: lead +
 * highlight + tail. The highlight rerenders non-italic purple inside
 * the serif italic body.
 *
 * Formula (multiplicative, not additive):
 *   ratio = (1 - D/100) / (1 + B/100)
 *   combined savings % = 100 * (1 - ratio)
 *
 * Example: B=20, D=25 → ratio = 0.75/1.20 = 0.625 → 37.5% savings,
 *   so you pay 62.5% of the standard rate.
 */
function buildAutoStackParts(
  bonusPercent: number,
  discountPercent: number,
): { lead: string; highlight: string; tail: string } | null {
  if (bonusPercent <= 0 || bonusPercent > 200) return null
  if (discountPercent <= 0 || discountPercent >= 100) return null
  const ratio = (1 - discountPercent / 100) / (1 + bonusPercent / 100)
  const payPct = Math.round(ratio * 100)
  if (payPct <= 0 || payPct >= 100) return null
  return {
    lead: `Right now you can stack a ${bonusPercent}% transfer bonus with Promo Rewards to pay roughly `,
    highlight: `${payPct}% of the standard rate`,
    tail: `.`,
  }
}
