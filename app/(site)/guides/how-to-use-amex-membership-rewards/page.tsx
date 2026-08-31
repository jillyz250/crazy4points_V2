import type { Metadata } from 'next'
import Link from 'next/link'
import { GuideDateline } from '@/components/guides/GuideDateline'
import { GuideJsonLd } from '@/components/guides/GuideJsonLd'
import GuideNewsletterCTA from '@/components/guides/GuideNewsletterCTA'
import { GuideFaq } from '@/components/guides/GuideFaq'

export const metadata: Metadata = {
  title: 'How to Use Amex Membership Rewards',
  description:
    'Earn Membership Rewards, then turn them into outsized value at Amex’s airline and hotel transfer partners. Which cards earn MR, all the partners and ratios, the sweet spots, and the traps that quietly burn value.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/how-to-use-amex-membership-rewards' },
  openGraph: {
    title: 'How to Use Amex Membership Rewards',
    description:
      'The cards that earn MR, every transfer partner and ratio, the sweet spots, and the mistakes to avoid.',
    url: 'https://www.crazy4points.com/guides/how-to-use-amex-membership-rewards',
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
          How to Use Amex Membership Rewards
        </h1>
        <GuideDateline slug="how-to-use-amex-membership-rewards" />
        <GuideJsonLd slug="how-to-use-amex-membership-rewards" />

        <p className={p}>
          American Express Membership Rewards is one of the most flexible points currencies out there. The points are
          worth the most when you move them to Amex&apos;s airline and hotel partners and book premium cabins or
          high-end hotel nights. Cash-out options exist, but they are the weakest use. If you remember one thing:
          transfer to a travel partner, and only when you already know the flight or room you want to book.
        </p>

        <h2 className={h2}>Which cards earn Membership Rewards</h2>
        <p className={p}>
          Membership Rewards points come from Amex&apos;s Rewards cards, not its cash-back cards. On the personal side
          that is mainly the Amex Platinum, Amex Gold, and Amex Green. On the business side it is the Business Platinum,
          Business Gold, and the Blue Business Plus. The older Amex EveryDay and EveryDay Preferred still earn Membership
          Rewards, but Amex closed them to new applicants in 2024, so they only matter if you already carry one.
        </p>
        <Callout>
          <strong>Co-brand cards do not earn Membership Rewards.</strong> The Amex Delta, Hilton, and Marriott cards earn
          those partners&apos; own points directly, so they never add to your Membership Rewards balance.
        </Callout>

        <h2 className={h2}>The transfer partners, where the value lives</h2>
        <p className={p}>
          You can move points to about twenty airline and hotel programs. Most airline partners transfer at 1 to 1,
          which is the number you want to see.
        </p>
        <p className={p}>
          <strong>Airlines at 1 to 1:</strong> Aer Lingus AerClub, Air Canada Aeroplan, ANA Mileage Club, Avianca
          LifeMiles, British Airways Club (Avios), Delta SkyMiles, Air France and KLM Flying Blue, Iberia Plus, Qantas
          Frequent Flyer, Qatar Privilege Club, Singapore KrisFlyer, and Virgin Atlantic Flying Club.
        </p>
        <p className={p}>
          <strong>Airlines at a worse rate</strong> (weigh these carefully): Cathay Pacific Asia Miles and Emirates
          Skywards both give you fewer miles than the points you send, and JetBlue TrueBlue does too. Aeromexico Rewards
          gives you more points per point transferred, but Aeromexico points are individually worth less, so more is not
          automatically better.
        </p>
        <p className={p}>
          <strong>Hotels:</strong> Hilton Honors transfers at 1 to 2, but Hilton points are worth roughly half of other
          hotel currencies, so it is a fair trade at best. Marriott Bonvoy and Choice Privileges are both 1 to 1.
          Leading Hotels of the World (Leaders Club), added in July 2026, transfers at a steep 4 to 1 loss and is almost
          never a good move.
        </p>
        <Callout tone="warn">
          <strong>Not every partner is 1 to 1.</strong> Cathay, Emirates, and JetBlue give you less than you send, so
          always check the ratio before you move anything.
        </Callout>

        <h2 className={h2}>How to actually transfer</h2>
        <p className={p}>
          Log in at americanexpress.com, open the Membership Rewards Use Points area, choose Transfer Points, link your
          loyalty account once, and send. Transfers to most airline partners post quickly, though a few can take longer.
          Transfers are one way and cannot be reversed, so never move points speculatively.
        </p>

        <h2 className={h2}>The sweet spots</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li className={li}>
            <strong>Aeroplan, ANA, and Avianca LifeMiles</strong> are strong for Star Alliance business class, each with
            its own quirks worth learning.
          </li>
          <li className={li}>
            <strong>The Avios family</strong> (British Airways, Iberia, Qatar) shines for shorter flights and for
            reaching Europe, especially off-peak.
          </li>
          <li className={li}>
            <strong>Virgin Atlantic and ANA</strong> are classic ways into partner premium cabins when award space
            appears.
          </li>
          <li className={li}>
            <strong>Flying Blue</strong> runs frequent Promo Rewards that discount specific routes, often to Europe.
          </li>
        </ul>

        <h2 className={h2}>Traps that quietly burn value</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li className={li}>
            <strong>Transferring before you find the award.</strong> Transfers are one way and final, so confirm the seat
            or room is available first.
          </li>
          <li className={li}>
            <strong>The excise tax fee on U.S. airline transfers.</strong> Amex charges a small per-point fee, capped per
            transfer, when you move points to its U.S. airline partners (currently Delta and JetBlue). It is minor but
            real.
          </li>
          <li className={li}>
            <strong>Defaulting to cash, gift cards, or Pay with Points at checkout.</strong> Those give you far less than
            a good transfer. Treat them as a last resort.
          </li>
          <li className={li}>
            <strong>Leaning on the Amex Travel portal.</strong> Booking with points there is simple but usually worth
            less than transferring to a partner.
          </li>
        </ul>

        <GuideFaq
          items={[
            {
              q: 'What is the best way to use Membership Rewards?',
              a: 'Transfer them to an airline partner and book a premium-cabin or partner award. That is where the points stretch furthest; cash, gift cards, and Pay with Points are the weakest uses.',
            },
            {
              q: 'Which cards earn Membership Rewards?',
              a: 'The Amex Platinum, Gold, and Green on the personal side, and the Business Platinum, Business Gold, and Blue Business Plus on the business side. The older EveryDay cards still earn them but are closed to new applicants. Co-brand cards (Delta, Hilton, Marriott) earn those partners’ points instead.',
            },
            {
              q: 'Does Amex charge a fee to transfer points?',
              a: 'Only a small excise-tax fee, capped per transfer, when you move points to a U.S. airline partner (currently Delta and JetBlue). Transfers to other partners have no fee.',
            },
            {
              q: 'Are Amex transfers instant and reversible?',
              a: 'Most airline partners post quickly, though a few take longer, and every transfer is one-way and final. Only transfer once you have found the exact award you want to book.',
            },
            {
              q: 'Do Membership Rewards points expire?',
              a: 'Not while you hold at least one Membership Rewards card that is open and in good standing.',
            },
            {
              q: 'Is there a non-travel transfer partner?',
              a: 'Amex has announced Fanatics FanCash as its first non-travel transfer partner, but it is not live for transfers yet.',
            },
          ]}
        />

        <p className={p}>
          Bottom line: Membership Rewards is a top-tier flexible currency because of its airline transfer partners. Earn
          broadly, leave the points parked until you have a specific premium-cabin or partner award in mind, then
          transfer and book. Skip the cash-out options unless you truly have no travel use.
        </p>

        <GuideNewsletterCTA />
      </div>
    </main>
  )
}
