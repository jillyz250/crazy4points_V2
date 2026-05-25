import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { marked } from 'marked'
import { createClient } from '@/utils/supabase/server'
import { getAlertBySlug } from '@/utils/supabase/queries'
import { daysUntilEndOfDay } from '@/lib/alertExpiry'
import { normalizeAlertDescription } from '@/utils/alerts/normalizeDescription'

// Published alert content; stable after publish.
export const revalidate = 3600

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
  buy_miles: 'Buy Miles / Points',
  activate: 'Activate & Earn',
  monitor: 'Monitor This Deal',
  learn: 'Learn More',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function daysRemaining(endDate: string | null): string | null {
  const days = daysUntilEndOfDay(endDate)
  if (days === null) return null
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
      title: `${alert.title}`,
      description: alert.summary,
      alternates: { canonical: `https://www.crazy4points.com/alerts/${slug}` },
      openGraph: {
        title: alert.title,
        description: alert.summary,
        url: `https://www.crazy4points.com/alerts/${slug}`,
        type: 'article',
      },
    }
  } catch {
    return { title: 'Alert Not Found' }
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

  // CTA target — link to the alert's primary program reference page rather
  // than the original news article (which often lives off-site and bounces
  // the reader away). Falls back to /alerts when no program is set.
  let ctaHref = '/alerts'
  let ctaLabel = 'Browse all alerts'
  if (alert.primary_program_id) {
    const { data: program } = await supabase
      .from('programs')
      .select('slug, name')
      .eq('id', alert.primary_program_id)
      .maybeSingle()
    if (program?.slug) {
      ctaHref = `/programs/${program.slug}`
      ctaLabel = `Explore ${program.name}`
    }
  }

  // Render description as markdown — promo alerts use a hybrid format
  // (voicey paragraphs + a "What qualifies" bulleted block). Other alert
  // types are still prose-only so markdown is just a passthrough for them.
  // Normalize "Label: value" paragraph sequences into proper markdown
  // bullets so the page doesn't render as flat prose when the writer
  // drifted from the bullet format (see utils/alerts/normalizeDescription.ts).
  const descriptionHtml = alert.description
    ? await marked.parse(normalizeAlertDescription(alert.description), { async: true })
    : null

  // JSON-LD Article schema. Tells Google + AI assistants that crazy4points
  // is the canonical source so copies of this content get demoted in SERPs
  // and AI summaries cite us with attribution.
  const articleType =
    alert.type === 'devaluation' || alert.type === 'program_change' || alert.type === 'partner_change'
      ? 'NewsArticle'
      : 'Article'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': articleType,
    headline: alert.title,
    description: alert.summary,
    datePublished: alert.published_at,
    dateModified: alert.updated_at,
    author: { '@type': 'Organization', name: 'crazy4points' },
    publisher: {
      '@type': 'Organization',
      name: 'crazy4points',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.crazy4points.com/crazy4points-logo.png',
      },
    },
    mainEntityOfPage: `https://www.crazy4points.com/alerts/${alert.slug}`,
    articleSection: alert.type.replace(/_/g, ' '),
  }

  return (
    <article className="rg-major-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 font-ui text-xs font-semibold uppercase tracking-[0.1em] ${badge.cls}`}>
            {badge.label}
          </span>
          {expiry && (
            <span className={`font-ui text-xs font-medium ${isExpired ? 'text-slate-400' : 'text-red-600'}`}>
              {expiry}
            </span>
          )}
        </div>

        {/* Title — sized like an editorial article headline (NYT-ish),
            not a marketing hero. Lighter weight (semibold) so it
            doesn't feel shouted. */}
        <h1 className="mb-6 font-display text-xl font-semibold leading-tight text-[var(--color-primary)] md:text-2xl">
          {alert.title}
        </h1>

        {/* Editorial divider — visually closes the title block. */}
        <hr className="mb-6 border-t border-[var(--color-border-soft)]" />

        {/* Summary */}
        <p className="font-body text-lg leading-relaxed text-[var(--color-text-secondary)]">
          {alert.summary}
        </p>

        {/* Hard whitespace spacer — INLINE STYLE (not Tailwind class)
            so it survives any cached CSS bundle. Renders as a 96px
            tall empty block between the summary and the Why-this-
            matters callout below. If a CSS-class-based mb-* doesn't
            visibly render, this WILL because there's no class name
            for a stale bundle to be missing. */}
        <div aria-hidden style={{ height: '36px' }} />

        {/* Editorial subhead — "Why this matters" in the writer's voice.
            Styled as a pull-quote: soft purple background, eyebrow
            label so it reads as a labeled callout, generous padding.
            Inline-style spacers on either side (36px) for the same
            cache-proof reason as the spacer above. */}
        {alert.why_this_matters && (
          <>
            <div className="rounded-[var(--radius-card)] border-l-4 border-[var(--color-primary)] bg-[var(--color-background-soft)] py-5 pl-6 pr-5">
              <p className="mb-2 font-ui text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                Why this matters
              </p>
              <p className="font-body text-base italic leading-relaxed text-[var(--color-text-primary)]">
                {alert.why_this_matters}
              </p>
            </div>
            <div aria-hidden style={{ height: '36px' }} />
          </>
        )}

        {/* "Terms still developing" notice — set when admin shipped without
            verified T&Cs (e.g. press release only, official page not yet
            published). Signals to readers that specifics could shift. */}
        {alert.terms_waived_reason && (
          <div
            className="mb-6 rounded-[var(--radius-card)] border-l-4 border-amber-500 bg-amber-50 p-4"
            role="note"
          >
            <p className="mb-1 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-900">
              Terms still developing
            </p>
            <p className="font-body text-sm text-amber-900">
              Official program terms weren&apos;t public when this alert went live.
              Confirm details on the program&apos;s site before booking.
            </p>
          </div>
        )}

        {/* Description — rendered as markdown so promo alerts can use the
            hybrid voicey-prose + "What qualifies" bullet block format.
            Card has a brand-purple top accent stripe + white background
            to feel like a real editorial article block rather than a
            soft tinted box. Extra padding for breathing room. */}
        {descriptionHtml && (
          <div className="mb-6 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)]">
            <div className="h-1 bg-[var(--color-primary)]" />
            <div className="p-7 sm:p-8">
              <div
                className="rg-prose font-body text-base leading-relaxed text-[var(--color-text-primary)]"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </div>
          </div>
        )}

        {/* Meta grid */}
        <dl className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
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

        {/* CTA — internal navigation only. Reader stays on the site. */}
        <Link href={ctaHref} className="rg-btn-primary inline-block">
          {ctaLabel} →
        </Link>

      </div>
    </article>
  )
}
