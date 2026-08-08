import type { Metadata } from 'next'
import Link from 'next/link'
import { GuideDateline } from '@/components/guides/GuideDateline'
import { GuideJsonLd } from '@/components/guides/GuideJsonLd'
import GuideNewsletterCTA from '@/components/guides/GuideNewsletterCTA'

export const metadata: Metadata = {
  title: 'Should You Buy IHG Points? (And the 4th-Night Trick That Makes Them Pay Off)',
  description:
    'IHG runs "buy points" bonuses often, frequently at 100%. When buying IHG points is actually worth it, the 4th-reward-night-free card benefit that doubles the value, and a real all-inclusive Iberostar redemption. Verified against IHG and Chase.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/should-you-buy-ihg-points' },
  openGraph: {
    title: 'Should You Buy IHG Points? (And the 4th-Night Trick That Makes Them Pay Off)',
    description:
      'When a 100% IHG points bonus is actually a deal, the 4th-reward-night-free trick that stretches it, and a real all-inclusive Iberostar example.',
    url: 'https://www.crazy4points.com/guides/should-you-buy-ihg-points',
    type: 'article',
    siteName: 'crazy4points',
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 86400

function Callout({ children, tone = 'soft' }: { children: React.ReactNode; tone?: 'soft' | 'warn' }) {
  const border = tone === 'warn' ? 'var(--color-accent)' : 'var(--color-primary)'
  return (
    <div style={{ background: 'var(--color-background-soft)', border: '1px solid var(--color-border-soft)', borderLeft: `4px solid ${border}`, borderRadius: 'var(--radius-card)', padding: '1rem 1.25rem', margin: '1.25rem 0', fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)', lineHeight: 1.55 }}>
      {children}
    </div>
  )
}

const h2 = 'mt-10 font-display text-2xl font-semibold text-[var(--color-primary)]'
const p = 'mt-4 font-body text-[var(--color-text-primary)]'
const ul = 'mt-3 flex flex-col gap-2 font-body text-[var(--color-text-primary)]'
const liStyle = { listStyle: 'disc', paddingLeft: '1.25rem' } as const

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="rg-table-scroll mt-4">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '0.9375rem' }}>
        <thead>
          <tr style={{ background: 'var(--color-primary)', color: '#fff', textAlign: 'left' }}>
            {head.map((hd) => (
              <th key={hd} style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', fontWeight: 700 }}>{hd}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r[0]} style={{ background: i % 2 ? 'var(--color-background-soft)' : 'var(--color-background)', borderBottom: '1px solid var(--color-border-soft)' }}>
              {r.map((cell, j) => (
                <td key={j} style={{ padding: '0.625rem 0.75rem', color: j === 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: j === 0 ? 700 : 400 }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const FAQ: { q: string; a: string }[] = [
  { q: 'How do I know if buying beats paying cash?', a: 'Price the exact night in cash, then look it up in points. If the cost of the points you would buy (with the bonus) comes in clearly under the cash rate, buying can win. If it is close, pay cash and keep the flexibility.' },
  { q: 'What is the 4th-reward-night-free benefit?', a: 'With the IHG One Rewards Premier card, every standard-room reward stay of four or more consecutive nights at the same property gets the 4th night for zero points, unlimited times a year.' },
  { q: 'Can I really book all-inclusive resorts with IHG points?', a: 'Yes. IHG added Iberostar Beachfront Resorts, so a number of all-inclusive beachfront properties are bookable on points and earn points too, a category where cash rates run high.' },
]

export default function BuyIhgPointsGuide() {
  return (
    <main className="rg-major-section">
      <div className="rg-container rg-guide" style={{ maxWidth: '64rem' }}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
          Guide · Hotels &amp; Stays
        </span>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          Should You Buy IHG Points?
        </h1>
        <GuideDateline slug="should-you-buy-ihg-points" />
        <GuideJsonLd slug="should-you-buy-ihg-points" />
        <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">
          {'IHG discounts its points often, frequently at 100%, twice the points for the same money. That makes them one of the cheaper hotel currencies to stock up on. But a sale is only a deal if you already know what you are booking.'}
        </p>

        <Callout>
          <strong>The one rule:</strong>{' '}
          {'never buy points on speculation. A 100% bonus that doubles a balance you never redeem is not a discount. It is cash converted into a currency that may devalue. When you do have a stay in mind, the points price is usually the more reasonable number, so buy only for that stay.'}
        </Callout>

        <h2 className={h2}>When it is worth it</h2>
        <p className={p}>Buying wins in one situation: an expensive stay where cash is high but the points price is not.</p>
        <ul className={ul} style={liStyle}>
          <li><strong>Great fits:</strong> a splurgy InterContinental, a boutique Vignette or Hotel Indigo, or an all-inclusive beach resort over a holiday week.</li>
          <li><strong>Skip it</strong> for everyday, fairly priced hotels. If the cash rate is reasonable, just pay and keep the flexibility.</li>
        </ul>
        <Table
          head={['Buy points when...', 'Skip it when...']}
          rows={[
            ['You have a specific pricey stay in mind', 'You are buying "to have points"'],
            ['Cash is high and the points price is not', 'The room is a fair, moderate cash price'],
            ['You can stay 4+ nights (see below)', 'A 1- or 2-night stay, no free night triggers'],
            ['The bonus is at or near 100%', 'The bonus is small and no stay is urgent'],
          ]}
        />

        <h2 className={h2}>The trick: the 4th reward night free</h2>
        <p className={p}>This is what turns a good buy into a great one:</p>
        <ul className={ul} style={liStyle}>
          <li>With the <strong>IHG One Rewards Premier card</strong> (about $99 a year), every standard-room reward stay of <strong>4+ consecutive nights</strong> at the same property gets the 4th night free. No cap on how often you use it.</li>
          <li>Stack it on a points bonus and it compounds: buy points at a discount, then pay for only three nights out of every four.</li>
        </ul>

        <Callout>
          <strong>A real one I booked:</strong>{' '}
          {'I spent a week at an all-inclusive Iberostar in Jamaica on IHG points. These resorts are bookable with points now, and because I carry the IHG Premier card, my 4th night was free. An all-inclusive beach week, paid in points instead of a steep cash rate, with a free night on top. That is what makes buying points during a bonus pay for itself.'}
        </Callout>

        <h2 className={h2}>How to do it right</h2>
        <ol className="mt-3 flex flex-col gap-2 font-body text-[var(--color-text-primary)]" style={{ listStyle: 'decimal', paddingLeft: '1.25rem' }}>
          <li><strong>Price the stay in cash first.</strong> That is your benchmark.</li>
          <li><strong>Check the points price</strong> for the same nights, and aim for 4+ nights if you hold the Premier card.</li>
          <li><strong>Buy only if points clearly win,</strong> and only enough to cover the stay, not a round number.</li>
          <li><strong>Check your own offer</strong> (IHG sometimes targets smaller bonuses), and do not sit on a big balance since points expire after long inactivity.</li>
        </ol>

        <h2 className={h2}>FAQ</h2>
        <div className="mt-3 flex flex-col gap-4">
          {FAQ.map((f) => (
            <div key={f.q}>
              <p className="font-body font-semibold text-[var(--color-text-primary)]">{f.q}</p>
              <p className="mt-1 font-body text-[var(--color-text-secondary)]">{f.a}</p>
            </div>
          ))}
        </div>

        <h2 className={h2}>Sources</h2>
        <p className="mt-2 font-body text-sm text-[var(--color-text-secondary)]">
          Card and program details trace to IHG and Chase directly. Bonus sizes and terms change, so confirm the current offer before you buy.
        </p>
        <ul className="mt-3 flex flex-col gap-1.5 font-body text-sm" style={{ listStyle: 'disc', paddingLeft: '1.25rem' }}>
          {[
            ['IHG One Rewards Premier card benefits (Chase)', 'https://www.chase.com/personal/credit-cards/ihg/premier/premier-perks'],
            ['IHG One Rewards Premier card (IHG)', 'https://www.ihg.com/onerewards/content/us/en/creditcard'],
            ['Iberostar Beachfront Resorts on IHG', 'https://www.ihg.com/iberostar-beachfront-resorts/content/us/en/locations/jamaica'],
            ['IHG One Rewards member terms', 'https://www.ihg.com/content/us/en/customer-care/member-tc'],
          ].map(([label, href]) => (
            <li key={href}><a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>{label} ↗</a></li>
          ))}
        </ul>

        <p className="mt-10 font-body text-sm text-[var(--color-text-secondary)]">
          Not affiliated with IHG or any card issuer. Browse all <Link href="/guides" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>guides</Link> or our{' '}
          <Link href="/programs?type=hotel" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>hotel program pages</Link>.
        </p>
        <GuideNewsletterCTA />
      </div>
    </main>
  )
}
