import type { Metadata } from 'next'
import Link from 'next/link'
import { GuideDateline } from '@/components/guides/GuideDateline'
import { GuideJsonLd } from '@/components/guides/GuideJsonLd'
import GuideNewsletterCTA from '@/components/guides/GuideNewsletterCTA'

export const metadata: Metadata = {
  title: 'How to Transfer Points: A Beginner’s Guide to Flying Farther for Less',
  description:
    'Turn credit card points into airline miles, and learn why the exact same seat can cost far fewer points depending on which program you book it through. A plain-language beginner guide.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/how-to-transfer-points' },
  openGraph: {
    title: 'How to Transfer Points: A Beginner’s Guide to Flying Farther for Less',
    description:
      'The one skill that turns points into airline miles, plus the trick most people miss: the same seat has more than one price.',
    url: 'https://www.crazy4points.com/guides/how-to-transfer-points',
    type: 'article',
    siteName: 'crazy4points',
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 86400

const h2 = 'mt-12 font-display text-2xl font-semibold text-[var(--color-primary)]'
const p = 'mt-4 font-body text-[var(--color-text-primary)]'

function Callout({
  children,
  tone = 'soft',
}: {
  children: React.ReactNode
  tone?: 'soft' | 'warn'
}) {
  const border = tone === 'warn' ? 'var(--color-accent)' : 'var(--color-primary)'
  return (
    <div
      style={{
        background: 'var(--color-background-soft)',
        border: '1px solid var(--color-border-soft)',
        borderLeft: `4px solid ${border}`,
        borderRadius: 'var(--radius-card)',
        padding: '1rem 1.25rem',
        margin: '1.25rem 0',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-text-primary)',
        lineHeight: 1.55,
      }}
    >
      {children}
    </div>
  )
}

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: '1',
    title: 'Find the award seat first',
    body: 'Go to the program you would book through and confirm the exact seat is available for miles on your dates.',
  },
  {
    n: '2',
    title: 'Then transfer your points',
    body: 'Move only the amount that booking needs, never your whole balance.',
  },
  {
    n: '3',
    title: 'Then book, right away',
    body: 'Lock the seat the moment your miles land. Award space can vanish while you wait.',
  },
]

const TRAPS: { title: string; body: string }[] = [
  {
    title: 'Do not assume your card’s travel portal is the best deal',
    body: 'Booking “through the portal” is easy, but transferring to an airline is often far cheaper for the same flight, especially up front in business and first.',
  },
  {
    title: 'Watch for fuel surcharges',
    body: 'A few programs tack big cash surcharges onto certain airlines, so the same award seat can cost a few dollars in taxes through one program and several hundred through another. (Aeroplan skips them on most partners. Some programs do not.)',
  },
  {
    title: 'Mind minimums and expiration',
    body: 'Some programs require a minimum transfer, and miles parked in an airline account can expire if you go quiet. Do not stockpile miles you will not use soon.',
  },
]

const QUESTIONS = [
  'Where do I want to go?',
  'Which airlines fly there, and what alliance are they in?',
  'Which program prices that route cheapest, without heavy surcharges?',
  'Do I have, or can I transfer, points to that program?',
]

