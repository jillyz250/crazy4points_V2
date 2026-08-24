import type { Metadata } from 'next'
import Link from 'next/link'
import { GuideDateline } from '@/components/guides/GuideDateline'
import { GuideJsonLd } from '@/components/guides/GuideJsonLd'
import GuideNewsletterCTA from '@/components/guides/GuideNewsletterCTA'

export const metadata: Metadata = {
  title: 'How to Turn Rakuten Cash Back Into Amex Points',
  description:
    'Flip one setting and Rakuten pays you in American Express Membership Rewards points instead of cash, so everyday shopping becomes transferable points. Eligibility, the two-step setup, and the fine print.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/rakuten-cash-back-to-amex-points' },
  openGraph: {
    title: 'How to Turn Rakuten Cash Back Into Amex Points',
    description:
      'Get paid by Rakuten in Amex Membership Rewards points instead of cash, so shopping you already do becomes transferable points.',
    url: 'https://www.crazy4points.com/guides/rakuten-cash-back-to-amex-points',
    type: 'article',
    siteName: 'crazy4points',
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 86400

const RAKUTEN_REF = 'https://www.rakuten.com/r/JC250E?eeid=28187'

const h2 = 'mt-12 font-display text-2xl font-semibold text-[var(--color-primary)]'
const p = 'mt-4 font-body text-[var(--color-text-primary)]'

function Callout({ children, tone = 'soft' }: { children: React.ReactNode; tone?: 'soft' | 'warn' }) {
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
    title: 'Change your payment method',
    body: 'In Rakuten, open Account Settings and switch your payment method to Membership Rewards points.',
  },
  {
    n: '2',
    title: 'Connect your Amex account',
    body: 'Sign in with your American Express login to link your Membership Rewards account. That is it.',
  },
]

const FINE_PRINT: { title: string; body: string }[] = [
  {
    title: 'Your existing cash back converts',
    body: 'Any cash back you have already earned gets converted to points and sent on the next payout.',
  },
  {
    title: 'Payouts come every 3 months',
    body: 'Rakuten transfers your points on its quarterly schedule, not instantly.',
  },
  {
    title: 'There is a 501-point minimum',
    body: 'You need at least 501 confirmed points before a payout date to receive that round.',
  },
]

export default function Page() {
  return (
    <main className="rg-major-section">
      <div className="rg-container rg-guide" style={{ maxWidth: '60rem' }}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
          Cards &amp; Points
        </span>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          How to Turn Rakuten Cash Back Into Amex Points
        </h1>
        <GuideDateline slug="rakuten-cash-back-to-amex-points" />
        <GuideJsonLd slug="rakuten-cash-back-to-amex-points" />

        <p className={p}>
          Rakuten pays you cash back for shopping through its portal. But you can flip one setting and get paid in{' '}
          <strong>American Express Membership Rewards points</strong> instead. Because those points transfer to airline
          and hotel partners, the exact same shopping can be worth a lot more than the cash version, if you are a points
          person.
        </p>

        <Callout tone="warn">
          <strong>First, the catch.</strong> You need an American Express card enrolled in the U.S. Membership Rewards
          program, active and in good standing. Corporate cards and the Rakuten American Express Card are not eligible.
        </Callout>

        <h2 className={h2}>Set it up in two steps</h2>
        <ol className="mt-4 flex flex-col gap-4">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-ui text-sm font-bold text-white"
                style={{ background: 'var(--color-primary)' }}
                aria-hidden
              >
                {s.n}
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-[var(--color-primary)]">{s.title}</p>
                <p className="mt-1 font-body text-[var(--color-text-primary)]">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className={h2}>The fine print worth knowing</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {FINE_PRINT.map((f) => (
            <li key={f.title} className="font-body text-[var(--color-text-primary)]">
              <strong>{f.title}.</strong> {f.body}
            </li>
          ))}
        </ul>

        <h2 className={h2}>Bottom line</h2>
        <p className={p}>
          If you value Amex points over cash, and most award travelers do, make the switch once and every future Rakuten
          purchase quietly becomes transferable points. New to Rakuten? Sign up, then set your payout to Amex points from
          day one.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={RAKUTEN_REF}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="rg-btn-primary"
          >
            Sign up for Rakuten &rarr;
          </a>
          <Link href="/tools/shopping-portals" className="rg-btn-secondary">
            See all shopping portals
          </Link>
        </div>
        <p className="mt-2 font-body text-xs text-[var(--color-text-secondary)] opacity-80">
          Referral link. We may earn a reward when you sign up, at no cost to you.
        </p>

        <GuideNewsletterCTA />
      </div>
    </main>
  )
}
