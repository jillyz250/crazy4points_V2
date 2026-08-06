import type { Metadata } from 'next'
import Link from 'next/link'
import { GuideDateline } from '@/components/guides/GuideDateline'
import GuideNewsletterCTA from '@/components/guides/GuideNewsletterCTA'

export const metadata: Metadata = {
  title: 'Hotel & Travel-Portal Best Rate Guarantees — The 2026 Guide',
  description:
    'Every hotel and travel-portal best rate / price match guarantee, from official terms — who has one, what you get, and how to win a claim. Verified July 2026.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/hotel-best-rate-guarantees' },
  openGraph: {
    title: 'Hotel & Travel-Portal Best Rate Guarantees — The 2026 Guide',
    description:
      'Who has a best rate guarantee, what you actually get, and how to win a claim — pulled from each company’s official terms.',
    url: 'https://www.crazy4points.com/guides/hotel-best-rate-guarantees',
    type: 'article',
    siteName: 'crazy4points',
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 86400

type Row = { name: string; reward: string; window: string; verdict: string; href: string }

const HOTELS: Row[] = [
  { name: 'Marriott Bonvoy', reward: 'Match + 25% off OR 5,000 pts', window: 'within 24h, ≥24h before check-in', verdict: '⭐ Excellent', href: 'https://www.marriott.com/online-hotel-booking.mi#bestrate' },
  { name: 'Hilton Honors', reward: 'Match + 25% off', window: 'within 24h', verdict: '⭐ Excellent', href: 'https://www.hilton.com/en/p/price-match-guarantee/' },
  { name: 'World of Hyatt', reward: 'Match + 20% off OR 5,000 pts', window: 'within 24h', verdict: '⭐ Excellent', href: 'https://www.hyatt.com/en-US/info/best-rate-guarantee' },
  { name: 'IHG One Rewards', reward: 'Match + 5× points (max 40,000)', window: 'within 24h, ≥24h before check-in', verdict: 'Good', href: 'https://www.ihg.com/content/us/en/customer-care/lowest-internet-rate-terms-conditions' },
  { name: 'Choice Privileges', reward: 'Match + $50 card (US) / free night (intl)', window: 'within 24h, ≥48h before arrival', verdict: 'Good', href: 'https://www.choicehotels.com/legal/best-rate-rules' },
  { name: 'Wyndham Rewards', reward: 'Match + 3,000 pts', window: 'within 24h, ≥48h before check-in', verdict: 'Good', href: 'https://www.wyndhamhotels.com/hotel-deals/best-rate-guarantee-terms' },
  { name: 'Best Western', reward: 'Match + $100 gift card', window: 'within 24h, ≥48h before check-in', verdict: '⭐ Excellent', href: 'https://www.bestwestern.com/en_US/hotels/discover-best-western/low-rate-guarantee.html' },
  { name: 'Accor (ALL)', reward: 'Match + 25% off (10% Fairmont/Raffles)', window: 'within 24h, ≥48h before arrival', verdict: '⭐ Excellent', href: 'https://all.accor.com/a/en/information/best-price-guarantee-conditions.html' },
  { name: 'Radisson Rewards', reward: 'Match + 25% off', window: 'within 24h, ≥48h before arrival', verdict: '⭐ Excellent', href: 'https://www.radissonhotels.com/en-us/best-rate-guarantee' },
  { name: 'The Langham', reward: 'Match + 10% off', window: 'within 24h, ≥24h before check-in', verdict: 'Good', href: 'https://www.langhamhotels.com/en/best-rate-guarantee/best-rate-guarantee-terms-conditions/' },
  { name: 'Preferred / iPrefer', reward: 'Match + upgrade/wifi/checkout perks', window: 'within 24h', verdict: 'Good', href: 'https://preferredhotels.com/page/best-rate-guarantee-terms-and-conditions' },
  { name: 'Shangri-La Circle', reward: 'Match (no bonus)', window: 'within 24h', verdict: 'Fair', href: 'https://www.shangri-la.com/corporate/best-rate-guarantee/terms-conditions/' },
  { name: 'SLH (Best Rate Promise)', reward: 'Match (no bonus)', window: 'within 24h, ≥3 working days before', verdict: 'Fair', href: 'https://slh.com/about-slh/best-rate-promise/best-rate-promise-tcs' },
  { name: 'Club Med', reward: 'Match + 10% off', window: 'same day (by 11:59pm EST)', verdict: 'Good', href: 'https://www.clubmed.us/l/best-rate-guarantee' },
  { name: 'Barceló', reward: 'Match + 10% off', window: 'within 24h, ≥72h before arrival', verdict: 'Good', href: 'https://www.barcelo.com/en-us/general-information/best-online-price-guaranteed/' },
]

const PORTALS: Row[] = [
  { name: 'Capital One Travel', reward: '100% of difference as travel credit (flights, hotels, cars)', window: 'within 24h', verdict: '⭐ Best card portal', href: 'https://travel.capitalone.com/terms/best-price-guarantee/' },
  { name: 'Amex Travel', reward: 'refund the difference (hotels only)', window: 'before stay (30 days after, pay-later)', verdict: 'Good (FHR excluded)', href: 'https://www.americanexpress.com/en-us/travel/faq/hotel-booking/' },
  { name: 'Booking.com', reward: 'refund the difference', window: 'offer must still be live', verdict: 'Good', href: 'https://www.booking.com/general.html?tmpl=doc%2Frate_guarantee' },
  { name: 'Priceline (VIP)', reward: '100% of diff (200% Express Deals)', window: 'within 24h', verdict: 'Good', href: 'https://help.priceline.com/what-is-best-price-guarantee-Sys6cJ86u' },
  { name: 'Agoda', reward: 'Match or AgodaCash', window: 'by 11:59pm day before check-in', verdict: 'Good', href: 'https://www.agoda.com/info/agoda-policies.html' },
]

function RateTable({ rows, firstCol }: { rows: Row[]; firstCol: string }) {
  return (
    <div className="rg-table-scroll">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '0.9375rem' }}>
        <thead>
          <tr style={{ background: 'var(--color-primary)', color: '#fff', textAlign: 'left' }}>
            {[firstCol, 'You get', 'Claim window', 'Verdict', 'Official terms'].map((h) => (
              <th key={h} style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name} style={{ background: i % 2 ? 'var(--color-background-soft)' : 'var(--color-background)', borderBottom: '1px solid var(--color-border-soft)' }}>
              <td style={{ padding: '0.625rem 0.75rem', fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{r.name}</td>
              <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)' }}>{r.reward}</td>
              <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{r.window}</td>
              <td style={{ padding: '0.625rem 0.75rem', whiteSpace: 'nowrap' }}>{r.verdict}</td>
              <td style={{ padding: '0.625rem 0.75rem', whiteSpace: 'nowrap' }}>
                <a href={r.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Terms ↗</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Callout({ children, tone = 'soft' }: { children: React.ReactNode; tone?: 'soft' | 'warn' }) {
  const border = tone === 'warn' ? 'var(--color-accent)' : 'var(--color-primary)'
  return (
    <div style={{ background: 'var(--color-background-soft)', border: '1px solid var(--color-border-soft)', borderLeft: `4px solid ${border}`, borderRadius: 'var(--radius-card)', padding: '1rem 1.25rem', margin: '1.25rem 0', fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)', lineHeight: 1.55 }}>
      {children}
    </div>
  )
}

export default function BestRateGuaranteeGuide() {
  return (
    <main className="rg-major-section">
      <div className="rg-container rg-guide" style={{ maxWidth: '64rem' }}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
          Guide · Last verified July 10, 2026
        </span>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          Hotel &amp; Travel-Portal Best Rate Guarantees
        </h1>
        <GuideDateline slug="hotel-best-rate-guarantees" />
        <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">
          A plain-English map of the top hotel and travel-portal &ldquo;best rate / price match&rdquo; guarantees —
          who has one, what you actually get, and how to win a claim. We checked <strong>27 hotel programs</strong> and
          <strong> 14 travel portals</strong>, and pulled the terms from each company&rsquo;s <strong>own official pages</strong>.
          Programs change often — check the official link before you rely on any rate.
        </p>

        {/* Quick takeaways */}
        <section style={{ background: 'var(--color-background-soft)', border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-card)', padding: '1.25rem 1.5rem', margin: '1.75rem 0' }}>
          <h2 className="font-display text-xl font-semibold text-[var(--color-primary)]">Quick takeaways</h2>
          <ul className="mt-3 flex flex-col gap-1.5 font-body text-[var(--color-text-primary)]">
            <li><strong>Best overall:</strong> Marriott &amp; Hilton — match + 25% off.</li>
            <li><strong>Best cash reward:</strong> Best Western — match + $100 gift card.</li>
            <li><strong>Best points option:</strong> Marriott &amp; Hyatt — match + 5,000 points (or take the % off).</li>
            <li><strong>Tightest minimum gap:</strong> Accor — competing rate must be 5% (or €5) lower.</li>
            <li><strong>Most flexible travel portal:</strong> Capital One Travel — 100% of the difference on flights, hotels <em>and</em> cars.</li>
          </ul>
        </section>

        <Callout>
          <strong>One thing up front:</strong> a &ldquo;best rate guarantee&rdquo; is <em>not</em>{' '}
          a guarantee you&rsquo;ll get a lower price. Approval depends on meeting <strong>every</strong>{' '}
          requirement in that chain&rsquo;s official terms — matching room type, dates, occupancy,
          cancellation policy, taxes/fees, and live availability. Miss one and it&rsquo;s denied.
        </Callout>

        <h2 className="mt-8 font-display text-2xl font-semibold text-[var(--color-primary)]">How to actually win a best rate guarantee</h2>
        <ol className="mt-3 flex flex-col gap-2 font-body text-[var(--color-text-primary)]" style={{ listStyle: 'decimal', paddingLeft: '1.25rem' }}>
          <li><strong>Book direct first</strong> (as a loyalty member where required).</li>
          <li><strong>Claim within 24 hours</strong> of booking (some chains also require a set number of days before check-in).</li>
          <li><strong>Match everything</strong> — same hotel, room, dates, occupancy, and especially the <strong>same cancellation policy</strong>. Refundable-vs-prepaid mismatch is the #1 reason claims are denied.</li>
          <li><strong>Use a public, bookable rate</strong> — no member-only, login, coupon, opaque, package, or group rates.</li>
          <li><strong>Compare room rate only</strong>, net of taxes and resort fees, and mind the <strong>minimum gap</strong> (usually $1 or 1%; Accor needs 5%).</li>
        </ol>
        <p className="mt-4 font-body text-[var(--color-text-primary)]">
          Want the full playbook? See <Link href="/guides/how-to-win-a-best-rate-guarantee" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>How to Actually Win a Best Rate Guarantee</Link> — 31 tips pulled straight from the fine print.
        </p>

        <h2 className="mt-10 font-display text-2xl font-semibold text-[var(--color-primary)]">Hotel best rate guarantees</h2>
        <div className="mt-4"><RateTable rows={HOTELS} firstCol="Hotel program" /></div>
        <p className="mt-3 font-body text-sm text-[var(--color-text-secondary)]">
          <em>Bahia Principe rides on Hyatt&rsquo;s guarantee (match + 20% or 5,000 pts) now that it&rsquo;s part of World of Hyatt.</em>
        </p>
        <p className="mt-3 font-body text-[var(--color-text-primary)]">
          <strong>No consumer best rate guarantee:</strong> GHA Discovery, Sonesta, Sandals, Disney Vacation Club, Stash.
          These chains may offer member discounts or opaque pricing, but no consumer-facing best-rate claim process.
        </p>

        <h2 className="mt-10 font-display text-2xl font-semibold text-[var(--color-primary)]">Travel-portal price guarantees</h2>
        <Callout>
          <strong>Hotel BRGs and portal price guarantees are different animals.</strong> A hotel BRG compares your
          <em> direct</em> booking against other sites. A portal guarantee compares a price you booked <em>through that
          portal</em>, and — importantly — <strong>most portal &ldquo;refunds&rdquo; come back as travel credit, not cash to your card.</strong>
        </Callout>
        <div className="mt-4"><RateTable rows={PORTALS} firstCol="Portal" /></div>

        <Callout tone="warn">
          <strong>Chase Travel (provisional):</strong> Sapphire Reserve / J.P. Morgan Reserve cardholders have reported an
          in-portal price match on prepaid hotels. Chase publishes no public terms page for it, so <strong>check inside your
          own portal and confirm before relying on it</strong> — we&rsquo;ll add the details once we can verify them from an official source.
        </Callout>
        <Callout tone="warn">
          <strong>Ending soon:</strong> Expedia has announced its Hotel Price Guarantee will <strong>end July 28, 2026</strong>.
          If you&rsquo;re reading this after that date, verify it&rsquo;s still available before relying on it. <strong>Hotels.com</strong>&rsquo;s
          price match is now limited to One Key members who joined before Oct 31, 2025.
        </Callout>
        <p className="mt-1 font-body text-[var(--color-text-primary)]">
          <strong>No portal price guarantee:</strong> Citi Travel, Bilt Travel, Costco Travel, Kayak, Trivago, Orbitz, Travelocity, Google Hotels.
        </p>

        <p className="mt-10 font-body text-sm text-[var(--color-text-secondary)]">
          This guide is for general information; every guarantee is governed by the official terms linked above, which the
          chains can change at any time. Not affiliated with any hotel or travel company. Questions? See our{' '}
          <Link href="/programs" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>hotel program pages</Link>.
        </p>
        <GuideNewsletterCTA />
      </div>
    </main>
  )
}
