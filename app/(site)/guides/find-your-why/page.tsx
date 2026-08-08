import type { Metadata } from 'next'
import Link from 'next/link'
import { GuideDateline } from '@/components/guides/GuideDateline'
import { GuideJsonLd } from '@/components/guides/GuideJsonLd'
import GuideNewsletterCTA from '@/components/guides/GuideNewsletterCTA'
import WhyQuiz from '@/components/guides/WhyQuiz'

export const metadata: Metadata = {
  title: 'What Kind of Points Traveler Are You?',
  description:
    'Take the 2-minute quiz to find your traveler type, and get the credit cards that actually fit how you travel. Five types, one you.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/find-your-why' },
  openGraph: {
    title: 'What Kind of Points Traveler Are You?',
    description:
      'A 5-question quiz that names your traveler type and the cards that fit it. Find your why, and every points decision gets easier.',
    url: 'https://www.crazy4points.com/guides/find-your-why',
    type: 'article',
    siteName: 'crazy4points',
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 86400

const INTRO = `Four people can earn the exact same 100,000 points and do wildly different things with them. One books four flights home to see family. Another blows the whole pile on a single lie-flat seat to Tokyo. A third just shaves the airfare off a beach week they were taking anyway. And a fourth never boards a plane, cashing out for the laptop their kid needs for school. Not one of them's wrong. They're playing different games, and the fastest way to waste a pile of points is playing somebody else's instead of your own.`

const WHY = [
  `Points and miles aren't one hobby. They're a dozen hobbies wearing the same coat. The person hoarding a million points for a honeymoon and the person shaving forty bucks off every work trip are playing completely different games, with different cards and different ideas of what counts as a win.`,
  `And ignore anyone who tells you there's one "right" redemption, that economy flights are a waste or luxury hotels are the only real use. A redemption works if it gets you what you wanted, full stop. Skip this step and you'll own a wallet of cards that don't serve you and points you're scared to spend. Nail it and you'll feel like you're in on a secret most travelers don't even know exists.`,
]

const CLOSE = [
  `And you're allowed to be a blend. Plenty of us are Value Gamers who are also Splurgers with a soft spot for a Little-Luxury upgrade on an ordinary Tuesday. Even one trip can carry more than one why. Every redemption gets its own, and yours shifts over time, so check back in every so often.`,
  `Once you know your why, everything downstream falls into place: which points to collect, which cards earn them, and which shiny objects to happily ignore. That's the whole game.`,
]

const h2 = 'mt-12 font-display text-2xl font-semibold text-[var(--color-primary)]'
const p = 'mt-4 font-body text-[var(--color-text-primary)]'

export default function FindYourWhyGuide() {
  return (
    <main className="rg-major-section">
      <div className="rg-container rg-guide" style={{ maxWidth: '48rem' }}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
          Getting Started
        </span>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          What Kind of Points Traveler Are You?
        </h1>
        <GuideDateline slug="find-your-why" />
        <GuideJsonLd slug="find-your-why" />

        <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">{INTRO}</p>
        <p className={p}>
          So before we hand you a single card, let's figure out which game you're playing. Answer five quick questions and we'll name your type, plus the cards that actually fit it.
        </p>

        {/* The quiz — interactive centerpiece */}
        <div className="mt-6">
          <WhyQuiz />
        </div>

        {/* Context for the curious, below the fold */}
        <h2 className={h2}>Why bother naming it?</h2>
        {WHY.map((para, i) => (
          <p key={i} className={p}>{para}</p>
        ))}

        <div style={{ margin: '1.75rem 0', padding: '1.25rem 1.5rem', borderLeft: '4px solid var(--color-accent)', background: 'var(--color-background-soft)', borderRadius: '0 var(--radius-card) var(--radius-card) 0' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', lineHeight: 1.55, color: 'var(--color-text-primary)' }}>
            <strong>Your why is the feeling you&rsquo;re chasing.</strong>{' '}
            {`Cheaper trips? Once-in-a-lifetime luxury? A free flight so the vacation just costs less? The straight-up thrill of the deal? There's no wrong answer, and yours won't look like anybody else's.`}
          </p>
        </div>

        {CLOSE.map((para, i) => (
          <p key={i} className={p}>{para}</p>
        ))}

        <p className="mt-8 font-body text-sm text-[var(--color-text-secondary)]">
          Ready for the how? See the{' '}
          <Link href="/guides/best-first-card" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
            best first card for every type
          </Link>
          , browse all <Link href="/guides" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>guides</Link>, or open the{' '}
          <Link href="/cards" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Card Explorer</Link>.
        </p>
        <GuideNewsletterCTA />
      </div>
    </main>
  )
}
