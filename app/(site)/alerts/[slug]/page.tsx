import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { marked } from 'marked'
import { createClient } from '@/utils/supabase/server'
import { getAlertBySlug } from '@/utils/supabase/queries'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  signup_bonus:          { label: 'Sign-Up Bonus',        cls: 'bg-purple-50 text-purple-700' },
  transfer_bonus:        { label: 'Transfer Bonus',       cls: 'bg-[var(--color-background-soft)] text-[var(--color-primary)]' },
  referral_bonus:        { label: 'Referral Bonus',       cls: 'bg-purple-50 text-purple-600' },
  milestone_bonus:       { label: 'Milestone Bonus',      cls: 'bg-indigo-50 text-indigo-700' },
  shopping_portal_bonus: { label: 'Portal Bonus',         cls: 'bg-teal-50 text-teal-700' },
  dining_bonus:          { label: 'Dining Bonus',         cls: 'bg-orange-50 text-orange-600' },
  point_purchase:        { label: 'Buy Points',           cls: 'bg-cyan-50 text-cyan-700' },
  award_availability:    { label: 'Award Availability',   cls: 'bg-blue-50 text-blue-700' },
  award_sale:            { label: 'Award Sale',           cls: 'bg-blue-50 text-blue-800' },
  sweet_spot:            { label: 'Sweet Spot',           cls: 'bg-green-50 text-green-700' },
  companion_pass:        { label: 'Companion Pass',       cls: 'bg-green-50 text-green-800' },
  limited_time_offer:    { label: 'Limited Offer',        cls: 'bg-red-50 text-red-700' },
  retention_offer:       { label: 'Retention Offer',      cls: 'bg-rose-50 text-rose-700' },
  card_credit:           { label: 'Card Credit',          cls: 'bg-emerald-50 text-emerald-700' },
  card_refresh:          { label: 'Card Refresh',         cls: 'bg-violet-50 text-violet-700' },
  status_promo:          { label: 'Status Promo',         cls: 'bg-orange-50 text-orange-700' },
  glitch:                { label: 'Glitch',               cls: 'bg-yellow-50 text-yellow-800' },
  devaluation:           { label: 'Devaluation',          cls: 'bg-red-50 text-red-800' },
  fee_change:            { label: 'Fee Change',           cls: 'bg-red-50 text-red-700' },
  program_change:        { label: 'Program Change',       cls: 'bg-amber-50 text-amber-700' },
  partner_change:        { label: 'Partner Change',       cls: 'bg-amber-50 text-amber-700' },
  category_change:       { label: 'Category Change',      cls: 'bg-amber-50 text-amber-700' },
  earn_rate_change:      { label: 'Earn Rate Change',     cls: 'bg-amber-50 text-amber-700' },
  status_change:         { label: 'Status Change',        cls: 'bg-amber-50 text-amber-700' },
  policy_change:         { label: 'Policy Change',        cls: 'bg-amber-50 text-amber-700' },
  industry_news:         { label: 'Industry News',        cls: 'bg-slate-100 text-slate-600' },
}

const ACTION_LABELS: Record<string, string> = {
  book: 'Book Now',
  transfer: 'Transfer Points',
  apply: 'Apply for Card',
  status_match: 'Request Status Match',
  monitor: 'Monitor This Deal',
  learn: 'Learn More',
}

const CONFIDENCE_LABELS: Record<string, string> = {
  high: 'High — Confirmed',
  medium: 'Medium — Probable',
  low: 'Low — Rumored',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function daysRemaining(endDate: string | null): string | null {
  if (!endDate) return null
  const end = new Date(endDate)
  const now = new Date()
  const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'Expired'
  if (days === 0) return 'Expires today'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const supabase = await createClient()
    const alert = await getAlertBySlug(supabase, slug)
    return {
      title: `${alert.title} — crazy4points`,
      description: alert.summary,
      alternates: { canonical: `https://crazy4points.com/alerts/${slug}` },
      openGraph: {
        title: alert.title,
        description: alert.summary,
        url: `https://crazy4points.com/alerts/${slug}`,
        type: 'article',
      },
    }
  } catch {
    return { title: 'Alert Not Found — crazy4points' }
  }
}

