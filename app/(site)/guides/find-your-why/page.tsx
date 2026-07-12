import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'What Kind of Points Traveler Are You?',
  description:
    'Before you pick a card, figure out what you actually want from travel. Find your "why," and the "how" gets easy. Five traveler types to find yourself in.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/find-your-why' },
  openGraph: {
    title: 'What Kind of Points Traveler Are You?',
    description:
      'Your points strategy starts with one question: why? Find your traveler type, and every card, program, and redemption decision gets easier.',
    url: 'https://www.crazy4points.com/guides/find-your-why',
    type: 'article',
    siteName: 'crazy4points',
  },
}

export const revalidate = 86400

const INTRO = [
  `Four people can earn the exact same 100,000 points and do wildly different things with them. One books four domestic flights to see family all year. Another blows the whole pile on a single lie-flat seat to Tokyo that'd cost thousands in cash. A third just knocks the airfare off a beach week they were taking anyway. And a fourth never boards a plane, cashing out or grabbing a Best Buy gift card for the MacBook their kid needs for school. Not one of them's wrong. They're playing different games, and the fastest way to waste a pile of points is playing somebody else's instead of your own.`,
  `Almost every "how to start with points" guide hands you a credit card before asking one question about what you actually want. That's like handing someone golf clubs before checking whether they even like golf. So before we talk about a single card, let's do the thing that makes all of it click.`,
]

const WHY = [
  `Points and miles aren't one hobby. They're a dozen hobbies wearing the same coat. The person hoarding a million points for a honeymoon and the person shaving forty bucks off every work trip are playing completely different games, with different cards and different ideas of what counts as a win.`,
  `And ignore anyone who tells you there's one "right" redemption, that economy flights are a waste or luxury hotels are the only real use. A redemption works if it gets you what you wanted, full stop. Skip this step and you'll own a wallet of cards that don't serve you and points you're scared to spend. Nail it and you'll feel like you're in on a secret most travelers don't even know exists.`,
]

const TYPES: { n: number; name: string; body: string; instinct: string }[] = [
  {
    n: 1,
    name: 'The Deal-Seeker',
    body: `You're not chasing luxury, you're chasing a lighter bill. Maybe that's cash back, maybe it's a free flight so the family wedding costs less, maybe it's a Best Buy gift card for the laptop your kid needs for school. You're perfectly happy paying cash for a normal hotel and a normal rental car, as long as points knocked something meaningful off the total.`,
    instinct: `Your instinct: earn simply and aim your points at your single biggest cost, usually the flights.`,
  },
  {
    n: 2,
    name: 'The Little-Luxury Blender',
    body: `Normal trips, just a notch nicer than you'd otherwise spring for. The airport lounge with real food and a quiet chair instead of a nine-dollar terminal sandwich. The 4 p.m. late checkout so you're not homeless from eleven until your red-eye. The room upgrade, the free breakfast, the rental car that's somehow a convertible now.`,
    instinct: `Your instinct: flexible points plus a card that throws in lounge access and hotel status, so you can aim the perks at whichever trip needs them.`,
  },
  {
    n: 3,
    name: 'The Splurger',
    body: `Points buy the stuff you'd never pay cash for. The lie-flat suite, the overwater villa, the lounge you actually want to sit in before you've even boarded, even the VIP experiences some premium cards unlock (presale tickets, chef's-table dinners). You're not saving a few bucks on normal travel, you're unlocking a version of travel that used to be off-limits.`,
    instinct: `Your instinct: chase the aspirational redemptions, where points massively out-punch their cash value.`,
  },
  {
    n: 4,
    name: 'The Dream-Tripper',
    body: `You bank everything for one enormous, almost-free, all-out trip. The honeymoon. The bucket-list safari. The two weeks you could never otherwise justify.`,
    instinct: `Your instinct: hoard flexible points patiently, then spend them all on one epic redemption.`,
  },
  {
    n: 5,
    name: 'The Value Gamer',
    body: `You want the luxury and the deal, and you're not picking one, thanks. Mine: I once booked a lie-flat seat that sells for around $10,000, and I paid 60,000 points for it. I've never slept better at thirty-eight thousand feet, and honestly? Half the reason is I couldn't stop grinning about the deal. That's the whole rush. The arbitrage, the little dopamine hit of pulling off something most people are dead sure is impossible. And no, I'm not a gatekeeper about it, because this game's a lot more fun as a group project. It's not just the trip, it's the win.`,
    instinct: `Your instinct: learn the sweet spots, ride the transfer bonuses, and treat the whole thing as a game worth getting good at. (Hi, this one's me.)`,
  },
]

