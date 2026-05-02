import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { listProgramsForIndex } from '@/utils/supabase/queries'
import type { ResourceCategory, ResourceCard } from '@/utils/supabase/queries'

export const revalidate = 60

const CATEGORY_LABEL: Record<ResourceCategory, { title: string; lede: string }> = {
  airline: {
    title: 'Airlines',
    lede: 'Frequent flyer programs we cover — sweet spots, transfer partners, and current alerts.',
  },
  alliance: {
    title: 'Alliances',
    lede: 'oneworld, SkyTeam, Star Alliance — partner award rules and lounge access at a glance.',
  },
  hotel: {
    title: 'Hotels',
    lede: 'Hotel loyalty programs — award charts, transfer ratios, and elite benefits worth chasing.',
  },
  credit_card: {
    title: 'Credit Cards',
    lede: 'Cards we cover — earning rates, sign-up bonuses, and which programs they transfer into.',
  },
}

const VALID_CATEGORIES: ResourceCategory[] = ['airline', 'alliance', 'hotel', 'credit_card']

function parseCategory(raw: string | string[] | undefined): ResourceCategory | null {
  const v = Array.isArray(raw) ? raw[0] : raw
  return VALID_CATEGORIES.includes(v as ResourceCategory) ? (v as ResourceCategory) : null
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
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const category = parseCategory(type)
  if (!category) notFound()

  const supabase = createAdminClient()
  const programs = await listProgramsForIndex(supabase, category)
  const meta = CATEGORY_LABEL[category]

  return (
    <div className="rg-container px-6 py-12 md:px-8 md:py-16">
      <header className="mb-10 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold text-[var(--color-primary)] md:text-5xl">
          {meta.title}
        </h1>
        <p className="mt-3 font-body text-lg text-[var(--color-text-secondary)]">{meta.lede}</p>
      </header>

      {programs.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-8 text-center">
          <p className="font-body text-[var(--color-text-secondary)]">
            Reference pages for this category are coming soon.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <li key={p.id}>
              <ProgramCard program={p} category={category} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ProgramCard({ program, category }: { program: ResourceCard; category: ResourceCategory }) {
  const showLoyaltyBadge = category === 'airline' && program.type === 'loyalty_program'
  return (
    <Link
      href={`/programs/${program.slug}`}
      className="block h-full rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)] transition-colors hover:border-[var(--color-primary)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-[var(--color-primary)]">
          {program.name}
        </h2>
        {program.alliance && (
          <span className="shrink-0 rounded bg-[var(--color-background-soft)] px-2 py-0.5 font-ui text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
            {program.alliance}
          </span>
        )}
      </div>
      {showLoyaltyBadge && (
        <p className="mt-1 font-ui text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]">
          Loyalty Program
        </p>
      )}
      {program.transferPartnerCount === 0 && program.joinedLoyaltyProgram ? (
        <p className="mt-4 font-ui text-xs text-[var(--color-text-secondary)]">
          Loyalty program:{' '}
          <span className="font-medium text-[var(--color-primary)]">
            {program.joinedLoyaltyProgram.name} →
          </span>
          {program.alertCount > 0 && (
            <span className="ml-3">
              <span className="font-medium text-[var(--color-text-primary)]">{program.alertCount}</span>{' '}
              alert{program.alertCount === 1 ? '' : 's'}
            </span>
          )}
        </p>
      ) : (
        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-ui text-xs text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-1.5">
            <dt className="font-medium text-[var(--color-text-primary)]">{program.transferPartnerCount}</dt>
            <dd>transfer partner{program.transferPartnerCount === 1 ? '' : 's'}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="font-medium text-[var(--color-text-primary)]">{program.alertCount}</dt>
            <dd>alert{program.alertCount === 1 ? '' : 's'}</dd>
          </div>
        </dl>
      )}
    </Link>
  )
}
