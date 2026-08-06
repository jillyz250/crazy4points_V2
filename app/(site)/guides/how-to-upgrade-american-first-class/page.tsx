import type { Metadata } from 'next'
import Link from 'next/link'
import { GuideDateline } from '@/components/guides/GuideDateline'
import GuideNewsletterCTA from '@/components/guides/GuideNewsletterCTA'

export const metadata: Metadata = {
  title: 'How to Upgrade to First Class on American Airlines (2026)',
  description:
    'Every current way to upgrade to First on American Airlines, when each offer appears, and how to use miles or cash to get there. Verified against official AA sources, 2026.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/how-to-upgrade-american-first-class' },
  openGraph: {
    title: 'How to Upgrade to First Class on American Airlines (2026)',
    description:
      'Complimentary upgrades, Instant Upgrades with cash or miles, Systemwide Upgrades, and the timing that actually gets you into First.',
    url: 'https://www.crazy4points.com/guides/how-to-upgrade-american-first-class',
    type: 'article',
    siteName: 'crazy4points',
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 86400

const WINDOWS: { status: string; window: string }[] = [
  { status: 'Executive Platinum', window: '100 hours' },
  { status: 'Platinum Pro', window: '72 hours' },
  { status: 'Platinum', window: '48 hours' },
  { status: 'Gold', window: '24 hours' },
]

const CHECKPOINTS: { when: string; what: string }[] = [
  { when: 'At booking', what: 'Glance at the Instant Upgrade price. Sometimes it is low enough to just grab.' },
  { when: 'Your status window (100 / 72 / 48 / 24 hours out)', what: 'If you have status, this is when your free upgrade can start clearing. Watch the app.' },
  { when: '24 hours before departure', what: 'Online check-in opens (a common spot for upgrade offers), and it is your last chance to use miles for an Instant Upgrade. If you want the miles option, act by now.' },
  { when: 'At the gate', what: 'Cash upgrade prices are often lower close to departure as American tries to fill unsold First seats. If you did not clear a free upgrade and you are flexible, check the app or ask here.' },
]

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Can I upgrade a Basic Economy ticket on American?',
    a: 'For tickets purchased on or after May 18, 2026, Basic Economy fares are generally not eligible for AAdvantage upgrades, including complimentary and Systemwide Upgrades. If upgrading matters to you, avoid Basic Economy.',
  },
  {
    q: 'Can I upgrade with AAdvantage miles?',
    a: 'Yes, through an Instant Upgrade, when an eligible seat is available and the offer shows a mileage price. You must redeem miles at least 24 hours before departure. There is no separate cash co-pay when you use miles.',
  },
  {
    q: 'When are American upgrades cheapest?',
    a: 'There is no fixed price. Instant Upgrade pricing is dynamic, and lower cash offers often appear closer to departure when seats remain unsold. Short flights tend to show the lowest prices.',
  },
  {
    q: 'Is it cheaper to book First outright or upgrade later?',
    a: 'Sometimes booking First outright is less expensive than buying Economy and later paying to upgrade. Always compare both prices before you buy.',
  },
  {
    q: 'Do paid upgrades earn Loyalty Points?',
    a: 'American’s current terms state that a cash Instant Upgrade, as an ancillary purchase, can earn AAdvantage miles and Loyalty Points at your normal earning rate. Earning rules are set by American and can change, so confirm the current AAdvantage terms. Upgrading with miles does not earn additional rewards.',
  },
  {
    q: 'Can passengers without status upgrade?',
    a: 'Yes. Instant Upgrades and buying First outright are open to anyone with an eligible ticket. Complimentary upgrades and Systemwide Upgrades require AAdvantage status.',
  },
]

const SOURCES: { label: string; href: string }[] = [
  { label: 'AA — Upgrades for status members', href: 'https://www.aa.com/web/i18n/aadvantage-program/answers-support/upgrades-for-status-members.html' },
  { label: 'AA — Use miles for upgrades', href: 'https://www.aa.com/web/i18n/aadvantage-program/use-miles/upgrades.html' },
  { label: 'AA — AAdvantage program updates', href: 'https://www.aa.com/i18n/aadvantage-program/aadvantage-program-updates.jsp' },
  { label: 'AA — AAdvantage terms and conditions (effective Mar 1, 2026)', href: 'https://www.aa.com/i18n/aadvantage-program/aadvantage-terms-and-conditions.jsp' },
]

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