export default async function AlertDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  let alert
  try {
    alert = await getAlertBySlug(supabase, slug)
  } catch {
    notFound()
  }

  const badge = TYPE_BADGE[alert.type] ?? { label: alert.type, cls: 'bg-slate-100 text-slate-600' }
  const expiry = daysRemaining(alert.end_date)
  const isExpired = expiry === 'Expired'

  // Render description as markdown — promo alerts use a hybrid format
  // (voicey paragraphs + a "What qualifies" bulleted block). Other alert
  // types are still prose-only so markdown is just a passthrough for them.
  const descriptionHtml = alert.description
    ? await marked.parse(alert.description, { async: true })
    : null

  return (
    <article className="rg-major-section">
      <div className="rg-container max-w-3xl">

        {/* Back nav */}
        <nav className="mb-8">
          <Link
            href="/alerts"
            className="font-ui text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
          >
            ← Back to Alerts
          </Link>
        </nav>

        {/* Type badge + expiry */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 font-ui text-xs font-semibold uppercase tracking-[0.1em] ${badge.cls}`}>
            {badge.label}
          </span>
          {expiry && (
            <span className={`font-ui text-xs font-medium ${isExpired ? 'text-slate-400' : 'text-red-600'}`}>
              {expiry}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="mb-4 font-display text-3xl font-bold leading-snug text-[var(--color-primary)] md:text-4xl">
          {alert.title}
        </h1>

        {/* Summary */}
        <p className="mb-4 font-body text-lg text-[var(--color-text-secondary)]">
          {alert.summary}
        </p>

        {/* Editorial subhead — why this matters in the writer's voice. */}
        {alert.why_this_matters && (
          <p className="mb-8 font-body text-base italic leading-relaxed text-[var(--color-text-primary)]">
            {alert.why_this_matters}
          </p>
        )}

        {/* Description — rendered as markdown so promo alerts can use the
            hybrid voicey-prose + "What qualifies" bullet block format. */}
        {descriptionHtml && (
          <div className="mb-8 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-6">
            <div
              className="rg-prose font-body text-base leading-relaxed text-[var(--color-text-primary)]"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          </div>
        )}

        {/* Meta grid */}
        <dl className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {alert.start_date && (
            <div>
              <dt className="mb-0.5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Start Date</dt>
              <dd className="font-body text-sm text-[var(--color-text-primary)]">{formatDate(alert.start_date)}</dd>
            </div>
          )}
          {alert.end_date && (
            <div>
              <dt className="mb-0.5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">End Date</dt>
              <dd className="font-body text-sm text-[var(--color-text-primary)]">{formatDate(alert.end_date)}</dd>
            </div>
          )}
          <div>
            <dt className="mb-0.5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Confidence</dt>
            <dd className="font-body text-sm text-[var(--color-text-primary)]">{CONFIDENCE_LABELS[alert.confidence_level] ?? alert.confidence_level}</dd>
          </div>
          <div>
            <dt className="mb-0.5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Action</dt>
            <dd className="font-body text-sm text-[var(--color-text-primary)]">{ACTION_LABELS[alert.action_type] ?? alert.action_type}</dd>
          </div>
          {alert.published_at && (
            <div>
              <dt className="mb-0.5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Published</dt>
              <dd className="font-body text-sm text-[var(--color-text-primary)]">{formatDate(alert.published_at)}</dd>
            </div>
          )}
        </dl>

        {/* History note */}
        {alert.history_note && (
          <div className="mb-8 rounded-[var(--radius-card)] border-l-4 border-[var(--color-primary)] bg-[var(--color-background-soft)] p-4">
            <p className="mb-1 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">Historical Context</p>
            <p className="font-body text-sm text-[var(--color-text-primary)]">{alert.history_note}</p>
          </div>
        )}

        {/* CTA */}
        {alert.source_url && !isExpired && (
          <a
            href={alert.source_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="rg-btn-primary inline-block"
          >
            {ACTION_LABELS[alert.action_type] ?? 'View Deal'} →
          </a>
        )}

      </div>
    </article>
  )
}
