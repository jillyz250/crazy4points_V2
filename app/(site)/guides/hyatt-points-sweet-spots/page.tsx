import type { Metadata } from 'next'
import Link from 'next/link'
import { GuideDateline } from '@/components/guides/GuideDateline'
import { GuideJsonLd } from '@/components/guides/GuideJsonLd'
import GuideNewsletterCTA from '@/components/guides/GuideNewsletterCTA'

export const metadata: Metadata = {
  title: 'The Best Hyatt Sweet Spots (After the 2026 Chart Refresh)',
  description:
    'Where World of Hyatt points still win after the 5-tier overhaul: low-category steals, aspirational Park Hyatts and Alilas, all-inclusives, and the smart mechanics, with the current award chart.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/hyatt-points-sweet-spots' },
  openGraph: {
    title: 'The Best Hyatt Sweet Spots (After the 2026 Chart Refresh)',
    description:
      'Where World of Hyatt points still win after the 5-tier overhaul, with the current award chart and honest, cash-vs-points value.',
    url: 'https://www.crazy4points.com/guides/hyatt-points-sweet-spots',
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
const li = 'font-body text-[var(--color-text-primary)]'

const CHART: Array<[string, string, string, string, string, string]> = [
  ['1', '3,000', '4,500', '6,000', '7,500', '9,000'],
  ['2', '6,000', '7,500', '10,000', '12,000', '15,000'],
  ['3', '8,000', '12,000', '15,000', '17,500', '20,000'],
  ['4', '12,000', '15,000', '20,000', '22,500', '25,000'],
  ['5', '15,000', '20,000', '25,000', '30,000', '35,000'],
  ['6', '20,000', '25,000', '30,000', '35,000', '40,000'],
  ['7', '25,000', '30,000', '35,000', '45,000', '55,000'],
  ['8', '35,000', '45,000', '55,000', '65,000', '75,000'],
]

export default function HyattSweetSpotsGuide() {
  return (
    <main className="rg-major-section">
      <div className="rg-container rg-guide" style={{ maxWidth: '64rem' }}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
          Guide &middot; Hotels &amp; Stays
        </span>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          The Best Hyatt Sweet Spots (After the 2026 Chart Refresh)
        </h1>
        <GuideDateline slug="hyatt-points-sweet-spots" />
        <GuideJsonLd slug="hyatt-points-sweet-spots" />
        <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">
          World of Hyatt is still the most valuable hotel currency in points and miles. But in May 2026 Hyatt overhauled its award chart, so <em>where</em> your points win has shifted. This is the honest, current map: what still delivers, what got pricier, and how to book smart.
        </p>

        <Callout tone="warn">
          <strong>What changed:</strong>{' '}
          Hyatt swapped the old off-peak / standard / peak system for <strong>five pricing tiers</strong> (Lowest, Low, Moderate, Upper, Top). Categories still run 1 to 8, but most nights now cost more, and the very top jumped to 75,000 points. The upside: a new &quot;Lowest&quot; tier created some cheaper off-season floors. Flexible dates are more valuable than ever.
        </Callout>

        <h2 className={h2}>The current chart (standard rooms)</h2>
        <p className={p}>
          Every property is assigned a category, and the nightly price flexes across the five tiers by date. Here is the current standard-room chart. Most normal-season stays land in the <strong>Moderate</strong> column.
        </p>
        <div className="rg-table-scroll mt-4">
          <table className="w-full border-collapse font-body text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-soft)] text-left">
                <th className="py-2 pr-4 font-ui font-semibold text-[var(--color-primary)]">Category</th>
                <th className="py-2 pr-4 font-ui font-semibold text-[var(--color-text-secondary)]">Lowest</th>
                <th className="py-2 pr-4 font-ui font-semibold text-[var(--color-text-secondary)]">Low</th>
                <th className="py-2 pr-4 font-ui font-semibold text-[var(--color-primary)]">Moderate</th>
                <th className="py-2 pr-4 font-ui font-semibold text-[var(--color-text-secondary)]">Upper</th>
                <th className="py-2 pr-4 font-ui font-semibold text-[var(--color-text-secondary)]">Top</th>
              </tr>
            </thead>
            <tbody>
              {CHART.map((row) => (
                <tr key={row[0]} className="border-b border-[var(--color-border-soft)]">
                  <td className="py-2 pr-4 font-semibold text-[var(--color-text-primary)]">Cat {row[0]}</td>
                  {row.slice(1).map((v, i) => (
                    <td key={i} className={`py-2 pr-4 ${i === 2 ? 'font-semibold text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 font-body text-sm text-[var(--color-text-secondary)]">
          All-inclusive resorts use a separate A-to-F chart. Categories and dates move, so confirm the current price for your exact property and stay on hyatt.com before you transfer points.
        </p>

        <h2 className={h2}>1. Low-category steals</h2>
        <p className={p}>
          The quiet magic of Hyatt is the bottom of the chart. A Category 1 night starts at just <strong>3,000 points</strong>, and Hyatt hides genuinely nice hotels down there, all over the world, in cities where cash rates are far higher.
        </p>
        <ul className="mt-3 flex flex-col gap-2" style={{ listStyle: 'disc', paddingLeft: '1.25rem' }}>
          <li className={li}><strong>International low-category gems.</strong> The Grand Hyatt Manila, for example, runs around 12,000 points a night for a room that often sells for $300 or more. Similar math shows up at low-category Hyatt Place and Hyatt Regency properties across Asia, Eastern Europe, and beyond, where cash rates far outrun the points price.</li>
          <li className={li}><strong>Event-weekend arbitrage.</strong> Book a Hyatt in a city hosting a big game, festival, or conference. Cash rates spike into four figures on those nights, but the award price is tied to the property&apos;s category, not the sold-out cash rate, so a low-category Hyatt can be a fraction of the going rate.</li>
          <li className={li}><strong>Off-season Lowest-tier windows.</strong> The new Lowest tier can price below the old off-peak floor. If your dates are flexible, hunt for the cheapest tier, a Category 1 to 3 stay can dip to 3,000 to 8,000 points a night.</li>
        </ul>

        <h2 className={h2}>2. Aspirational luxury (Park Hyatt, Andaz, Alila)</h2>
        <p className={p}>
          The top of the chart is where a fixed award price collides with a sky-high cash rate. These stays got more expensive in the refresh, but they still shine because the rooms are so pricey in cash.
        </p>
        <ul className="mt-3 flex flex-col gap-2" style={{ listStyle: 'disc', paddingLeft: '1.25rem' }}>
          <li className={li}><strong>Alila resorts (Category 7 to 8).</strong> Alila Napa Valley (Category 7) runs 25,000 to 55,000 points, and Alila Ventana Big Sur (Category 8) runs 35,000 to 75,000, for rooms that routinely list at $1,200 to $2,000 a night in cash.</li>
          <li className={li}><strong>Top Park Hyatts and Andaz (Category 8).</strong> Andaz Maui, the Park Hyatt flagships, and similar top-tier properties run 35,000 to 75,000 points. Target the Lowest and Low tiers and you are booking a room most people pay well over $1,000 for.</li>
          <li className={li}><strong>The honest caveat.</strong> After the refresh, luxury Hyatt redemptions generally deliver less eye-popping value than a year ago. They are still strong when the cash rate is high and you book the cheaper tiers, but they are no longer automatic. Check the cash price before you decide.</li>
        </ul>

        <h2 className={h2}>3. All-inclusives and wellness</h2>
        <p className={p}>
          Hyatt&apos;s all-inclusive brands are some of the best value in the whole portfolio, because the award price covers your food, drinks, and activities too, things you would otherwise pay for on top of a room.
        </p>
        <ul className="mt-3 flex flex-col gap-2" style={{ listStyle: 'disc', paddingLeft: '1.25rem' }}>
          <li className={li}><strong>Ziva, Zilara, Secrets, and Dreams.</strong> These Mexico and Caribbean resorts price on Hyatt&apos;s separate A-to-F chart, often in the 20,000 to 30,000-point range per night. A comparable all-inclusive night runs $500 to $800 in cash for two people, meals and drinks included.</li>
          <li className={li}><strong>Miraval wellness resorts.</strong> Miraval sits outside the standard 1-to-8 chart on its own occupancy-based award pricing, and your award night also includes a daily resort credit toward spa treatments and wellness activities. Cash nights top $1,000, so redeeming points here, credit included, is a genuine splurge.</li>
        </ul>

        <h2 className={h2}>4. Smart mechanics that stretch your points</h2>
        <ul className="mt-3 flex flex-col gap-2" style={{ listStyle: 'disc', paddingLeft: '1.25rem' }}>
          <li className={li}><strong>Free Night Certificates (Category 1 to 4).</strong> The Chase World of Hyatt card&apos;s annual free night covers Category 1 to 4 properties, exactly where the low-category steals live. Point it at a stay whose cash rate is highest.</li>
          <li className={li}><strong>Points plus Cash.</strong> Pay half the points and a per-night cash co-pay. Handy when you are short on points and the co-pay is reasonable relative to the cash rate.</li>
          <li className={li}><strong>Chase flexible flexibility.</strong> Hyatt is one of the only transfer partners where hotel points routinely out-value airline miles, which is why moving Chase points to Hyatt (with a specific booking in mind) is such a common move.</li>
          <li className={li}><strong>Guest of Honor.</strong> If you hold Globalist status, you can book an award stay for a friend or family member and extend your in-hotel benefits (breakfast, upgrades, waived resort fees) to their stay.</li>
        </ul>

        <h2 className={h2}>5. Getting the points (and one timing warning)</h2>
        <p className={p}>
          Hyatt does not sell a ton of points cheaply, so most people fund these stays by transferring flexible points. Two clean paths:
        </p>
        <ul className="mt-3 flex flex-col gap-2" style={{ listStyle: 'disc', paddingLeft: '1.25rem' }}>
          <li className={li}><strong>Chase Ultimate Rewards, 1 to 1.</strong> The most common path. See our <Link href="/programs/chase" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Chase</Link> and <Link href="/programs/hyatt" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Hyatt</Link> pages for details.</li>
          <li className={li}><strong>Bilt, 1 to 1.</strong> The other major US route into Hyatt, useful if you earn Bilt on rent.</li>
        </ul>
        <Callout tone="warn">
          <strong>Timing warning:</strong>{' '}
          Chase has announced that the Sapphire <em>Preferred</em> will transfer to Hyatt at <strong>4 to 3 (about 75%)</strong> starting this fall, while the Sapphire <em>Reserve</em> keeps 1 to 1. If you hold the Preferred and already have a specific Hyatt stay in mind, it is worth moving the exact points you need before the change, not speculatively, only for a booking you are ready to make.
        </Callout>

        <p className="mt-10 font-body text-sm text-[var(--color-text-secondary)]">
          Award prices reflect the current World of Hyatt 5-tier chart; individual property categories and dates change, so confirm on hyatt.com before transferring. Browse all <Link href="/guides" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>guides</Link> or dig into the <Link href="/programs/hyatt" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Hyatt program page</Link>.
        </p>

        <GuideNewsletterCTA />
      </div>
    </main>
  )
}
