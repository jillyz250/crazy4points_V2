import type { Metadata } from 'next'
import Link from 'next/link'
import { GuideDateline } from '@/components/guides/GuideDateline'
import { GuideJsonLd } from '@/components/guides/GuideJsonLd'
import GuideNewsletterCTA from '@/components/guides/GuideNewsletterCTA'

export const metadata: Metadata = {
  title: 'How to Use Chase Ultimate Rewards',
  description:
    'Earn Chase points, unlock transfers with the one card rule that matters, and turn them into outsized value at all 14 transfer partners. A plain-language guide to the most beginner-friendly points currency.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/how-to-use-chase-ultimate-rewards' },
  openGraph: {
    title: 'How to Use Chase Ultimate Rewards',
    description:
      'The one card rule that unlocks transfers, all 14 partners, the Hyatt sweet spot, and the mistakes that quietly burn value.',
    url: 'https://www.crazy4points.com/guides/how-to-use-chase-ultimate-rewards',
    type: 'article',
    siteName: 'crazy4points',
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 86400

const h2 = 'mt-12 font-display text-2xl font-semibold text-[var(--color-primary)]'
const p = 'mt-4 font-body text-[var(--color-text-primary)]'
const li = 'font-body text-[var(--color-text-primary)]'

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

export default function Page() {
  return (
    <main className="rg-major-section">
      <div className="rg-container rg-guide" style={{ maxWidth: '60rem' }}>
        <p className="font-ui text-sm font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
          <Link href="/guides" className="hover:text-[var(--color-primary)]">Guides</Link> · Cards &amp; Points
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          How to Use Chase Ultimate Rewards
        </h1>
        <GuideDateline slug="how-to-use-chase-ultimate-rewards" />
        <GuideJsonLd slug="how-to-use-chase-ultimate-rewards" />

        <p className={p}>
          Chase Ultimate Rewards is the most beginner-friendly transferable currency out there. You earn it on the
          Sapphire and Ink cards, move it to 10 airlines and 4 hotels, and its headline sweet spot, World of Hyatt, can
          turn 35,000 points into a hotel night that would cost hundreds of dollars in cash. The golden rule: find the
          award you want first, then transfer, because every transfer is instant and one way.
        </p>

        <h2 className={h2}>Earning it, and the one rule that matters</h2>
        <p className={p}>
          Chase points come from the Sapphire family (Preferred and Reserve), the Ink business cards, and the Freedom
          cards. Here is the catch that trips people up: only a card that earns full Ultimate Rewards, a Sapphire or an
          Ink Business Preferred, can transfer points to travel partners.
        </p>
        <Callout>
          <strong>Freedom and Ink Cash or Unlimited points can&apos;t transfer on their own.</strong> First move them into a
          Sapphire or Ink Business Preferred account (free and instant in the Ultimate Rewards portal), then transfer out
          to a partner. If you only hold a Freedom card, that pooling step is what unlocks the whole transfer game.
        </Callout>

        <h2 className={h2}>The 14 transfer partners</h2>
        <p className={p}>
          Chase moves points 1 to 1 to every partner, with one exception noted below.
        </p>
        <p className={p}>
          <strong>Airlines (10):</strong> Air Canada Aeroplan, United, Southwest, JetBlue, British Airways Avios, Iberia,
          Aer Lingus, Air France and KLM Flying Blue, Virgin Atlantic, and Singapore KrisFlyer.
        </p>
        <p className={p}>
          <strong>Hotels (4):</strong> World of Hyatt, Marriott Bonvoy, IHG One Rewards, and Wyndham Rewards.
        </p>
        <Callout tone="warn">
          <strong>The one exception is Hyatt, and it now depends on your card.</strong> The Sapphire Reserve still
          transfers to Hyatt at 1 to 1. The Sapphire Preferred and Ink Business Preferred dropped to 4 to 3, a 25 percent
          haircut. It is already in effect for new applicants, and existing Preferred cardholders hit it on October 1,
          2026. If you hold a Preferred and want Hyatt points, moving them before October 1 locks in the 1 to 1 rate.
        </Callout>

        <h2 className={h2}>The sweet spots</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li className={li}>
            <strong>World of Hyatt</strong> is why most people hold Chase points. Top Park Hyatt and Alila resorts that
            run several hundred dollars a night book for 35,000 to 45,000 points. Nothing else in the transferable world
            touches it. (Watch the Reserve versus Preferred ratio above.)
          </li>
          <li className={li}>
            <strong>Aeroplan</strong> offers a free stopover, no fuel surcharges on many partners, and strong Star
            Alliance business class pricing.
          </li>
          <li className={li}>
            <strong>Avios</strong> (British Airways, Iberia, Aer Lingus) shines for short off-peak flights, especially the
            US East Coast to Europe and hops within a region, for very few points.
          </li>
          <li className={li}>
            <strong>Virgin Atlantic</strong> is the way into ANA first class and Delta One when award space appears.
          </li>
          <li className={li}>
            <strong>Southwest</strong> has no change fees, no award chart games, and points count toward the Companion
            Pass.
          </li>
        </ul>

        <h2 className={h2}>How to actually redeem</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-6">
          <li className={li}>
            <strong>Transfer to a partner</strong> for premium cabin flights or Hyatt nights. This is the highest value
            move.
          </li>
          <li className={li}>
            <strong>Book through Chase Travel</strong> at 1 to 1.5 cents per point, with the Sapphire Reserve getting the
            top rate. Simple, and no transfer needed.
          </li>
          <li className={li}>
            <strong>Cash back or gift cards</strong> at 1 cent each. A fine floor, but you leave real value behind versus
            transfers.
          </li>
        </ol>

        <h2 className={h2}>Can you share points with someone else?</h2>
        <p className={p}>
          Yes, with one important limit: the other person has to live at your address. It can be a spouse, partner,
          roommate, or any family member, and the relationship does not matter, only the shared address does.
        </p>
        <p className={p}>Here is exactly how it works:</p>
        <ol className="mt-4 list-decimal space-y-2 pl-6">
          <li className={li}>
            The first time, call the number on the back of your card and tell the agent you want to combine points with a
            household member. They will ask for that person&apos;s card number to link the two accounts.
          </li>
          <li className={li}>
            After that, you move points yourself using the Combine Points tool in the Ultimate Rewards portal, and they
            arrive in the other account almost immediately.
          </li>
        </ol>
        <p className={p}>
          You cannot send points to a friend, to family at a different address, or to a business contact. The rule exists
          to stop people from selling points.
        </p>

        <h2 className={h2}>Mistakes that quietly burn value</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li className={li}>
            <strong>Transferring before you find the award.</strong> Transfers are one way and final, so confirm the seat
            or room is available first.
          </li>
          <li className={li}>
            <strong>Letting Freedom points strand.</strong> They can&apos;t reach partners until you pool them into a
            Sapphire or Ink Business Preferred.
          </li>
          <li className={li}>
            <strong>Defaulting to cash back.</strong> At 1 cent you are ignoring the whole reason to hold Ultimate
            Rewards.
          </li>
          <li className={li}>
            <strong>Ignoring the Hyatt ratio change</strong> if you carry a Sapphire Preferred or Ink Business Preferred.
          </li>
        </ul>

        <h2 className={h2}>Quick answers</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li className={li}>
            <strong>Do transfers cost anything?</strong> No fees or taxes on any partner, and they are instant for nearly
            all of them.
          </li>
          <li className={li}>
            <strong>Does Chase transfer to American or Emirates?</strong> No, neither is a partner.
          </li>
          <li className={li}>
            <strong>Do points expire?</strong> Not while your card account is open and in good standing.
          </li>
        </ul>

        <GuideNewsletterCTA />
      </div>
    </main>
  )
}
