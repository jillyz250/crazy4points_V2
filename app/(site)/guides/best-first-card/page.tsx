import type { Metadata } from 'next'
import Link from 'next/link'
import { GuideDateline } from '@/components/guides/GuideDateline'
import { TRAVELER_TYPES, type Pick } from '@/lib/travelerTypes'

export const metadata: Metadata = {
  title: 'The Best First Card for Every Type of Traveler',
  description:
    'You know your travel why. Now the one question that matters: which card should you actually apply for? One anchor pick for each of the five traveler types, grounded in real card data.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/best-first-card' },
  openGraph: {
    title: 'The Best First Card for Every Type of Traveler',
    description:
      'Skip the 12-card wallet. Here is the one card to start with for each traveler type, plus a couple of worthy alternatives.',
    url: 'https://www.crazy4points.com/guides/best-first-card',
    type: 'article',
    siteName: 'crazy4points',
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 86400

const INTRO = [
  `You've found your why. Now for the only question that actually matters when you're starting out: which card do you apply for? Not which twelve. Which one.`,
  `Below is a single anchor pick for each of the five traveler types, plus a couple of alternatives if the anchor isn't quite you. Every fee, welcome bonus, and perk here is pulled straight from the card's real terms, and none of these picks are here because they pay us. They're here because they fit.`,
]


const h2 = 'font-display text-2xl font-semibold text-[var(--color-primary)] md:text-[1.75rem]'
const label = 'mt-5 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]'

function CardRow({ pick, anchor }: { pick: Pick; anchor?: boolean }) {
  return (
    <Link
      href={`/cards/${pick.slug}`}
      className="group mt-2 block rounded-[var(--radius-card)] border bg-[var(--color-background-soft)] p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"
      style={{
        borderColor: anchor ? 'var(--color-accent)' : 'var(--color-border-soft)',
        borderLeftWidth: anchor ? '4px' : '1px',
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-display text-lg font-semibold text-[var(--color-primary)] group-hover:underline">
          {pick.name} <span aria-hidden className="inline-block transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
        </span>
        <span className="font-ui text-xs font-semibold text-[var(--color-text-secondary)]">{pick.fee}</span>
      </div>
      <p className="mt-1.5 font-body text-[var(--color-text-primary)]" style={{ lineHeight: 1.55 }}>{pick.blurb}</p>
    </Link>
  )
}

export default function BestFirstCardGuide() {
  return (
    <main className="rg-major-section">
      <div className="rg-container rg-guide" style={{ maxWidth: '52rem' }}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
          Cards &amp; Points
        </span>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          The Best First Card for Every Type of Traveler
        </h1>
        <GuideDateline slug="best-first-card" />

        {INTRO.map((para, i) => (
          <p key={i} className={i === 0 ? 'mt-4 font-body text-lg text-[var(--color-text-secondary)]' : 'mt-4 font-body text-[var(--color-text-primary)]'}>
            {para}
          </p>
        ))}

        {/* Not sure which type? Back to Find Your Why. */}
        <div style={{ margin: '1.5rem 0', padding: '1rem 1.25rem', borderLeft: '4px solid var(--color-accent)', background: 'var(--color-background-soft)', borderRadius: '0 var(--radius-card) var(--radius-card) 0' }}>
          <p className="font-body text-[var(--color-text-primary)]">
            <strong>Not sure which one you are?</strong> Take the two-minute read first:{' '}
            <Link href="/guides/find-your-why" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
              What Kind of Points Traveler Are You?
            </Link>
          </p>
        </div>

        {/* Jump links */}
        <nav aria-label="Jump to a traveler type" className="mt-6 flex flex-wrap gap-2">
          {TRAVELER_TYPES.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="rounded-full border border-[var(--color-border-soft)] bg-[var(--color-background)] px-3 py-1.5 font-ui text-xs font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-background-soft)]"
            >
              {t.name.replace('The ', '')}
            </a>
          ))}
        </nav>

        {TRAVELER_TYPES.map((t) => (
          <section key={t.id} id={t.id} className="mt-12 scroll-mt-24">
            <h2 className={h2}>{t.name}</h2>
            <p className="mt-1 font-body text-lg italic text-[var(--color-text-secondary)]">{t.tagline}</p>
            <p className="mt-3 font-body text-[var(--color-text-primary)]">
              <span className="font-ui text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]">Winning looks like</span>
              <br />
              <span className="font-display text-xl font-semibold text-[var(--color-primary)]">&ldquo;{t.winning}&rdquo;</span>
            </p>

            <p className={label}>Start here</p>
            <CardRow pick={t.anchor} anchor />

            <p className={label}>Also consider</p>
            {t.alsoConsider.map((p) => (
              <CardRow key={p.slug} pick={p} />
            ))}

            {t.note && (
              <p className="mt-3 font-body text-sm text-[var(--color-text-secondary)]" style={{ lineHeight: 1.6 }}>
                {t.note}
              </p>
            )}
          </section>
        ))}

        {/* Close + CTA */}
        <div className="mt-14 border-t border-[var(--color-border-soft)] pt-8">
          <p className="font-body text-[var(--color-text-primary)]">
            Remember: you don't need a wallet full of cards to win at this. The right first card, matched to how you actually travel, is the whole game at the start. Everything else you can add later, one deliberate move at a time.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/cards"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] px-5 py-2.5 font-ui text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--color-primary-hover)]"
            >
              Compare all cards in the Explorer <span aria-hidden>&rarr;</span>
            </Link>
            <Link
              href="/guides/find-your-why"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-background)] px-5 py-2.5 font-ui text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
            >
              Find your why <span aria-hidden>&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
