import type { Metadata } from 'next'
import Link from 'next/link'

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
}

export const revalidate = 86400

interface Pick {
  name: string
  slug: string
  fee: string
  blurb: string
}

interface TravelerType {
  id: string
  name: string
  tagline: string
  winning: string
  anchor: Pick
  alsoConsider: Pick[]
  /** Optional honest caveat or extra note rendered under the picks. */
  note?: string
}

const INTRO = [
  `You've found your why. Now for the only question that actually matters when you're starting out: which card do you apply for? Not which twelve. Which one.`,
  `Below is a single anchor pick for each of the five traveler types, plus a couple of alternatives if the anchor isn't quite you. Every fee, welcome bonus, and perk here is pulled straight from the card's real terms, and none of these picks are here because they pay us. They're here because they fit.`,
]

const TYPES: TravelerType[] = [
  {
    id: 'deal-seeker',
    name: 'The Deal-Seeker',
    tagline: `You're trying to spend less, period.`,
    winning: `I spent $500 less on that trip.`,
    anchor: {
      name: 'Chase Freedom Unlimited',
      slug: 'chase-freedom-unlimited',
      fee: 'No annual fee',
      blurb: `1.5% back on everything, more on dining and drugstores, and no annual fee. The simplest possible start, and it grows with you: pair it with a Sapphire card down the road and that cash back turns into transferable travel points.`,
    },
    alsoConsider: [
      {
        name: 'Chase Freedom Flex',
        slug: 'chase-freedom-flex',
        fee: 'No annual fee',
        blurb: `The same free card, but with 5% rotating bonus categories each quarter and cell phone protection built in.`,
      },
      {
        name: 'Capital One Venture',
        slug: 'capital-one-venture',
        fee: '$95 a year',
        blurb: `2x on everything, and the miles erase any travel purchase: book the flight, then wipe it off your bill. Dead simple. Transferring those miles to airline partners later can stretch them further, but you never have to.`,
      },
      {
        name: 'IHG One Rewards Premier',
        slug: 'chase-ihg-one-rewards-premier',
        fee: '$99 a year',
        blurb: `The deal-seeker's quiet secret weapon: a hotel card whose annual free night reliably covers a room worth more than the fee. About as close to free money as this hobby gets.`,
      },
    ],
  },
  {
    id: 'little-luxury-blender',
    name: 'The Little-Luxury Blender',
    tagline: `A notch nicer than usual.`,
    winning: `Same vacation. Better experience.`,
    anchor: {
      name: 'Capital One Venture X',
      slug: 'capital-one-venture-x',
      fee: '$395 a year',
      blurb: `Lounge access (Capital One's own lounges plus Priority Pass), a $300 travel credit, and 10,000 anniversary miles that together roughly cancel out the fee. It's the one card that delivers "a notch nicer" without jumping to the $795 tier. Best value if you'll actually use that annual travel credit.`,
    },
    alsoConsider: [
      {
        name: 'Chase Sapphire Preferred',
        slug: 'chase-sapphire-preferred',
        fee: '$95 a year',
        blurb: `The cheapest way into flexible, transferable points. No lounge access, but a low fee and a great starter for aiming perks at whichever trip needs them.`,
      },
      {
        name: 'Chase Sapphire Reserve',
        slug: 'chase-sapphire-reserve',
        fee: '$795 a year',
        blurb: `Budget permitting: more lounges, richer hotel credits, and stronger travel protection than the Preferred.`,
      },
    ],
    note: `Notice there's no co-brand hotel card here on purpose. For the Blender, flexible points are the stronger move, because they can become hotel nights or airline seats later. You stay unlocked until the trip tells you what it needs.`,
  },
  {
    id: 'splurger',
    name: 'The Splurger',
    tagline: `Points buy the stuff you'd never pay cash for.`,
    winning: `I flew a cabin I'd never pay cash for.`,
    anchor: {
      name: 'The Platinum Card from American Express',
      slug: 'amex-platinum',
      fee: '$895 a year',
      blurb: `5x points on flights booked directly with airlines or through Amex Travel, Centurion Lounge access, Fine Hotels + Resorts perks, and transferable points that turn into international business and first class, where they out-punch cash by a wide margin. One tip: pair it with the Amex Gold for everyday earning, because the Platinum only earns 1x at the grocery store.`,
    },
    alsoConsider: [
      {
        name: 'Chase Sapphire Reserve',
        slug: 'chase-sapphire-reserve',
        fee: '$795 a year',
        blurb: `The Chase version of the flagship: transfer to Hyatt and airline partners, Sapphire lounge access, and Points Boost on travel.`,
      },
      {
        name: 'Hilton Honors Aspire',
        slug: 'amex-hilton-honors-aspire',
        fee: '$550 a year',
        blurb: `The hotel-luxury play, and the answer to "can I use points at the fancy Hiltons?" Yes: automatic Hilton Diamond status (upgrades, free breakfast, lounge access) plus an annual free night you can use at nearly any Hilton, including the Waldorf Astoria and Conrad luxury brands.`,
      },
    ],
    note: `One honest caveat on hotels: most co-brand free-night certificates are capped in value, so they're perfect for a nice mid-tier hotel but usually won't cover a night at the very top luxury properties. For those, you want an uncapped certificate like the Aspire's, or raw points, ideally Hyatt, whose award chart makes even Park Hyatts reachable.`,
  },
  {
    id: 'dream-tripper',
    name: 'The Dream-Tripper',
    tagline: `Bank it all for one enormous, almost-free trip.`,
    winning: `I finally took the trip I'd been putting off.`,
    anchor: {
      name: 'Chase Sapphire Preferred',
      slug: 'chase-sapphire-preferred',
      fee: '$95 a year',
      blurb: `Cheap to hold, a big welcome bonus, and transferable points that don't expire while the card is open. The patient hoarder's anchor.`,
    },
    alsoConsider: [
      {
        name: 'American Express Gold Card',
        slug: 'amex-gold',
        fee: '$325 a year',
        blurb: `The accumulation engine: 4x points at restaurants and U.S. supermarkets stacks a pile fast.`,
      },
      {
        name: 'Chase Ink business cards',
        slug: 'chase-ink-business-preferred',
        fee: '$0 to $95 a year',
        blurb: `If you have a business, even a side hustle, Ink cards come with big welcome bonuses that can fuel the stash quickly.`,
      },
    ],
    note: `The single most valuable rule on this whole page: keep your points flexible until you've picked the trip. And if you're saving for years, spread them across a couple of programs (Chase, Amex, Capital One) so one program's devaluation can't sink your plan.`,
  },
  {
    id: 'value-gamer',
    name: 'The Value Gamer',
    tagline: `Luxury and the deal, no compromise.`,
    winning: `I know exactly why this redemption was worth it.`,
    anchor: {
      name: 'Chase Sapphire Preferred',
      slug: 'chase-sapphire-preferred',
      fee: '$95 a year',
      blurb: `Your first lever. The famous Hyatt sweet spot lives in Chase points, and the Preferred is the low-cost way in. Move up to the Reserve once the perks earn their keep.`,
    },
    alsoConsider: [
      {
        name: 'American Express Gold Card',
        slug: 'amex-gold',
        fee: '$325 a year',
        blurb: `Your Amex base. Membership Rewards transfer bonuses to airline partners are the value gamer's playground.`,
      },
      {
        name: 'Capital One Venture X',
        slug: 'capital-one-venture-x',
        fee: '$395 a year',
        blurb: `A third flexible currency plus lounge access, so there's always a good transfer ratio to chase.`,
      },
      {
        name: 'Citi Strata Premier',
        slug: 'citi-strata-premier',
        fee: '$95 a year',
        blurb: `Opens its own set of transfer partners (Turkish, Qatar, and more), for when you want every lever on the board.`,
      },
      {
        name: 'The World of Hyatt Credit Card',
        slug: 'chase-world-of-hyatt',
        fee: '$95 a year',
        blurb: `Hyatt status plus the cheapest luxury award chart in the game. The card gets you status and a free night; the real magic is transferring your Chase points to Hyatt for Park Hyatts that cost a fortune in cash.`,
      },
    ],
    note: `A bonus lever if you rent: the Bilt cards earn points on rent, money most renters leave on the table entirely. Just treat Bilt as a bonus currency, not your core one, since its ecosystem is still young.`,
  },
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
          {TYPES.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="rounded-full border border-[var(--color-border-soft)] bg-[var(--color-background)] px-3 py-1.5 font-ui text-xs font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-background-soft)]"
            >
              {t.name.replace('The ', '')}
            </a>
          ))}
        </nav>

        {TYPES.map((t) => (
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
