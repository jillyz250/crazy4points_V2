import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { listCardsForFinder } from '@/utils/supabase/queries'
import CardFinder, { type ProgramOption } from '@/components/cards/CardFinder'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Credit Card Finder',
  description:
    'Find the right points-and-miles credit card. Filter by the program you want, benefits, annual fee, network, and issuer — and see which cards earn a program directly versus by transfer.',
  alternates: { canonical: 'https://www.crazy4points.com/cards' },
}

export default async function CardFinderPage() {
  const supabase = createAdminClient()
  const [cards, { data: progs }] = await Promise.all([
    listCardsForFinder(supabase),
    supabase.from('programs').select('slug, name, transfer_partners_outbound').eq('is_active', true),
  ])

  // programSlug -> source-currency slugs that transfer INTO it.
  const transferSources: Record<string, string[]> = {}
  for (const p of (progs ?? []) as Array<{ slug: string; name: string; transfer_partners_outbound: Array<{ from_slug: string }> | null }>) {
    const froms = (p.transfer_partners_outbound ?? []).map((r) => r.from_slug).filter(Boolean)
    if (froms.length) transferSources[p.slug] = Array.from(new Set(froms))
  }

  // Target options = programs you can actually land points in via these cards:
  // every co-brand + currency on a card, plus any program with inbound transfers.
  const optionMap = new Map<string, ProgramOption>()
  for (const c of cards) {
    if (c.coBrand) optionMap.set(c.coBrand.slug, c.coBrand)
    if (c.currency) optionMap.set(c.currency.slug, c.currency)
  }
  const nameBySlug = new Map<string, string>()
  for (const p of (progs ?? []) as Array<{ slug: string; name: string }>) nameBySlug.set(p.slug, p.name)
  for (const slug of Object.keys(transferSources)) {
    if (!optionMap.has(slug) && nameBySlug.has(slug)) optionMap.set(slug, { slug, name: nameBySlug.get(slug)! })
  }
  const programOptions = Array.from(optionMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="rg-container px-6 py-12 md:px-8 md:py-16">
      <header style={{ maxWidth: '46rem', marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.75rem' }}>Credit Card Finder</h1>
        <p style={{ fontSize: '1.0625rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Start with the program you want points in — we&rsquo;ll split cards into the ones that earn it
          directly and the ones whose flexible points transfer in. Or skip the program and filter by
          benefits, fee, network, and issuer.
        </p>
      </header>
      <CardFinder cards={cards} programOptions={programOptions} transferSources={transferSources} />
    </div>
  )
}