export default function AaFirstClassUpgradeGuide() {
  return (
    <main className="rg-major-section">
      <div className="rg-container rg-guide" style={{ maxWidth: '64rem' }}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
          Guide · Last verified July 12, 2026
        </span>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          How to Upgrade to First Class on American Airlines
        </h1>
        <GuideDateline slug="how-to-upgrade-american-first-class" />
        <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">
          {'Let’s set expectations first. Domestic First on American is a wider recliner, a bit more legroom, complimentary alcoholic drinks, and a meal on many longer flights. It is not the lie-flat, pajamas-and-caviar Flagship Business you get across an ocean. An upgrade to domestic First is often worth chasing when it is cheap or free, and rarely worth overpaying for.'}
        </p>
        <p className={p}>
          {'Here is the good news for 2026: there are still a few solid ways in, and if you know when to look, you can catch First for the price of a nice lunch. The catch is that American has quietly reshaped how upgrades work, and two old favorites are gone. This guide covers what still works, what died, and the single most useful thing most people miss: when to check.'}
        </p>

        {/* Short version */}
        <section style={{ background: 'var(--color-background-soft)', border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-card)', padding: '1.25rem 1.5rem', margin: '1.75rem 0' }}>
          <h2 className="font-display text-xl font-semibold text-[var(--color-primary)]">The short version (2026)</h2>
          <p className="mt-2 font-body text-[var(--color-text-primary)]">There are three true upgrade methods, plus one alternative that is easy to forget:</p>
          <ol className="mt-3 flex flex-col gap-1.5 font-body text-[var(--color-text-primary)]" style={{ listStyle: 'decimal', paddingLeft: '1.25rem' }}>
            <li><strong>Complimentary upgrades</strong> if you hold AAdvantage status (free, but you wait your turn).</li>
            <li><strong>Instant Upgrades</strong> you buy with cash or miles (the flexible everyday option, and where the cheap prices live).</li>
            <li><strong>Systemwide Upgrades</strong>, a top-tier elite perk.</li>
            <li><strong>Booking First outright</strong> with cash or miles. Not technically an upgrade, but sometimes cheaper than you would guess.</li>
          </ol>
          <p className="mt-3 font-body text-[var(--color-text-primary)]">Two methods are gone: 500-mile upgrades and the old mileage upgrade award chart. More on those below so you are not chasing outdated advice.</p>
        </section>

        <h2 className={h2}>Way 1: Complimentary upgrades (if you have status)</h2>
        <p className={p}>
          {'If you hold AAdvantage elite status, eligible members are automatically added to the upgrade list for eligible flights. No form to fill out, no fee, as long as your AAdvantage number is on the reservation. The list clears by status tier and fare, and higher tiers start clearing earlier.'}
        </p>
        <p className="mt-4 font-body font-semibold text-[var(--color-text-primary)]">When your upgrade starts processing (the clearing window):</p>
        <div className="rg-table-scroll mt-3">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '0.9375rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-primary)', color: '#fff', textAlign: 'left' }}>
                {['AAdvantage status', 'Upgrade window before departure'].map((hd) => (
                  <th key={hd} style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', fontWeight: 700 }}>{hd}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WINDOWS.map((r, i) => (
                <tr key={r.status} style={{ background: i % 2 ? 'var(--color-background-soft)' : 'var(--color-background)', borderBottom: '1px solid var(--color-border-soft)' }}>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{r.status}</td>
                  <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)' }}>{r.window}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={p}>
          {'That window is the earliest your upgrade can confirm, not a guarantee. Upgrades can continue clearing until shortly before departure, including at the airport and at the gate if seats remain available. So if you have status, keep an eye on your trip in the app from your window onward, and do not lose hope if it has not cleared by boarding.'}
        </p>
        <p className={p}>
          <strong>Which flights qualify.</strong>{' '}
          {'Complimentary upgrades generally apply within North America and select nearby international markets: flights within and between the U.S. (including Hawaii), and between the U.S. and Canada, Mexico, the Bahamas, the Caribbean, Bermuda, and Central America. They generally do not apply to long-haul international flights to Europe, Asia, most of South America, or Australia, where different upgrade rules apply.'}
        </p>

        <h2 className={h2}>Way 2: Instant Upgrades (cash or miles)</h2>
        <p className={p}>
          {'This is the biggest recent change to American upgrades and the one worth understanding. American replaced its old fixed mileage upgrade chart with Instant Upgrades: a dynamic offer to jump to the next cabin, priced by how full the flight is, the route, and how close you are to departure. American uses this dynamic pricing, based on demand, remaining inventory, route, and time until departure, which is why the same seat can cost wildly different amounts on two different days.'}
        </p>
        <Callout>
          <strong>Not every flight gets an offer.</strong>{' '}
          {'Instant Upgrade offers are not guaranteed. Some eligible flights never receive one, usually because there is no First-class seat to sell or the cabin is already full.'}
        </Callout>
        <p className={p}>
          <strong>How to pay.</strong>{' '}
          {'You can use either cash or AAdvantage miles. Paying with miles does not require the old cash co-pay that the retired Mileage Upgrade Awards did. Paying with cash is treated as an ancillary purchase: American’s current terms state that these can earn AAdvantage miles and Loyalty Points at your normal earning rate. Because American sets these earning rules and can change them, confirm the current AAdvantage terms if that matters to you. If you pay with miles instead, you do not earn additional rewards on the upgrade. Either way, the miles and Loyalty Points you earn on the flight itself are based on your original fare, not the upgraded cabin.'}
        </p>
        <p className={p}>
          <strong>Where the offer shows up.</strong>{' '}
          {'You will primarily see Instant Upgrade offers in your trip on aa.com or in the American app. American may also surface similar paid upgrade offers by email, during check-in, at the gate, or through Reservations.'}
        </p>
        <p className={p}>
          <strong>This is the &ldquo;$35 First class&rdquo; you may have seen.</strong>{' '}
          {'Because the price floats, short flights close to departure can get surprisingly cheap. One traveler recently reported an offer around $35 per segment about a day before the flight. That is not a promo code or a sale you can go book. It is just the algorithm trying to fill an empty seat, and it comes and goes. Treat any low price as a happy surprise, not a plan.'}
        </p>
        <Callout tone="warn">
          <strong>The timing rule that matters most:</strong>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', listStyle: 'disc' }}>
            <li><strong>Paying with cash:</strong> offers can appear anytime between booking and shortly before departure.</li>
            <li><strong>Paying with miles:</strong> you must redeem by 24 hours before departure. Miss that window and the miles option disappears, even if cash upgrades are still offered.</li>
          </ul>
        </Callout>
        <p className={p}>
          {'So if you are hoping to use miles, set a reminder and check by the day before. If you are flexible and paying cash, lower offers frequently appear closer to departure when seats remain unsold, but dynamic pricing can also push the price higher, so there is no predictable pattern.'}
        </p>

        <h2 className={h2}>Way 3: Systemwide Upgrades (top-tier perk)</h2>
        <p className={p}>
          {'Executive Platinum members earn Systemwide Upgrades, which can lift you one cabin on almost any route, including long-haul international to lie-flat Flagship Business. They are the crown jewel of American upgrades and a big reason road warriors chase Executive Platinum.'}
        </p>
        <p className={p}>
          {'Two things to know: availability still depends on eligible upgrade inventory, and for tickets bought on or after May 18, 2026, Basic Economy fares are no longer eligible for AAdvantage upgrades, including Systemwide Upgrades.'}
        </p>

        <h2 className={h2}>What died (so you are not chasing ghosts)</h2>
        <ul className="mt-3 flex flex-col gap-2 font-body text-[var(--color-text-primary)]" style={{ listStyle: 'disc', paddingLeft: '1.25rem' }}>
          <li><strong>500-mile upgrades:</strong> retired. If you had unused 500-mile upgrade certificates, American converted each one into 250 Loyalty Points. Older guides still describe these. Ignore them.</li>
          <li><strong>The mileage upgrade award chart (miles plus co-pay):</strong> discontinued in 2025. The last requests were accepted through August 11, 2025. Instant Upgrades replaced it. If a blog tells you a fixed number of miles plus a cash co-pay upgrades your flight, it is out of date.</li>
        </ul>

        <h2 className={h2}>The &ldquo;when to check&rdquo; cheat sheet</h2>
        <p className={p}>This is the part most people miss. Set these mental checkpoints:</p>
        <ol className="mt-3 flex flex-col gap-2 font-body text-[var(--color-text-primary)]" style={{ listStyle: 'decimal', paddingLeft: '1.25rem' }}>
          {CHECKPOINTS.map((c) => (
            <li key={c.when}><strong>{c.when}.</strong> {c.what}</li>
          ))}
        </ol>

        <h2 className={h2}>The honest catch</h2>
        <p className={p}>
          {'The upside: casual travelers with no status can now snag First for very little, which used to be nearly impossible. If you fly American a couple of times a year, that is a genuine win.'}
        </p>
        <p className={p}>
          {'The caveat: as American sells more premium seats through dynamic upgrade offers, elites may see fewer complimentary upgrades clear than in the past. If you fly on status and bank on upgrades, factor in that the list can be shorter than it used to be.'}
        </p>

        <h2 className={h2}>Bottom line</h2>
        <p className={p}>
          {'Domestic First on American is worth grabbing when it is free or cheap, and easy to skip when it is not. If you have status, know your clearing window and watch the app. If you do not, watch the Instant Upgrade price, remember the 24-hour miles deadline, and check again near departure where cash prices tend to drop. First class for the price of lunch is real. It is just never guaranteed.'}
        </p>

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
          Every claim traces to American Airlines&rsquo; own pages. Programs change often; confirm details on aa.com before you rely on them.
        </p>
        <ul className="mt-3 flex flex-col gap-1.5 font-body text-sm" style={{ listStyle: 'disc', paddingLeft: '1.25rem' }}>
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>{s.label} ↗</a>
            </li>
          ))}
        </ul>

        <p className="mt-10 font-body text-sm text-[var(--color-text-secondary)]">
          Not affiliated with American Airlines. For more, see our{' '}
          <Link href="/programs/aa" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>American AAdvantage program page</Link>{' '}
          or browse all <Link href="/guides" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>guides</Link>.
        </p>
        <GuideNewsletterCTA />
      </div>
    </main>
  )
}
