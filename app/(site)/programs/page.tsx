import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { listProgramsForIndex, getResourceNavCounts } from '@/utils/supabase/queries'
import type { ResourceCategory, ResourceCard, Alliance } from '@/utils/supabase/queries'
import { ALLIANCE_LABEL, ALLIANCE_BADGE_COLOR } from '@/lib/alliance'

export const revalidate = 60

const CATEGORY_LABEL: Record<ResourceCategory, { title: string; lede: string; cta: string }> = {
  airline: {
    title: 'Airlines',
    lede: 'Frequent flyer programs we cover — sweet spots, transfer partners, and current alerts.',
    cta: 'View program',
  },
  alliance: {
    title: 'Alliances',
    lede: 'oneworld, SkyTeam, Star Alliance — partner award rules and lounge access at a glance.',
    cta: 'View alliance',
  },
  hotel: {
    title: 'Hotels',
    lede: 'Hotel loyalty programs — award charts, transfer ratios, and elite benefits worth chasing.',
    cta: 'View program',
  },
  credit_card: {
    title: 'Credit Cards',
    lede: 'Cards we cover — earning rates, sign-up bonuses, and which programs they transfer into.',
    cta: 'View card',
  },
}

const VALID_CATEGORIES: ResourceCategory[] = ['airline', 'alliance', 'hotel', 'credit_card']
const FILTERABLE_ALLIANCES: Alliance[] = ['oneworld', 'skyteam', 'star_alliance']

function parseCategory(raw: string | string[] | undefined): ResourceCategory | null {
  const v = Array.isArray(raw) ? raw[0] : raw
  return VALID_CATEGORIES.includes(v as ResourceCategory) ? (v as ResourceCategory) : null
}

function parseAlliance(raw: string | string[] | undefined): Alliance | null {
  const v = Array.isArray(raw) ? raw[0] : raw
  return FILTERABLE_ALLIANCES.includes(v as Alliance) ? (v as Alliance) : null
}

function formatUpdated(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}): Promise<Metadata> {
  const { type } = await searchParams
  const cat = parseCategory(type)
  if (!cat) return { title: 'Programs — crazy4points' }
  const meta = CATEGORY_LABEL[cat]
  const url = `https://www.crazy4points.com/programs?type=${cat}`
  return {
    title: `${meta.title} — crazy4points`,
    description: meta.lede,
    alternates: { canonical: url },
    openGraph: {
      title: `${meta.title} — crazy4points`,
      description: meta.lede,
      url,
      type: 'website',
      siteName: 'crazy4points',
    },
  }
}

