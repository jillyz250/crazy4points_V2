import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Start Here',
  description:
    'New to points, or just want to use the ones you have? Start here — we sort travel into using points (plan a trip) and earning them (the right card setup), and point you to the right tool.',
  alternates: { canonical: 'https://www.crazy4points.com/start-here' },
}

interface Door {
  title: string
  copy: string
  href: string
  cta: string
  accent: string
  comingSoon?: boolean
}

const USE_DOORS: Door[] = [
  { title: 'Make this trip premium', copy: 'Lie-flat seats, lounges, nicer hotels.', href: '/tools/alliances', cta: 'Explore alliances', accent: '#6B2D8F' },
  { title: 'Get there for the least', copy: 'Cheapest way from A to B.', href: '/alerts', cta: 'See current deals', accent: '#2563EB' },
  { title: 'Just want to dream?', copy: 'Spin and see where your points could land you.', href: '/decision-engine', cta: 'Spin it', accent: '#D4AF37' },
]

const EARN_DOORS: Door[] = [
  { title: 'Use the cards you have', copy: "You're probably sitting on credits and perks you already pay for. See what you've left on the table.", href: '/wallet', cta: 'Coming soon', accent: '#059669', comingSoon: true },
  { title: 'Have a gap, or shopping?', copy: 'Compare honestly by what actually fits how you travel.', href: '/cards', cta: 'Find your card', accent: '#059669' },
]

function DoorCard({ d }: { d: Door }) {
  const inner = (
    <>
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 origin-left scale-x-[0.18] opacity-80 transition-transform duration-200 group-hover:scale-x-100" style={{ background: d.accent }} />
      <h3 className="font-display text-lg font-semibold text-[var(--color-primary)]">{d.title}</h3>
      <p className="font-body text-sm text-[var(--color-text-secondary)]">{d.copy}</p>
      <span className="mt-auto inline-flex items-center gap-1 pt-2 font-ui text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: d.comingSoon ? 'var(--color-text-secondary)' : d.accent }}>
        {d.cta}
        {!d.comingSoon && <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>}
      </span>
    </>
  )
  const base = 'group relative flex flex-col gap-2 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)] transition-all duration-200'
  return d.comingSoon ? (
    <div className={`${base} cursor-default opacity-70`} aria-label={`${d.title} (coming soon)`}>
      <span className="absolute right-3 top-3 rounded-full bg-[var(--color-background-soft)] px-2 py-0.5 font-ui text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Coming Soon</span>
      {inner}
    </div>
  ) : (
    <Link href={d.href} className={`${base} hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40`}>{inner}</Link>
  )
}

export default function StartHerePage() {
  return (
    <div className="rg-container px-6 py-12 md:px-8 md:py-16">
      {/* Hero — travel first, minimal */}
      <header className="mx-auto max-w-2xl text-center">
        <p className="font-ui text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-primary)]">Start here</p>
        <h1 className="mt-3">The trips are real. The points are probably already yours.</h1>
        <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">
          Free and nearly-free travel isn&rsquo;t a trick &mdash; it&rsquo;s knowing where to look. That&rsquo;s the whole site.
        </p>
        <a href="#basics" className="mt-4 inline-block font-ui text-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline">
          New to all this? Start with the basics &rarr;
        </a>
      </header>

      {/* USE — lead with the dream */}
      <section className="mt-14 md:mt-16">
        <h2 className="font-display text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">How do I use points to travel?</h2>
        <p className="mt-2 font-body text-[var(--color-text-secondary)]">Turn the points you already have into a better trip.</p>
        <p className="mt-1 font-ui text-sm text-[var(--color-text-secondary)]">
          Start with the trip you want &mdash; these help you spot premium seats, cheap deals, and inspiration. (The deep trip-planners are coming soon.)
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {USE_DOORS.map((d) => <DoorCard key={d.title} d={d} />)}
        </div>
      </section>

      {/* EARN — wallet first, then shopping; never opens on "apply" */}
      <section className="mt-14 md:mt-16">
        <h2 className="font-display text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">How do I earn points for travel?</h2>
        <p className="mt-2 font-body text-[var(--color-text-secondary)]">Make the most of the cards you already carry &mdash; and fill any gaps responsibly.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {EARN_DOORS.map((d) => <DoorCard key={d.title} d={d} />)}
        </div>
        <p className="mt-5 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-4 font-body text-sm text-[var(--color-text-secondary)]">
          <span className="font-semibold text-[var(--color-text-primary)]">A quick grown-up note.</span>{' '}
          Travel cards only pay off if you clear your balance every month &mdash; interest costs more than any points are worth. If a balance might linger, a simple cash-back card (or no new card at all) is the smarter call.
        </p>
      </section>

      {/* Roadmap — collapsed, clearly separated */}
      <details className="mt-12 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-5 py-4">
        <summary className="cursor-pointer font-ui text-sm font-semibold text-[var(--color-primary)]">More tools coming soon</summary>
        <p className="mt-3 font-body text-sm text-[var(--color-text-secondary)]">
          Where Can My Points Take Me &middot; Best Way to Book It &middot; Will My Free Night Cert Fit &middot; Points Hub &mdash; in development.
        </p>
      </details>

      {/* Beginner primer — the soft landing from the hero link */}
      <section id="basics" className="mt-16 max-w-2xl scroll-mt-24">
        <h2 className="font-display text-2xl font-semibold text-[var(--color-primary)]">New to points? Start here.</h2>
        <p className="mt-3 font-body text-[var(--color-text-secondary)]">
          No spreadsheet, no finance degree. Paying cash for travel is the most expensive way to do it &mdash; the same flights and hotels are often a fraction of the price in points. Knowing where to look is the whole game, and it&rsquo;s the part we handle.
        </p>
        <ul className="mt-4 space-y-2 font-body text-[var(--color-text-primary)]">
          <li>&bull; You earn points from credit-card spend &mdash; and big chunks from sign-up bonuses.</li>
          <li>&bull; Not all points are equal &mdash; <strong>transferable</strong> points (Amex, Chase, Citi&hellip;) are the most flexible.</li>
          <li>&bull; You redeem points for flights and hotels, usually worth far more than cash back.</li>
          <li>&bull; You don&rsquo;t need a wallet full of cards &mdash; the right one or two is plenty.</li>
          <li>&bull; The catch is timing and knowing the sweet spots. That&rsquo;s what we track.</li>
        </ul>
        <p className="mt-4 font-body text-sm text-[var(--color-text-secondary)]">
          <strong className="text-[var(--color-text-primary)]">The only four words you need today:</strong>{' '}
          Transferable points &middot; Sign-up bonus &middot; Award (a points booking) &middot; Sweet spot (an outsized deal).
        </p>
      </section>
    </div>
  )
}
