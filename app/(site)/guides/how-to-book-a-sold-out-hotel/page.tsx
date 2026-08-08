import type { Metadata } from 'next'
import Link from 'next/link'
import { GuideDateline } from '@/components/guides/GuideDateline'
import { GuideJsonLd } from '@/components/guides/GuideJsonLd'
import GuideNewsletterCTA from '@/components/guides/GuideNewsletterCTA'

export const metadata: Metadata = {
  title: 'How to Book a Sold-Out Hotel (the Elite Perk Nobody Talks About)',
  description:
    'Some hotel elite tiers can book a standard room even when a hotel shows "sold out." Here is which programs offer this guaranteed-availability benefit, the exact rules, and the credit cards that hand you the status. Verified 2026.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/how-to-book-a-sold-out-hotel' },
  openGraph: {
    title: 'How to Book a Sold-Out Hotel (the Elite Perk Nobody Talks About)',
    description:
      'Guaranteed room availability lets certain elites book a standard room at a sold-out hotel. Which programs, the fine print, and the cheapest cards that unlock it.',
    url: 'https://www.crazy4points.com/guides/how-to-book-a-sold-out-hotel',
    type: 'article',
    siteName: 'crazy4points',
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 86400

type Prog = { program: string; tiers: string; window: string; print: string }
const PROGRAMS: Prog[] = [
  { program: 'World of Hyatt', tiers: 'Explorist / Globalist', window: '72h / 48h', print: 'Standard room; excludes resorts, casino hotels, and Hyatt Vacation Club properties; suspended during extraordinary demand and blackout dates; award stays not eligible' },
  { program: 'IHG One Rewards', tiers: 'Platinum / Diamond', window: '72h', print: 'One guest room; blackout dates apply; award nights not eligible' },
  { program: 'Marriott Bonvoy', tiers: 'Platinum / Titanium / Ambassador', window: '48h (by 3 p.m.)', print: 'Paid reservations; book by 3 p.m. at least 48 hours before arrival' },
  { program: 'Hilton Honors', tiers: 'Diamond (and Diamond Reserve)', window: '48h (before midnight local)', print: 'Paid stays only, not points or free-night certificates; may not apply during extraordinary demand or once the hotel is overbooked by 10% or more' },
]

type Card = { card: string; status: string; cost: string }
const CARDS: Card[] = [
  { card: 'IHG One Rewards Premier (Chase)', status: 'IHG Platinum Elite, automatically (Diamond after $40K annual spend)', cost: '~$99 — cheapest way in' },
  { card: 'Chase Sapphire Reserve', status: 'IHG Platinum standard; +Hyatt Explorist & IHG Diamond at $75K annual spend', cost: '$795' },
  { card: 'Hilton Honors Aspire (Amex)', status: 'Hilton Diamond, automatically', cost: 'premium Amex' },
  { card: 'Marriott Bonvoy Brilliant (Amex)', status: 'Marriott Platinum, automatically', cost: 'premium Amex' },
]

const QUALIFY: string[] = [
  'World of Hyatt Explorist: 30 elite nights in a year, or the Sapphire Reserve $75K shortcut. (Globalist, the better 48-hour version, takes 60 nights.)',
  'IHG Platinum Elite: 40 nights, or hold an IHG One Rewards Premier card (~$99, automatic) or a Sapphire Reserve (standard benefit). Diamond takes 70 nights, the IHG Premier $40K spend, or the Sapphire Reserve $75K unlock.',
  'Marriott Platinum: 50 nights, or the Marriott Bonvoy Brilliant card (automatic).',
  'Hilton Diamond: 60 nights or 30 stays, or the Hilton Aspire card (automatic).',
]

const FAQ: { q: string; a: string }[] = [
  { q: 'Is the room free?', a: 'No. Guaranteed availability gets you the ability to book a standard room at the going rate, even when the hotel is sold out. It is access, not a discount, and it does not apply to award nights.' },
  { q: 'Will it work for the Super Bowl, F1, or a total eclipse?', a: 'Maybe not. Most programs include exceptions for extraordinary demand or other defined blackout dates, and Hilton’s version may not apply once a hotel is overbooked by 10 percent or more. It is powerful for the everyday sold-out weekend, less reliable for the biggest events on earth.' },
  { q: 'Does my Amex Platinum give me this?', a: 'Not for this benefit. Amex Platinum grants Hilton Gold and Marriott Gold, which sit below the Diamond and Platinum tiers that include guaranteed availability.' },
  { q: 'Which is the easiest to get?', a: 'Hyatt is generally the easiest. Explorist is a mid-tier status, and the Chase Sapphire Reserve can hand it to you at $75K annual spend. Everywhere else you need top-tier status.' },
  { q: 'Which hotel program has the best guaranteed room availability?', a: 'It depends what "best" means. Hyatt wins on ease (the only program where mid-tier Explorist qualifies). IHG wins on cost (the ~$99 IHG Premier card grants qualifying Platinum status). Marriott and Hilton work well but require top-tier status, so they are hardest to reach without heavy travel or a premium card. All four honor the same core promise; Hyatt and IHG just make the status easier to hold.' },
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

export default function SoldOutHotelGuide() {
  return (
    <main className="rg-major-section">
      <div className="rg-container rg-guide" style={{ maxWidth: '64rem' }}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
          Guide · Last verified July 12, 2026
        </span>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          How to Book a Sold-Out Hotel
        </h1>
        <GuideDateline slug="how-to-book-a-sold-out-hotel" />
        <GuideJsonLd slug="how-to-book-a-sold-out-hotel" />
        <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">
          {'Picture parents weekend near a big university, or New Year’s Eve near Times Square. Every hotel for miles shows sold out, and the few rooms left on resale sites are triple the normal price. Now picture booking a standard room at that same “sold out” hotel, one that simply would not appear as available to anyone else. That is not a glitch. It is a real elite benefit called guaranteed room availability, and almost nobody talks about it.'}
        </p>
        <p className={p}>
          {'Here is the part that makes it worth your attention: you do not have to be a top-tier road warrior to have it. One mid-level status tier unlocks it, and a couple of popular credit cards hand you the status without a single paid night. This guide covers exactly which programs offer it, the fine print that makes or breaks a booking, and the fastest ways to get in.'}
        </p>

        <Callout>
          <strong>Why hotels do this:</strong>{' '}
          {'it is not charity. Hotels reserve this perk for their most valuable guests because elite members drive repeat business all year. Faced with a sellout, a hotel would rather protect a room for a member who stays dozens of nights annually than turn them away, so it holds back a sliver of standard inventory for exactly this. You pay the going rate for it, but the door stays open when it is shut for everyone else.'}
        </Callout>

        <h2 className={h2}>What it actually is</h2>
        <p className={p}>
          {'Guaranteed room availability means that if you book far enough ahead, the hotel must make a standard room available to you even when it is otherwise sold out. It is a published elite benefit, not a favor you beg for at the front desk. Three things to be clear-eyed about:'}
        </p>
        <ul className="mt-3 flex flex-col gap-2 font-body text-[var(--color-text-primary)]" style={{ listStyle: 'disc', paddingLeft: '1.25rem' }}>
          <li><strong>You pay the going rate.</strong> This gets you a room, not a free or discounted one. On a sold-out event weekend that rate can be high, but it is usually far below what resale sites charge, and sometimes it is just the normal price.</li>
          <li><strong>Standard room only.</strong> The guarantee covers a standard room. Suites and specialty rooms are not included, though elite upgrades can still apply once you are in.</li>
          <li><strong>You must book within the window, and it is not bulletproof.</strong> Every program sets an advance-booking deadline and carves out truly extraordinary demand.</li>
        </ul>

        <h2 className={h2}>Which programs offer it (and the exact rules)</h2>
        <p className={p}>Every figure below is pulled from each program&rsquo;s own current terms.</p>
        <Table head={['Program', 'Tier(s)', 'Book by', 'The fine print']} rows={PROGRAMS.map((x) => [x.program, x.tiers, x.window, x.print])} />
        <Callout>
          <strong>The standout:</strong>{' '}
          {'Hyatt is the only program here where a mid-tier status (Explorist) unlocks the benefit. Every other program requires a top or near-top tier. That matters because Explorist is both the easiest to earn by nights and the easiest to shortcut with a credit card.'}
        </Callout>

        <h2 className={h2}>The credit-card shortcut</h2>
        <p className={p}>
          {'You do not necessarily need to earn status the hard way. A few cards hand you a qualifying tier outright. Verified from each issuer:'}
        </p>
        <Table head={['Card', 'Status it gives you', 'Cost']} rows={CARDS.map((c) => [c.card, c.status, c.cost])} />
        <p className={p}>
          {'The IHG Premier card is arguably the cheapest path into guaranteed room availability anywhere: a roughly $99 card that hands you IHG Platinum Elite. And if you already carry a Sapphire Reserve, you very likely already have this benefit at IHG and did not know it, with Hyatt Explorist stacked on top once you cross $75K in spend.'}
        </p>
        <Callout tone="warn">
          <strong>The &ldquo;close but not quite&rdquo; trap:</strong>{' '}
          {'The Platinum Card from American Express gives you Hilton Gold and Marriott Gold. Those are genuinely useful, but Gold is a notch below the tier that includes guaranteed availability. For this specific perk you need Hilton Diamond or Marriott Platinum, not Gold.'}
        </Callout>

        <h2 className={h2}>How to actually use it</h2>
        <ol className="mt-3 flex flex-col gap-2 font-body text-[var(--color-text-primary)]" style={{ listStyle: 'decimal', paddingLeft: '1.25rem' }}>
          <li><strong>Book direct, within the window.</strong> Use the program&rsquo;s own site, app, or reservation line, and beat the advance deadline for your tier: 72 hours out for Hyatt Explorist and IHG, 48 hours for Hyatt Globalist, Marriott, and Hilton.</li>
          <li><strong>Have your membership number on the reservation</strong> and status linked, especially if your status comes from a credit card (which can take days or weeks to activate).</li>
          <li><strong>If the benefit does not appear to work online, call the loyalty line.</strong> Agents may be able to apply the guaranteed-availability benefit, or tell you whether the property is excluded. Reference the benefit by name.</li>
          <li><strong>Expect to pay the prevailing rate,</strong> and book as soon as you know you will need the room, so you are comfortably inside the window before any exclusions can kick in.</li>
        </ol>

        <h2 className={h2}>How to qualify for the status</h2>
        <ul className="mt-3 flex flex-col gap-2 font-body text-[var(--color-text-primary)]" style={{ listStyle: 'disc', paddingLeft: '1.25rem' }}>
          {QUALIFY.map((q) => <li key={q}>{q}</li>)}
        </ul>

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
          Every figure traces to the program&rsquo;s or issuer&rsquo;s own current terms. Programs change; confirm before you rely on a rate.
        </p>
        <ul className="mt-3 flex flex-col gap-1.5 font-body text-sm" style={{ listStyle: 'disc', paddingLeft: '1.25rem' }}>
          {[
            ['World of Hyatt tiers & benefits', 'https://world.hyatt.com/content/gp/en/tiers-and-benefits.html'],
            ['IHG One Rewards tier benefits', 'https://www.ihg.com/onerewards/content/us/en/tier-benefits'],
            ['Marriott Elite Benefit Guarantees', 'https://www.marriott.com/loyalty/member-benefits/guarantee.mi'],
            ['Hilton Honors terms', 'https://www.hilton.com/en/hilton-honors/terms/'],
            ['Chase Sapphire Reserve', 'https://www.chase.com/sapphire-cards/personal/reserve'],
            ['Chase IHG Premier — Platinum status', 'https://www.chase.com/personal/credit-cards/ihg/premier/platinum-status'],
          ].map(([label, href]) => (
            <li key={href}><a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>{label} ↗</a></li>
          ))}
        </ul>

        <p className="mt-10 font-body text-sm text-[var(--color-text-secondary)]">
          Not affiliated with any hotel or card issuer. Browse all <Link href="/guides" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>guides</Link> or our{' '}
          <Link href="/programs?type=hotel" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>hotel program pages</Link>.
        </p>
        <GuideNewsletterCTA />
      </div>
    </main>
  )
}
