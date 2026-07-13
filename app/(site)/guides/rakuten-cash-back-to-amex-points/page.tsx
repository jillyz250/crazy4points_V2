import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How to Turn Rakuten Cash Back Into Amex Points',
  description:
    'Rakuten pays you to start your online shopping there. With an Amex, you can take that cash back as Membership Rewards points instead, which transfer to airlines and hotels. Here is the whole setup.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/rakuten-cash-back-to-amex-points' },
  openGraph: {
    title: 'How to Turn Rakuten Cash Back Into Amex Points',
    description:
      'Take your Rakuten cash back as Amex Membership Rewards points instead of a check, and turn everyday shopping into transferable travel points.',
    url: 'https://www.crazy4points.com/guides/rakuten-cash-back-to-amex-points',
    type: 'article',
    siteName: 'crazy4points',
  },
}

export const revalidate = 86400

const INTRO = [
  `Rakuten is a free cash-back shopping portal. Start your online shopping there, click through to a store, buy what you were going to buy anyway, and a percentage comes back to you. Simple enough. But if you carry an American Express, there is a better payout than cash sitting one setting away.`,
]

const h2 = 'mt-10 font-display text-2xl font-semibold text-[var(--color-primary)]'
const p = 'mt-4 font-body text-[var(--color-text-primary)]'

const TWIST = [
  `Instead of a check or PayPal deposit, you can take your Rakuten cash back as Amex Membership Rewards points. The rate lines up one-to-one with the cash: a store paying 10% pays you 10 points per dollar, a 3% store pays 3 points per dollar. Same dollar value on paper.`,
  `So why take points over cash? Because Membership Rewards points transfer to airline and hotel partners, where they often stretch well past their cash value, especially on premium cabins. That means the same shopping trip can quietly help fund your next award ticket instead of just padding a payout.`,
]

const SETUP = [
  `Join Rakuten if you have not already. It is free.`,
  `Go to rakuten.com/american-express and link your Amex Membership Rewards account.`,
  `In Account Settings, under How You Get Paid, choose Membership Rewards points.`,
]

const EARN = [
  `Before you shop or book travel online, start at Rakuten, search the store you want (Expedia, Hotels.com, Vrbo, Nike, whatever it is), and click through from there. That click is what tags your purchase for the reward.`,
  `Then buy as normal. Your points post to Rakuten first, then transfer to your Membership Rewards account on Rakuten's quarterly payout schedule.`,
]

const FINE = [
  `It works with a personal U.S. Amex enrolled in Membership Rewards. The Rakuten American Express Card and corporate Platinum cards are not eligible.`,
  `You need at least 501 confirmed points before a quarterly transfer, otherwise the balance rolls to the next one.`,
  `Skip coupon codes that are not listed on Rakuten. An outside code can void the cash back entirely.`,
  `For travel, the reward usually posts about a week after your trip is completed, not when you book.`,
]

const TIPS = [
  `Watch for elevated days. Rakuten regularly bumps travel stores like Expedia, Hotels.com, Vrbo, and Marriott Homes & Villas to 10% or more for a single day. A big-ticket trip booked on one of those days can throw off a serious pile of points.`,
  `Stack it. Rakuten earning sits on top of your card's normal points and any sale price the store is running, so a well-timed booking can earn three ways at once.`,
]

export default function RakutenToAmexGuide() {
  return (
    <main className="rg-major-section">
      <div className="rg-container rg-guide" style={{ maxWidth: '48rem' }}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
          Cards &amp; Points
        </span>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          How to Turn Rakuten Cash Back Into Amex Points
        </h1>

        {INTRO.map((para, i) => (
          <p key={i} className={i === 0 ? 'mt-4 font-body text-lg text-[var(--color-text-secondary)]' : p}>{para}</p>
        ))}

        <h2 className={h2}>The Amex twist</h2>
        {TWIST.map((para, i) => <p key={i} className={p}>{para}</p>)}

        <h2 className={h2}>Set it up once</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-6 font-body text-[var(--color-text-primary)]">
          {SETUP.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
        <p className="mt-4 font-body text-[var(--color-text-secondary)]">That is the whole setup. From then on, your Rakuten earnings arrive as points.</p>

        <h2 className={h2}>How to actually earn</h2>
        {EARN.map((para, i) => <p key={i} className={p}>{para}</p>)}

        <h2 className={h2}>The fine print worth knowing</h2>
        <ul className="mt-4 space-y-2 pl-1 font-body text-[var(--color-text-primary)]">
          {FINE.map((s, i) => <li key={i}>&bull; {s}</li>)}
        </ul>

        <h2 className={h2}>Two pro tips</h2>
        {TIPS.map((para, i) => <p key={i} className={p}>{para}</p>)}

        <p className="mt-10 font-body text-[var(--color-text-primary)]">
          Bottom line: Rakuten is one of the easiest points wins going. Link it once, remember to start your shopping there, and take the payout as points, not cash.
        </p>

        <p className="mt-8 font-body text-sm text-[var(--color-text-secondary)]">
          Want more moves like this? Browse all <Link href="/guides" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>guides</Link>, or <Link href="/newsletter" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>get them in the newsletter</Link> before they expire.
        </p>
      </div>
    </main>
  )
}
