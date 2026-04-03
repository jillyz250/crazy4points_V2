import Link from 'next/link'
import type { SanityAlert } from '@/lib/types'
import { getProgramName } from '@/lib/programs'
import AlertsGrid from '@/components/alerts/AlertsGrid'
import PortableTextRenderer from '@/components/portable-text/PortableTextRenderer'

// ── Static lookup maps (full literals — Tailwind v4 JIT) ─────────────────────

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  transfer_bonus:     { label: 'Transfer Bonus',     cls: 'bg-[var(--color-background-soft)] text-[var(--color-primary)]' },
  limited_time_offer: { label: 'Limited Offer',      cls: 'bg-red-50 text-red-700' },
  award_availability: { label: 'Award Availability', cls: 'bg-blue-50 text-blue-700' },
  status_promo:       { label: 'Status Promo',        cls: 'bg-orange-50 text-orange-700' },
  glitch:             { label: 'Glitch',              cls: 'bg-yellow-50 text-yellow-800' },
  devaluation:        { label: 'Devaluation',         cls: 'bg-red-50 text-red-800' },
  program_change:     { label: 'Program Change',      cls: 'bg-amber-50 text-amber-700' },
  partner_change:     { label: 'Partner Change',      cls: 'bg-amber-50 text-amber-700' },
  category_change:    { label: 'Category Change',     cls: 'bg-amber-50 text-amber-700' },
  earn_rate_change:   { label: 'Earn Rate Change',    cls: 'bg-amber-50 text-amber-700' },
  status_change:      { label: 'Status Change',       cls: 'bg-amber-50 text-amber-700' },
  policy_change:      { label: 'Policy Change',       cls: 'bg-amber-50 text-amber-700' },
  sweet_spot:         { label: 'Sweet Spot',          cls: 'bg-green-50 text-green-700' },
  industry_news:      { label: 'Industry News',       cls: 'bg-slate-100 text-slate-600' },
}

// Per-spec action type display labels (detail page only — different from AlertCard)
const ACTION_DISPLAY: Record<string, { label: string; cls: string }> = {
  book:     { label: 'Do This Now',    cls: 'bg-[var(--color-accent)] text-white' },
  transfer: { label: 'Do This Now',    cls: 'bg-[var(--color-accent)] text-white' },
  apply:    { label: 'Do This Now',    cls: 'bg-[var(--color-accent)] text-white' },
  monitor:  { label: 'Watch This',     cls: 'bg-amber-100 text-amber-800' },
  learn:    { label: 'Just Know This', cls: 'bg-slate-100 text-slate-600' },
}

// ── Helper: date range with days remaining ───────────────────────────────────

function formatDateRange(
  startDate: string,
  endDate: string | null
): { startStr: string; endStr: string | null; daysRemaining: string | null } {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const startStr = fmt(new Date(startDate))

  if (!endDate) return { startStr, endStr: null, daysRemaining: null }

  const end = new Date(endDate)
  const endStr = fmt(end)
  const now = new Date()
  const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  let daysRemaining: string
  if (days < 0) daysRemaining = 'Expired'
  else if (days === 0) daysRemaining = 'Expires today'
  else if (days === 1) daysRemaining = '1 day left'
  else daysRemaining = `${days} days left`

  return { startStr, endStr, daysRemaining }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AlertDetail({
  alert,
  finalScore,
}: {
  alert: SanityAlert
  finalScore: number
}) {
  const typeBadge = TYPE_BADGE[alert.type] ?? { label: alert.type, cls: 'bg-slate-100 text-slate-600' }
  const actionDisplay = ACTION_DISPLAY[alert.actionType] ?? { label: alert.actionType, cls: 'bg-slate-100 text-slate-600' }
  const { startStr, endStr, daysRemaining } = formatDateRange(alert.startDate, alert.endDate)
  const isExpired = daysRemaining === 'Expired'
  const hasDescription = Array.isArray(alert.description) && alert.description.length > 0
  const hasRelated = Array.isArray(alert.relatedAlerts) && alert.relatedAlerts.length > 0

  return (
    <article className="rg-major-section">
      <div className="rg-container max-w-3xl">

        {/* ── Back nav ── */}
        <nav className="mb-8">
          <Link
            href="/alerts"
            className="font-ui text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
          >
            ← Back to Alerts
          </Link>
        </nav>

        {/* ── Hero ── */}
        <header className="mb-10 flex flex-col gap-5">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 font-ui text-[10px] font-semibold uppercase tracking-[0.1em] ${typeBadge.cls}`}
            >
              {typeBadge.label}
            </span>
            <span
              className={`rounded-full px-3 py-1 font-ui text-[10px] font-semibold uppercase tracking-[0.1em] ${actionDisplay.cls}`}
            >
              {actionDisplay.label}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl font-bold leading-tight text-[var(--color-primary)] sm:text-4xl">
            {alert.title}
          </h1>

          {/* Summary */}
          <p className="font-body text-lg leading-relaxed text-[var(--color-text-secondary)]">
            {alert.summary}
          </p>

          {/* Program tags */}
          {alert.programs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {alert.programs.map((slug) => (
                <Link
                  key={slug}
                  href={`/programs/${slug}`}
                  className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-3 py-1 font-ui text-xs font-medium text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-background)]"
                >
                  {getProgramName(slug)}
                </Link>
              ))}
            </div>
          )}

          {/* Date range */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-ui text-sm text-[var(--color-text-secondary)]">
            <span>
              <span className="font-semibold text-[var(--color-text-primary)]">Started:</span>{' '}
              {startStr}
            </span>
            {endStr && (
              <span>
                <span className="font-semibold text-[var(--color-text-primary)]">Ends:</span>{' '}
                {endStr}
              </span>
            )}
            {daysRemaining && (
              <span
                className={`font-semibold ${
                  isExpired
                    ? 'text-slate-400'
                    : daysRemaining === 'Expires today' || daysRemaining === '1 day left'
                    ? 'text-red-600'
                    : 'text-[var(--color-primary)]'
                }`}
              >
                {daysRemaining}
              </span>
            )}
          </div>
        </header>

        {/* ── Description section ── */}
        <section aria-label="Full description" className="mb-10">
          <h2 className="mb-4 font-display text-xl font-semibold text-[var(--color-primary)]">
            Full Details
          </h2>

          {hasDescription ? (
            <PortableTextRenderer blocks={alert.description!} />
          ) : (
            <p className="font-body text-sm italic text-[var(--color-text-secondary)]">
              No additional details have been added for this alert yet.
            </p>
          )}
        </section>

        {/* ── Program links footer ── */}
        {alert.programs.length > 0 && (
          <div className="mb-10 border-t border-[var(--color-border-soft)] pt-6">
            <p className="font-ui text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
              See all alerts for
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {alert.programs.map((slug) => (
                <Link
                  key={slug}
                  href={`/programs/${slug}`}
                  className="font-ui text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                  {getProgramName(slug)} →
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Related Alerts — full width grid ── */}
      {hasRelated && (
        <div className="rg-container mt-4">
          <div className="border-t border-[var(--color-border-soft)] pt-10">
            <h2 className="mb-6 font-display text-2xl font-bold text-[var(--color-primary)]">
              Related Alerts
            </h2>
            {/* TODO: replace cast with proper nested type once SanityAlert supports typed relatedAlerts */}
            <AlertsGrid alerts={alert.relatedAlerts as unknown as SanityAlert[]} />
          </div>
        </div>
      )}
    </article>
  )
}