export default function HowToTransferPointsGuide() {
  return (
    <main className="rg-major-section">
      <div className="rg-container rg-guide" style={{ maxWidth: '60rem' }}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
          Getting Started
        </span>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          How to Transfer Points: A Beginner’s Guide to Flying Farther for Less
        </h1>
        <GuideDateline slug="how-to-transfer-points" />
        <GuideJsonLd slug="how-to-transfer-points" />

        <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">
          Here is a secret that sounds made up. The pile of &ldquo;points&rdquo; sitting in your credit
          card account can usually be turned into actual airline miles. And once you know how, the same
          flight you were about to pay a small fortune for can cost you a transfer and a few dollars in
          taxes. Most people never do it, because nobody ever told them they could. Let us fix that.
        </p>

        <h2 className={h2}>Your points can move</h2>
        <p className={p}>
          Transferable points, the kind earned by Amex, Chase, Citi, Capital One, and Bilt cards, are not
          locked into your card&rsquo;s travel portal. You can send them straight into an airline&rsquo;s
          own frequent flyer program, then book as if you had been collecting that airline&rsquo;s miles
          all along. Usually it is one to one: 10,000 card points become 10,000 airline miles.
        </p>
        <p className={p}>
          That is the whole difference between &ldquo;cash back&rdquo; and &ldquo;a lie-flat seat to
          Tokyo.&rdquo; Same points, completely different ceiling.
        </p>
        <Callout>
          <strong>Quick gut check.</strong> Not every card can do this. Flat cash-back cards (the
          &ldquo;1.5% back on everything&rdquo; types) usually cannot transfer anywhere. The ones that can
          are tied to Amex Membership Rewards, Chase Ultimate Rewards, Citi ThankYou, Capital One miles, or
          Bilt. Hotels work the same way (you can transfer to Hyatt, Marriott, and others), but airline
          transfers are usually where the real value hides, so that is our focus here.
        </Callout>

        <h2 className={h2}>Airlines share their planes</h2>
        <p className={p}>
          Airlines team up in big groups called alliances. The three giants are Star Alliance, Oneworld,
          and SkyTeam, plus a handful of one-off partnerships. The payoff: one airline&rsquo;s miles can
          book seats on its partners. You can fly Lufthansa without ever earning a single Lufthansa mile,
          by using miles from one of its alliance partners instead.
        </p>
        <p className={p}>
          This is a rabbit hole worth falling into, and it is the whole subject of our next guide. For now,
          hold onto one idea: your miles can book far more airlines than the one printed on your card.
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.75rem 1rem',
            background: 'var(--color-background-soft)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
            padding: '1rem 1.25rem',
            margin: '1.25rem 0',
          }}
        >
          <p className="font-body text-[var(--color-text-primary)]" style={{ flex: '1 1 16rem', margin: 0 }}>
            <strong>See who partners with whom.</strong> Our Alliance Explorer maps every alliance and shows
            which programs can book which airlines.
          </p>
          <Link
            href="/tools/alliances"
            className="rg-btn-secondary"
            style={{ whiteSpace: 'nowrap', flex: '0 0 auto' }}
          >
            Open Alliance Explorer
          </Link>
        </div>

        <h2 className={h2}>Same seat, different price</h2>
        <p className={p}>
          Here is what almost nobody realizes. That one Lufthansa business-class seat does not have a
          single price. It has several, depending on which program you book it through. Every airline sets
          its own award pricing, so the identical seat, same plane, same day, can cost wildly different
          amounts of miles.
        </p>

        {/* Comparison centerpiece */}
        <figure style={{ margin: '1.5rem 0 0' }}>
          <p
            className="font-ui"
            style={{
              margin: '0 0 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
            }}
          >
            Same Lufthansa seat · U.S. East Coast to Europe · business class
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'stretch' }}>
            {/* Cheaper */}
            <div
              style={{
                flex: '1 1 15rem',
                position: 'relative',
                background: 'var(--color-background)',
                border: '2px solid var(--color-accent)',
                borderRadius: 'var(--radius-card)',
                padding: '1.25rem 1.25rem 1.35rem',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <span
                className="font-ui"
                style={{
                  position: 'absolute',
                  top: '-0.7rem',
                  left: '1.25rem',
                  background: 'var(--color-accent)',
                  color: '#1A1A1A',
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '999px',
                }}
              >
                The smart booking
              </span>
              <p className="font-ui" style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                Book through
              </p>
              <p className="font-body" style={{ margin: '0.15rem 0 0.6rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Air Canada Aeroplan
              </p>
              <p className="font-display" style={{ margin: 0, fontSize: '2.25rem', lineHeight: 1, fontWeight: 700, color: 'var(--color-primary)' }}>
                60,000
              </p>
              <p className="font-body" style={{ margin: '0.3rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
                points, one way
              </p>
            </div>
            {/* Pricier */}
            <div
              style={{
                flex: '1 1 15rem',
                background: 'var(--color-background-soft)',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-card)',
                padding: '1.25rem',
              }}
            >
              <p className="font-ui" style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                Book through
              </p>
              <p className="font-body" style={{ margin: '0.15rem 0 0.6rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Avianca LifeMiles
              </p>
              <p className="font-display" style={{ margin: 0, fontSize: '2.25rem', lineHeight: 1, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                90,000+
              </p>
              <p className="font-body" style={{ margin: '0.3rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
                points, one way
              </p>
            </div>
          </div>
          <figcaption className="font-body" style={{ marginTop: '0.85rem', fontSize: '0.9375rem', color: 'var(--color-text-secondary)' }}>
            Identical plane, identical seat. The only difference is which program you booked it through,
            roughly 50% more points for the exact same flight.
          </figcaption>
        </figure>

        <p className={p}>
          The lesson: the real skill is not just having miles. It is knowing which program prices your trip
          cheapest, then sending your points there.
        </p>
        <Callout>
          <strong>Prices move, so always check.</strong> LifeMiles was the cheap option a year ago, before
          a 2026 price hike flipped it. Confirm today&rsquo;s numbers before you transfer anything. Our
          program pages track them.
        </Callout>

        <h2 className={h2}>How to actually do it, in order</h2>
        <p className={p}>The order matters more than anything else on this page.</p>
        <ol style={{ listStyle: 'none', margin: '1.25rem 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {STEPS.map((s) => (
            <li
              key={s.n}
              style={{
                display: 'flex',
                gap: '0.9rem',
                alignItems: 'flex-start',
                background: 'var(--color-background-soft)',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-card)',
                padding: '0.9rem 1.1rem',
              }}
            >
              <span
                className="font-display"
                style={{
                  flex: '0 0 auto',
                  display: 'grid',
                  placeItems: 'center',
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '999px',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1rem',
                }}
              >
                {s.n}
              </span>
              <span style={{ flex: '1 1 auto' }}>
                <span className="font-body" style={{ display: 'block', fontWeight: 700, color: 'var(--color-text-primary)' }}>{s.title}</span>
                <span className="font-body" style={{ display: 'block', marginTop: '0.15rem', color: 'var(--color-text-secondary)' }}>{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <Callout tone="warn">
          <strong>The one unbreakable rule: transfers are one way.</strong> Once your points leave Chase or
          Amex and land in an airline program, you cannot pull them back. So never transfer on a hope or an
          &ldquo;I&rsquo;ll probably use these someday.&rdquo; Transfer only when you have found the seat and
          you are ready to book. The number one beginner mistake is transferring first and discovering the
          seat is gone second.
        </Callout>
        <p className={p}>
          One timing note: some transfers are instant, others take hours or even days. If a seat is scarce,
          that lag can cost you it. Know your program&rsquo;s transfer speed before you rely on it.
        </p>
        <Callout>
          <strong>Not sure where to search?</strong> Tools like seats.aero and point.me scan many programs
          at once to find the cheapest way to book a given seat. Handy perk: if you carry an Amex Membership
          Rewards card, you get point.me&rsquo;s award search free at point.me/amex, a subscription that
          normally runs about $129 a year.
        </Callout>

        <h2 className={h2}>Ratios and bonuses (free extra miles)</h2>
        <p className={p}>
          Most transfers are one to one, but not all. A few partners give you less, so glance at the ratio
          before you commit.
        </p>
        <p className={p}>
          And watch for transfer bonuses. Every so often a card program runs a promo: transfer now, get 20%
          to 30% extra miles, free. (Right now, for example, Chase is handing out a 20% bonus to Aeroplan
          through September.) If you were going to transfer anyway, timing it to a bonus is found money. We
          flag these the day they go live.
        </p>

        <h2 className={h2}>The traps to sidestep</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
          {TRAPS.map((t) => (
            <div
              key={t.title}
              style={{
                borderLeft: '4px solid var(--color-accent)',
                background: 'var(--color-background-soft)',
                borderRadius: '0 var(--radius-card) var(--radius-card) 0',
                padding: '0.85rem 1.1rem',
              }}
            >
              <p className="font-body" style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-primary)' }}>{t.title}</p>
              <p className="font-body" style={{ margin: '0.2rem 0 0', color: 'var(--color-text-secondary)' }}>{t.body}</p>
            </div>
          ))}
        </div>

        <h2 className={h2}>A dead-simple framework</h2>
        <p className={p}>Every time, ask four questions in order.</p>
        <ol
          style={{
            listStyle: 'none',
            margin: '1.25rem 0 0',
            padding: '1.25rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            background: 'var(--color-primary)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          {QUESTIONS.map((q, i) => (
            <li key={q} style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
              <span className="font-display" style={{ flex: '0 0 auto', color: 'var(--color-accent)', fontWeight: 700, fontSize: '1.1rem' }}>{i + 1}</span>
              <span className="font-body" style={{ color: '#fff' }}>{q}</span>
            </li>
          ))}
        </ol>
        <p className={p}>Answer those four and you have done what most travelers never learn to do.</p>

        <h2 className={h2}>Start here</h2>
        <p className={p}>
          That is the whole engine. Your points can move, alliances let one airline&rsquo;s miles book many,
          and the smart play is booking through whichever program prices your trip lowest. Start small: one
          trip, one transfer, seat confirmed first, and it stops feeling like a secret code.
        </p>
        <div
          style={{
            marginTop: '1.5rem',
            background: 'var(--color-background-soft)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
            padding: '1.25rem 1.4rem',
          }}
        >
          <p className="font-body" style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            <strong>Next up:</strong> our deep dive on airline alliances, the map of exactly whose miles book
            whose planes. Ready to plan now?
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.9rem' }}>
            <Link href="/tools/alliances" className="rg-btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Explore alliances
            </Link>
            <Link href="/programs" className="rg-btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              Browse program pricing
            </Link>
            <Link href="/alerts" className="rg-btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              See transfer bonuses
            </Link>
          </div>
        </div>

        <p className="mt-10 font-body text-sm text-[var(--color-text-secondary)]">
          Award pricing and transfer terms are set by the airlines and change often. Confirm current numbers
          on each program&rsquo;s official site before you transfer. Browse all{' '}
          <Link href="/guides" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
            guides
          </Link>
          .
        </p>
        <GuideNewsletterCTA />
      </div>
    </main>
  )
}
