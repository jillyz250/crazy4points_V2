import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { getAlertsByProgramSlug, getAllPrograms, getPropertiesForProgram, getCardsThatEarnIntoProgram, getPartnerRedemptionsByCurrency } from '@/utils/supabase/queries'
import type { AlertWithPrograms, HotelProperty, CardThatEarnsIn, PartnerRedemptionWithPrograms } from '@/utils/supabase/queries'
import AlertsGridSB from '@/components/alerts/AlertsGridSB'
import ExpiredAlertsList from '@/components/alerts/ExpiredAlertsList'
import { isAlertActive, isAlertFresh } from '@/lib/alertExpiry'
import ProgramPageHero from '@/components/programs/ProgramPageHero'
import PropertiesTable from '@/components/programs/PropertiesTable'
import CardsThatEarnIntoProgram from '@/components/cards/CardsThatEarnIntoProgram'
import ActivePromosSection from '@/components/programs/ActivePromosSection'
import LiveBarsHero, { OTHER_LIVE_TYPES } from '@/components/programs/LiveBarsHero'
import SimpleTileGrid from '@/components/programs/SimpleTileGrid'
import IntroBlock from '@/components/programs/IntroBlock'
import { getActivePromosForProgram, type PromoReward } from '@/utils/supabase/promoQueries'
import { expandIntroTokens } from '@/utils/programs/expandIntroTokens'

