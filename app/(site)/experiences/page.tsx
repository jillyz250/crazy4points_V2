import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { getExperiences } from '@/utils/supabase/queries'
import { isPresaleListing } from '@/lib/experiences/presale'
import { buildMarqueeSections, type MarqueeListing } from '@/lib/experiences/marquee'
import ExperienceCard from '@/components/experiences/ExperienceCard'
import ExperiencesDirectory from '@/components/experiences/ExperiencesDirectory'

// Curated marquee + program directory. Listings refresh daily via the watch cron.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Experiences — Redeem Points & Miles for Unforgettable Moments | Crazy4Points',
  description:
    'The dreamiest experiences you can book with points and miles — private airplane tours, Michelin chef tables, adventure cruises, wellness retreats, and money-can\'t-buy access, plus every program that offers them.',
}

const PROGRAM_LABEL: Record<string, string> = {
  amex: 'Amex', hyatt: 'World of Hyatt', citi: 'Citi', atmos: 'Atmos Rewards',
  delta: 'Delta SkyMiles', accor: 'ALL Accor', 'marriott-bonvoy': 'Marriott Bonvoy',
  united: 'United MileagePlus', chase: 'Chase', hilton: 'Hilton Honors',
  choice: 'Choice Privileges', 'flying-blue': 'Flying Blue', wyndham: 'Wyndham Rewards',
}

function shortLoc(loc: string | null): string | null {
  if (!loc) return null
  const parts = loc.split(',').map((p) => p.trim()).filter(Boolean)
  return parts.slice(-2).join(', ').replace(/\b\d{4,}\b/g, '').replace(/\s+/g, ' ').trim() || parts[0] || null
}

export default async function ExperiencesPage() {
  const supabase = createAdminClient()
  const experiences = await getExperiences(supabase)

  // Hide listings whose booking window has closed (close_date is a cutoff instant).
  const nowIso = new Date().toISOString()
  const { data: rows } = await supabase
    .from('experience_listings')
    .select(
      'id, title, category, location, format, program_slug, source_platform, points_required, current_bid, minimum_bid, event_date, close_date, detail_url, image_url, first_seen_at',
    )
    .eq('status', 'active')
    .or(`close_date.is.null,close_date.gte.${nowIso}`)
    .order('first_seen_at', { ascending: false })
    .limit(600)

  const all = (rows ?? []) as (MarqueeListing & { first_seen_at: string | null })[]
  const marqueeRows = all.filter((l) => !isPresaleListing(l.category))
  const presales = all.filter((l) => isPresaleListing(l.category)).slice(0, 12)

  const { us, intl, more } = buildMarqueeSections(marqueeRows)

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)]">
        <div className="rg-container py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="mb-3 font-ui text-sm uppercase tracking-widest text-[var(--color-accent)]">Experiences</p>
            <h1 className="mb-4 font-display text-4xl leading-tight text-[var(--color-primary)] md:text-5xl">
              Your points are a passport to the unforgettable.
            </h1>
            <p className="font-body text-lg text-[var(--color-text-primary)]">
              Not just flights and hotel nights. A private airplane tour over Monument Valley, a chef&apos;s
              counter at a Michelin table, an adventure cruise through Costa Rica, a temple blessing in Bali.
              Here are the dreamiest experiences you can book with points and miles right now.
            </p>
            <p className="mt-3 font-body text-sm text-[var(--color-text-secondary)]">
              Prices and availability are set by each program and change often. Always confirm on the official
              site before you plan or transfer points.
            </p>
          </div>
        </div>
      </section>

      <div className="rg-container">
        {/* US marquee */}
        {us.length > 0 && (
          <section className="rg-sub-section">
            <SectionHead title="In the U.S." count={us.length} />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {us.map((g) => (
                <ExperienceCard key={g.key} group={g} />
              ))}
            </div>
          </section>
        )}

        {/* Non-US marquee */}
        {intl.length > 0 && (
          <section className="rg-sub-section">
            <SectionHead title="Beyond the U.S." count={intl.length} />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {intl.map((g) => (
                <ExperienceCard key={g.key} group={g} />
              ))}
            </div>
          </section>
        )}

        {/* More experiences — the long tail as compact links */}
        {more.length > 0 && (
          <section className="rg-sub-section">
            <SectionHead title="More experiences" />
            <ul className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
              {more.map((l) => {
                const label = (l.program_slug && PROGRAM_LABEL[l.program_slug]) || l.source_platform || ''
                const loc = shortLoc(l.location)
                const inner = (
                  <>
                    <span className="text-[var(--color-primary)] group-hover/mi:text-[var(--color-accent)]">{l.title}</span>
                    <span className="font-ui text-xs text-[var(--color-text-secondary)]">
                      {[loc, label].filter(Boolean).join(' · ')}
                    </span>
                  </>
                )
                return (
                  <li key={l.id} className="border-b border-[var(--color-border-soft)] py-2.5">
                    {l.detail_url ? (
                      <a
                        href={l.detail_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/mi flex flex-col gap-0.5 font-body text-sm"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex flex-col gap-0.5 font-body text-sm">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* Presales — tucked, cardholder early access */}
        {presales.length > 0 && (
          <section className="rg-sub-section">
            <SectionHead title="Cardholder presales & early access" />
            <p className="mb-4 max-w-2xl font-body text-sm text-[var(--color-text-secondary)]">
              Concerts, shows, and games where your card unlocks tickets before the general public. Access
              only, no points required, just the right card in your wallet.
            </p>
            <ul className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
              {presales.map((l) => {
                const label = (l.program_slug && PROGRAM_LABEL[l.program_slug]) || l.source_platform || ''
                const inner = (
                  <>
                    <span className="text-[var(--color-primary)] group-hover/pi:text-[var(--color-accent)]">{l.title}</span>
                    <span className="font-ui text-xs text-[var(--color-text-secondary)]">{label}</span>
                  </>
                )
                return (
                  <li key={l.id} className="border-b border-[var(--color-border-soft)] py-2.5">
                    {l.detail_url ? (
                      <a
                        href={l.detail_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/pi flex flex-col gap-0.5 font-body text-sm"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex flex-col gap-0.5 font-body text-sm">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* Directory footer — the quiet "how to access them all" */}
        <section className="rg-sub-section">
          <SectionHead title="Every program & how it works" />
          <p className="mb-6 max-w-2xl font-body text-sm text-[var(--color-text-secondary)]">
            The full list of programs that trade points, miles, or cardholder status for experiences, split
            into redeem-your-points programs and cardholder access &amp; presales.
          </p>
          <ExperiencesDirectory experiences={experiences} />
        </section>

        <p className="mb-16 max-w-3xl font-body text-sm text-[var(--color-text-secondary)]">
          Crazy4Points is not affiliated with these experience providers and does not sell, book, or guarantee
          any experience. Availability, point costs, and pricing are set by the provider and change often.
          Confirm all details with the provider before booking or transferring points.
        </p>
      </div>
    </main>
  )
}

function SectionHead({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-6 flex items-baseline gap-3 border-b border-[var(--color-border-soft)] pb-2">
      <h2 className="font-display text-2xl text-[var(--color-primary)] md:text-3xl">{title}</h2>
      {count != null && <span className="font-ui text-sm text-[var(--color-text-secondary)]">{count}</span>}
    </div>
  )
}