export default async function ProgramsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; alliance?: string }>
}) {
  const params = await searchParams
  const category = parseCategory(params.type)
  if (!category) notFound()
  const allianceFilter = category === 'airline' ? parseAlliance(params.alliance) : null

  const supabase = createAdminClient()
  const [programs, navCounts] = await Promise.all([
    listProgramsForIndex(supabase, category, allianceFilter),
    getResourceNavCounts(supabase),
  ])
  const meta = CATEGORY_LABEL[category]

  // JSON-LD ItemList — helps Google render this as a sitelinks-style result
  // and signals to AI assistants that this is a directory of related pages.
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${meta.title} — crazy4points`,
    description: meta.lede,
    numberOfItems: programs.length,
    itemListElement: programs.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://www.crazy4points.com/programs/${p.slug}`,
      name: p.name,
    })),
  }

  return (
    <div className="rg-container px-6 py-12 md:px-8 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <header className="mb-6 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold text-[var(--color-primary)] md:text-5xl">
          {meta.title}
        </h1>
        <p className="mt-3 font-body text-lg text-[var(--color-text-secondary)]">{meta.lede}</p>
      </header>

      <CategoryTabs current={category} navCounts={navCounts} />

      {category === 'airline' && (
        <AllianceFilter current={allianceFilter} />
      )}

      {programs.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-8 text-center">
          <p className="font-body text-[var(--color-text-secondary)]">
            {allianceFilter
              ? `No ${ALLIANCE_LABEL[allianceFilter]} programs yet. Check back soon.`
              : 'Reference pages for this category are coming soon.'}
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <li key={p.id}>
              <ProgramCard program={p} category={category} cta={meta.cta} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CategoryTabs({
  current,
  navCounts,
}: {
  current: ResourceCategory
  navCounts: Record<ResourceCategory, number>
}) {
  const tabs: { key: ResourceCategory; label: string }[] = [
    { key: 'airline', label: 'Airlines' },
    { key: 'alliance', label: 'Alliances' },
    { key: 'hotel', label: 'Hotels' },
    { key: 'credit_card', label: 'Credit Cards' },
  ]
  return (
    <nav
      aria-label="Program categories"
      className="mb-6 flex flex-wrap gap-1 border-b border-[var(--color-border-soft)]"
    >
      {tabs.map((tab) => {
        const count = navCounts[tab.key] ?? 0
        const isCurrent = tab.key === current
        const isDisabled = count === 0 && !isCurrent
        const className = `font-ui text-xs font-medium uppercase tracking-[0.12em] px-4 py-3 -mb-px border-b-2 transition-colors ${
          isCurrent
            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
            : isDisabled
              ? 'border-transparent text-[var(--color-text-secondary)] opacity-40 cursor-not-allowed'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-border-soft)]'
        }`
        return isDisabled ? (
          <span key={tab.key} className={className} aria-disabled="true">
            {tab.label}
          </span>
        ) : (
          <Link
            key={tab.key}
            href={`/programs?type=${tab.key}`}
            className={className}
            aria-current={isCurrent ? 'page' : undefined}
          >
            {tab.label}
            {count > 0 && (
              <span className="ml-1.5 font-medium text-[var(--color-text-secondary)]">{count}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function AllianceFilter({ current }: { current: Alliance | null }) {
  const chips: { key: Alliance | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'oneworld', label: 'oneworld' },
    { key: 'skyteam', label: 'SkyTeam' },
    { key: 'star_alliance', label: 'Star Alliance' },
  ]
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
        Filter
      </span>
      {chips.map((chip) => {
        const isCurrent = chip.key === 'all' ? current === null : chip.key === current
        const href =
          chip.key === 'all' ? '/programs?type=airline' : `/programs?type=airline&alliance=${chip.key}`
        const baseClass = 'rounded-full px-3 py-1 font-ui text-xs font-medium transition-colors'
        const stateClass = isCurrent
          ? 'bg-[var(--color-primary)] text-white'
          : 'bg-[var(--color-background-soft)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-soft)]'
        return (
          <Link key={chip.key} href={href} className={`${baseClass} ${stateClass}`}>
            {chip.label}
          </Link>
        )
      })}
    </div>
  )
}

function ProgramCard({
  program,
  category,
  cta,
}: {
  program: ResourceCard
  category: ResourceCategory
  cta: string
}) {
  const showLoyaltyBadge = category === 'airline' && program.type === 'loyalty_program'
  const allianceColor = program.alliance ? ALLIANCE_BADGE_COLOR[program.alliance] : null
  const allianceLabel = program.alliance ? ALLIANCE_LABEL[program.alliance] : null
  const hubChips = (program.hubs ?? []).slice(0, 4)
  const updated = formatUpdated(program.contentUpdatedAt)

  return (
    <Link
      href={`/programs/${program.slug}`}
      data-track-event="program_index_click"
      data-track-params={JSON.stringify({
        category,
        slug: program.slug,
        program_type: program.type,
        alliance: program.alliance ?? 'none',
      })}
      className="group flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-[var(--color-primary)]">
            {program.name}
          </h2>
          {showLoyaltyBadge && (
            <p className="mt-0.5 font-ui text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)]">
              Loyalty Program
            </p>
          )}
        </div>
        {allianceColor && allianceLabel && program.alliance !== 'none' && program.alliance !== 'other' && (
          <span
            className="shrink-0 rounded px-2 py-1 font-ui text-[10px] font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: allianceColor }}
          >
            {allianceLabel}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1.5 font-ui text-xs text-[var(--color-text-secondary)]">
        {category === 'airline' && hubChips.length > 0 && (
          <p>
            <span className="font-medium text-[var(--color-text-primary)]">Hubs:</span>{' '}
            {hubChips.join(' · ')}
          </p>
        )}
        {category === 'alliance' && program.memberCount !== null && program.memberCount > 0 && (
          <p>
            <span className="font-medium text-[var(--color-text-primary)]">{program.memberCount}</span>{' '}
            member airline{program.memberCount === 1 ? '' : 's'}
          </p>
        )}
        {program.transferPartnerCount === 0 && program.joinedLoyaltyProgram ? (
          <p>
            Loyalty program:{' '}
            <span className="font-medium text-[var(--color-primary)]">
              {program.joinedLoyaltyProgram.name} →
            </span>
          </p>
        ) : (
          program.transferPartnerCount > 0 && (
            <p>
              <span className="font-medium text-[var(--color-text-primary)]">{program.transferPartnerCount}</span>{' '}
              transfer partner{program.transferPartnerCount === 1 ? '' : 's'}
            </p>
          )
        )}
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border-soft)] pt-3">
          <div className="flex items-center gap-2">
            {program.alertCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 font-ui text-[11px] font-semibold text-red-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                {program.alertCount} active alert{program.alertCount === 1 ? '' : 's'}
              </span>
            ) : updated ? (
              <span className="font-ui text-[11px] text-[var(--color-text-secondary)]">
                Updated {updated}
              </span>
            ) : null}
          </div>
          <span className="font-ui text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)] group-hover:underline">
            {cta} →
          </span>
        </div>
      </div>
    </Link>
  )
}