// Editorial content; rarely changes intra-day. Admin publish flow can call
// revalidatePath() to bust this cache on demand, so 1 hour is safe.
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const supabase = createAdminClient()
    const { program } = await getAlertsByProgramSlug(supabase, slug)
    // Expand {<slug>_airline_count} / _hotel_count / _partner_count tokens
    // before truncating — so SEO description shows real counts, not raw tokens.
    const expandedIntro = await expandIntroTokens(program.intro, supabase)
    // Per-program meta description — uses intro (truncated to ~155 chars)
    // when set, falls back to a sensible generic. Search engines surface
    // this verbatim under the SERP title; AI assistants weight it heavily.
    const cleanIntro = expandedIntro
      ? expandedIntro.replace(/\s+/g, ' ').trim().slice(0, 155)
      : null
    const description =
      cleanIntro ??
      `${program.name} — points, sweet spots, transfer partners, and current alerts. Curated by crazy4points.`
    const url = `https://www.crazy4points.com/programs/${slug}`
    return {
      title: `${program.name}`,
      description,
      alternates: { canonical: url },
      openGraph: {
        title: `${program.name}`,
        description,
        url,
        type: 'website',
        siteName: 'crazy4points',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${program.name}`,
        description,
      },
    }
  } catch {
    return { title: 'Program' }
  }
}

function matchesSearch(alert: AlertWithPrograms, query: string): boolean {
  const q = query.toLowerCase()
  return (
    alert.title.toLowerCase().includes(q) ||
    (alert.summary?.toLowerCase().includes(q) ?? false) ||
    (alert.description?.toLowerCase().includes(q) ?? false) ||
    alert.type.toLowerCase().includes(q)
  )
}

export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string; show?: string }>
}) {
  const { slug } = await params
  const { q = '', show = 'active' } = await searchParams

  const supabase = createAdminClient()

  let program
  let allAlerts: AlertWithPrograms[]
  let programNameBySlug = new Map<string, string>()
  let homeCarrierSlugs: string[] = []

  try {
    const [result, allPrograms] = await Promise.all([
      getAlertsByProgramSlug(supabase, slug),
      getAllPrograms(supabase),
    ])
    program = result.program
    allAlerts = result.alerts
    programNameBySlug = new Map(allPrograms.map((p) => [p.slug, p.name]))
    // Home carriers = programs that name THIS program as their parent
    // (Air France / KLM → Flying Blue; BA / Iberia → BA Avios). Used by
    // ProgramPageHero to emphasize the operator pills.
    homeCarrierSlugs = allPrograms
      .filter((p) => p.parent_program_slug === slug)
      .map((p) => p.slug)
    // Hide skeleton-only rows (seeded for slug-resolution but no editorial
    // authored). The moment any field is saved in admin, content_updated_at
    // is set and the page becomes publicly accessible automatically.
    if (!program.content_updated_at) {
      notFound()
    }
    // Resolve any {<slug>_airline_count} / _hotel_count / _partner_count tokens
    // in the intro so downstream renderers (IntroBlock, JSON-LD description,
    // markdown export) all see the same expanded text.
    program.intro = await expandIntroTokens(program.intro, supabase)
  } catch {
    notFound()
  }

  // Per-property data: only meaningful for hotel programs. Skip the query
  // entirely for non-hotels — even if a row existed, we wouldn't render it.
  let properties: HotelProperty[] = []
  if (program.type === 'hotel') {
    try {
      properties = await getPropertiesForProgram(supabase, program.id)
    } catch (err) {
      console.error('[programs/[slug]] getPropertiesForProgram failed:', err)
    }
  }

  // Cards that earn into this program (direct co-brand + transfer-partner cards).
  // Auto-derived from credit_cards.{co_brand_program_id, currency_program_id};
  // appears for any program that has at least one matching card.
  let earnIntoCards: CardThatEarnsIn[] = []
  try {
    earnIntoCards = await getCardsThatEarnIntoProgram(supabase, program.id)
  } catch (err) {
    console.error('[programs/[slug]] getCardsThatEarnIntoProgram failed:', err)
  }

  // Partner redemptions — currency direction only. Drives bilateral-partner
  // pills on the hero (operating-carrier sub-programs derived from this list).
  // The full "where to spend / how to book" tables moved out of this page and
  // live in the Ways To Book Tool — readers click through there for the full
  // matrix instead of reading two long tables here.
  let redemptionsAsCurrency: PartnerRedemptionWithPrograms[] = []
  if (program.type === 'airline' || program.type === 'loyalty_program') {
    try {
      redemptionsAsCurrency = await getPartnerRedemptionsByCurrency(supabase, program.id)
    } catch (err) {
      console.error('[programs/[slug]] getPartnerRedemptionsByCurrency failed:', err)
    }
  }

  // Active scraped promos (Promo Intelligence Engine — Phase 2).
  // Empty array if none are published yet; section auto-hides.
  let activePromos: PromoReward[] = []
  try {
    activePromos = await getActivePromosForProgram(supabase, program.id)
  } catch (err) {
    console.error('[programs/[slug]] getActivePromosForProgram failed:', err)
  }

  const nowMs = Date.now()

  // Split active vs expired. Treats end_date as inclusive end-of-day
  // (see lib/alertExpiry.ts) — an alert with end_date 2026-05-03 stays
  // active through the entire May 3 in any timezone.
  const active = allAlerts.filter((a) => isAlertActive(a.end_date, nowMs))
  const expired = allAlerts.filter((a) => a.end_date && !isAlertActive(a.end_date, nowMs))

  // LiveNow hero inputs — active transfer bonuses targeting THIS program
  // as destination (used for the stack auto-detection). The most-common
  // discount % across active promos drives the auto-stack math.
  const liveTransferBonuses = active.filter(
    (a) => a.type === 'transfer_bonus' && a.primary_program_id === program.id,
  )
  // Other urgent / recent live alerts for the hero — surfaces buy-miles
  // sales, LTOs, status promos, and news-style changes (program_change,
  // devaluation, etc.) where this program is the primary subject.
  //
  // Freshness model:
  //  - Promo types with end_date: surface until end_date end-of-day
  //  - News types without end_date: surface for a per-type window after
  //    published_at (see FRESHNESS_WINDOW_DAYS in lib/alertExpiry.ts —
  //    program_change = 365d, devaluation = 90d, industry_news = 30d, etc.)
  //
  // Sorted by effective expiry proximity (most-urgent first). Capped to
  // avoid hero overflow.
  const liveOtherAlerts = allAlerts
    .filter(
      (a) =>
        OTHER_LIVE_TYPES.includes(a.type) &&
        a.primary_program_id === program.id &&
        isAlertFresh({ end_date: a.end_date, type: a.type, published_at: a.published_at }, nowMs),
    )
    .sort((a, b) => {
      const ae = a.end_date ? new Date(a.end_date).getTime() : Number.POSITIVE_INFINITY
      const be = b.end_date ? new Date(b.end_date).getTime() : Number.POSITIVE_INFINITY
      return ae - be
    })
    .slice(0, 3)
  const promosDiscountPercent = mostCommonDiscountPercent(activePromos)

  const activeFiltered = q ? active.filter((a) => matchesSearch(a, q)) : active
  const expiredFiltered = q ? expired.filter((a) => matchesSearch(a, q)) : expired
  const filteredCount =
    show === 'active'
      ? activeFiltered.length
      : show === 'expired'
        ? expiredFiltered.length
        : activeFiltered.length + expiredFiltered.length

  const tabStyle = (active: boolean) => ({
    display: 'inline-block' as const,
    padding: '0.35rem 0.9rem',
    borderRadius: 'var(--radius-ui)',
    fontSize: '0.8125rem',
    fontWeight: 600 as const,
    fontFamily: 'var(--font-ui)',
    textDecoration: 'none',
    background: active ? 'var(--color-primary)' : 'transparent',
    color: active ? '#fff' : 'var(--color-text-secondary)',
    border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border-soft)'}`,
  })

  const hrefWith = (updates: Record<string, string>) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('show', show)
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    return `/programs/${slug}?${params.toString()}`
  }

  // JSON-LD WebPage schema with the program as the main entity. Tells
  // Google + AI assistants that crazy4points is the canonical reference
  // for this program's points / partners / sweet-spot data.
  const programDescription = (program.intro ?? program.description ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600)
  const url = `https://www.crazy4points.com/programs/${slug}`
  const aboutType =
    program.type === 'credit_card'
      ? 'CreditCard'
      : program.type === 'alliance'
        ? 'Organization'
        : 'Service'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${program.name}`,
    url,
    inLanguage: 'en-US',
    isPartOf: { '@type': 'WebSite', name: 'crazy4points', url: 'https://www.crazy4points.com' },
    about: {
      '@type': aboutType,
      name: program.name,
      ...(programDescription ? { description: programDescription } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'crazy4points',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.crazy4points.com/crazy4points-logo.png',
      },
    },
  }

  return (
    <section className="rg-major-section !pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="rg-container">

        {/* LIVE bars render ABOVE the hero so the first thing readers
            see is what's hot RIGHT NOW. Bars auto-hide when no signals. */}
        <LiveBarsHero
          programName={program.name}
          programType={program.type}
          transferBonus={liveTransferBonuses[0] ?? null}
          otherAlerts={liveOtherAlerts}
          promosCount={activePromos.length}
          promosDiscountPercent={promosDiscountPercent}
          promosChildren={
            activePromos.length > 0 ? (
              <ActivePromosSection
                promos={activePromos}
                programName={program.name}
                programChartUrl={program.partner_chart_url}
              />
            ) : null
          }
        />

        {/* Hero header (badges + section TOC) — sits below LIVE bars. */}
        {/* `partners` prop derives distinct operating-carrier programs from */}
        {/* redemptionsAsCurrency (no extra query) so the hero can render */}
        {/* bilateral-partnership pills (e.g. JetBlue → United Blue Sky). */}
        <ProgramPageHero
          program={program}
          activeAlertCount={active.length}
          totalAlertCount={allAlerts.length}
          partners={Array.from(
            new Map(
              redemptionsAsCurrency
                .filter((r) => r.operating_carrier?.slug && r.operating_carrier?.name)
                .map((r) => [r.operating_carrier!.slug, { slug: r.operating_carrier!.slug, name: r.operating_carrier!.name }])
            ).values()
          ).sort((a, b) => a.name.localeCompare(b.name))}
          homeCarrierSlugs={homeCarrierSlugs}
          sections={[
            ...(activePromos.length > 0 ? [{ id: 'active-promos', label: 'Active promos' }] : []),
            ...(program.intro ? [{ id: 'intro', label: 'Intro' }] : []),
            ...(program.award_chart ? [{ id: 'award-chart', label: 'Award chart' }] : []),
            ...((program.award_category_chart?.length ?? 0) > 0 && program.type !== 'alliance' ? [{ id: 'category-chart', label: 'Category chart' }] : []),
            ...((program.transfer_partners_outbound?.length ?? 0) > 0 && program.type !== 'alliance' ? [{ id: 'transfer-partners', label: 'Transfer partners' }] : []),
            ...((program.transfer_partners?.length ?? 0) > 0 && program.type !== 'alliance' ? [{ id: 'ways-to-earn', label: 'Ways to earn more' }] : []),
            ...(program.type === 'alliance' && (program.member_programs?.length ?? 0) > 0 ? [{ id: 'member-airlines', label: 'Member airlines' }] : []),
            ...(program.how_to_spend ? [{ id: 'how-to-spend', label: 'How to spend' }] : []),
            ...(program.sweet_spots ? [{ id: 'sweet-spots', label: 'Sweet spots' }] : []),
            ...((program.tier_benefits?.length ?? 0) > 0 ? [{ id: 'tiers', label: 'Tiers' }] : []),
            ...((program.free_night_certs?.length ?? 0) > 0 && program.type !== 'alliance' ? [{ id: 'free-night-certs', label: 'Free nights' }] : []),
            ...(program.lounge_access ? [{ id: 'lounge-access', label: 'Lounges' }] : []),
            ...(program.quirks ? [{ id: 'quirks', label: 'Tips' }] : []),
            ...(properties.length > 0 ? [{ id: 'properties', label: 'Hotels' }] : []),
            ...(earnIntoCards.length > 0 ? [{ id: 'earn-into', label: 'Cards' }] : []),
            ...(allAlerts.length > 0 ? [{ id: 'alerts', label: 'Alerts' }] : []),
          ]}
        />

        {/* Intro paragraph stays visible — it's the on-ramp. */}
        <IntroBlock intro={program.intro} />

        {/* Simple uniform-grid tile cards for reference sections.
            Each tile click expands inline (server-rendered <details>). */}
        <SimpleTileGrid program={program} programNameBySlug={programNameBySlug} />

        {/* Per-property table — hotels only. */}
        {properties.length > 0 && (
          <section
            id="properties"
            style={{
              marginBottom: '2.5rem',
              scrollMarginTop: '2rem',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                marginBottom: '0.5rem',
              }}
            >
              Hotels
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
                marginBottom: '1rem',
              }}
            >
              Every {program.name} hotel you can book today. Sort, filter, and search by name, brand, city, region, or category. Categories shift over time — verify on the program&apos;s site before booking. Coming-soon properties are hidden by default; toggle them on if you want a peek.
            </p>
            <PropertiesTable properties={properties} programName={program.name} />
          </section>
        )}

        {/* Cards that earn into this program — auto-derived. */}
        {earnIntoCards.length > 0 && (
          <section
            id="earn-into"
            style={{
              marginBottom: '2.5rem',
              scrollMarginTop: '2rem',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                marginBottom: '0.5rem',
              }}
            >
              Cards that earn into {program.name}
            </h2>
            <CardsThatEarnIntoProgram cards={earnIntoCards} programName={program.name} />
          </section>
        )}

        {/* Alerts heading — only show when content above exists, to mark transition */}
        {(program.intro || (program.transfer_partners?.length ?? 0) > 0 || (program.transfer_partners_outbound?.length ?? 0) > 0 || program.sweet_spots || program.quirks || properties.length > 0) && (
          <h2
            id="alerts"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: '0.5rem',
              marginTop: '1rem',
              scrollMarginTop: '2rem',
            }}
          >
            Alerts
          </h2>
        )}

        {/* Search */}
        <form method="GET" action={`/programs/${slug}`} style={{ marginBottom: '1.25rem' }}>
          <input type="hidden" name="show" value={show} />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder={`Search ${program.name} alerts…`}
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '0.5rem 0.875rem',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-ui)',
              fontSize: '1rem',
              fontFamily: 'var(--font-body)',
              background: 'var(--color-background)',
              color: 'var(--color-text-primary)',
            }}
          />
        </form>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <a href={hrefWith({ show: 'active' })} style={tabStyle(show === 'active')}>
            Active ({active.length})
          </a>
          <a href={hrefWith({ show: 'expired' })} style={tabStyle(show === 'expired')}>
            Expired ({expired.length})
          </a>
          <a href={hrefWith({ show: 'all' })} style={tabStyle(show === 'all')}>
            All ({allAlerts.length})
          </a>
        </div>

        {/* Results */}
        {q && (
          <p className="mb-4 font-body text-sm text-[var(--color-text-secondary)]">
            {filteredCount} result{filteredCount !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
            {' '}
            <a href={`/programs/${slug}?show=${show}`} style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontSize: 'inherit' }}>
              Clear search
            </a>
          </p>
        )}

        {show === 'active' && <AlertsGridSB alerts={activeFiltered} />}

        {show === 'expired' && (
          <div>
            <h2 className="mb-4 font-display text-2xl font-bold">Archived alerts</h2>
            <p className="mb-4 font-body text-sm text-[var(--color-text-secondary)]">
              These offers have ended but live on here for reference. Click any title to open the original alert.
            </p>
            <ExpiredAlertsList alerts={expiredFiltered} />
          </div>
        )}

        {show === 'all' && (
          <>
            <AlertsGridSB alerts={activeFiltered} />
            {expiredFiltered.length > 0 && (
              <div style={{ marginTop: '3rem' }}>
                <h2 className="mb-3 font-display text-2xl font-bold">Archived alerts</h2>
                <p className="mb-4 font-body text-sm text-[var(--color-text-secondary)]">
                  Past offers for {program.name} — searchable, click to view the original.
                </p>
                <ExpiredAlertsList alerts={expiredFiltered} />
              </div>
            )}
          </>
        )}

        {/* Editorial disclaimer — only when there's editorial content to disclaim */}
        {program.content_updated_at && (
          <div
            style={{
              marginTop: '3rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--color-border-soft)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.55,
            }}
          >
            <p style={{ margin: 0, marginBottom: '0.5rem' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>
                Last reviewed: {new Date(program.content_updated_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </strong>
            </p>
            <p style={{ margin: 0 }}>
              Loyalty programs change rules, fees, transfer ratios, and award pricing all the time — sometimes without warning. We do our best to keep these pages current, but the program&apos;s own site is always the final word. Always confirm specifics directly with {program.name} before transferring miles or booking an award. Treat anything on this page as a starting point, not a guarantee. Crazy4Points is not responsible for actions taken based on information here — see our <a href="/terms" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Terms of Service</a> for full details.
            </p>
          </div>
        )}

      </div>
    </section>
  )
}

/**
 * Most-common discount % across an array of active promos. Used by the
 * LiveNow auto-stack math (a program with all-25%-off promos drives a
 * 25% input to the stack calc).
 */
function mostCommonDiscountPercent(promos: PromoReward[]): number | null {
  if (promos.length === 0) return null
  const counts = new Map<number, number>()
  for (const p of promos) {
    const d = p.intel_discount_percent
    if (d == null) continue
    const rounded = Math.round(d)
    counts.set(rounded, (counts.get(rounded) ?? 0) + 1)
  }
  if (counts.size === 0) return null
  let best: number | null = null
  let bestCount = 0
  for (const [pct, n] of counts) {
    if (n > bestCount) {
      bestCount = n
      best = pct
    }
  }
  return best
}