const STILL = [
  `Imagine somebody dropped 200,000 points into your account tonight. What's the very first trip you'd book tomorrow morning? Your gut answer tells you more than any personality quiz ever could.`,
  `And you're allowed to be a blend. I'm a Value Gamer who's also a Splurger with a soft spot for a Little-Luxury upgrade on an ordinary Tuesday. Even one trip can carry more than one why: I'll chase a $10,000 seat for pennies, then on the same vacation burn a free-night certificate just to shave a couple hundred bucks off the hotel bill. Every redemption gets its own why, and your why shifts over time, so check in every so often.`,
]

const CLOSE = [
  `Once you know your why, everything downstream falls into place: which points to collect, which cards earn them, and which shiny objects to happily ignore. You're free to tune out about ninety percent of the advice online, and thank goodness, because the best strategy isn't the one that impresses strangers, it's the one that gets you exactly where you want to go. And when you land that first redemption that makes you grin, pass the trick along. This isn't a secret society, it's a community of people who love the same game, and it gets a little better every time another traveler realizes it was never reserved for experts.`,
  `So, which one are you? Sit with it for a second, then let's go build a strategy that actually fits.`,
]

const h2 = 'mt-10 font-display text-2xl font-semibold text-[var(--color-primary)]'
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

        {INTRO.map((para, i) => (
          <p key={i} className={i === 0 ? 'mt-4 font-body text-lg text-[var(--color-text-secondary)]' : p}>{para}</p>
        ))}

        {/* Pull quote — the thesis. */}
        <div style={{ margin: '1.75rem 0', padding: '1.25rem 1.5rem', borderLeft: '4px solid var(--color-accent)', background: 'var(--color-background-soft)', borderRadius: '0 var(--radius-card) var(--radius-card) 0' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', lineHeight: 1.55, color: 'var(--color-text-primary)' }}>
            <strong>Your why is the feeling you&rsquo;re chasing.</strong> {`Cheaper trips? Once-in-a-lifetime luxury? A free flight so the vacation just costs less? The straight-up thrill of the deal? There's no wrong answer, and yours won't look like anybody else's. Name it, and every "how" decision, which card, which points, which trip, gets a whole lot easier.`}
          </p>
        </div>

        <h2 className={h2}>Why the &ldquo;why&rdquo; comes first</h2>
        {WHY.map((para, i) => <p key={i} className={p}>{para}</p>)}

        <h2 className={h2}>Which one are you?</h2>
        <p className={p}>{`These aren't boxes, they're vibes. Find the one that feels like home. (You might be a blend of two or three, and that's completely normal.)`}</p>

        <div className="mt-5 flex flex-col gap-4">
          {TYPES.map((t) => (
            <div
              key={t.n}
              style={{
                background: 'var(--color-background-soft)',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-card)',
                padding: '1.125rem 1.375rem',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1875rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                {t.n}. {t.name}
              </p>
              <p style={{ marginTop: '0.5rem', fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)', lineHeight: 1.55 }}>{t.body}</p>
              <p style={{ marginTop: '0.625rem', fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{t.instinct}</p>
            </div>
          ))}
        </div>

        <h2 className={h2}>Still not sure?</h2>
        {STILL.map((para, i) => <p key={i} className={p}>{para}</p>)}

        <h2 className={h2}>Now the &ldquo;how&rdquo; gets easy</h2>
        {CLOSE.map((para, i) => <p key={i} className={p}>{para}</p>)}

        <p className="mt-10 font-body text-sm text-[var(--color-text-secondary)]">
          Ready for the how? Browse all <Link href="/guides" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>guides</Link>, or start with the <Link href="/cards" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Card Explorer</Link>.
        </p>
      </div>
    </main>
  )
}
