import Link from 'next/link'
import type { Metadata } from 'next'
import NewsletterSignup from '@/components/home/NewsletterSignup'
import { GUIDES } from '@/lib/guides'

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
    <div className="rg-container px-6 pb-14 pt-8 md:px-8 md:pb-16 md:pt-10">
      {/* Intro: newsletter (primary action) up top, then Find Your Why (the
          "or"), one cohesive centered block with a hairline divider between. */}
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="flex items-center justify-center gap-3">
          <span aria-hidden className="h-px w-10" style={{ background: 'var(--color-accent)' }} />
          <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">Start Here</span>
          <span aria-hidden className="h-px w-10" style={{ background: 'var(--color-accent)' }} />
        </div>
        <h1 className="mt-5 font-display text-[1.75rem] font-semibold leading-tight text-[var(--color-primary)] md:text-[2.125rem]">
          Get the good stuff in your inbox
        </h1>
        <p className="mx-auto mt-3 max-w-md font-body text-[var(--color-text-secondary)]">
          The points-and-miles moves actually worth caring about, minus the noise. Unsubscribe anytime.
        </p>
        <div className="mt-6 w-full max-w-md">
          <NewsletterSignup />
        </div>

        {/* Find Your Why — the "or", set off by a hairline divider. */}
        <div className="mx-auto mt-9 max-w-md border-t border-[var(--color-border-soft)] pt-8">
          <h2 className="font-display text-xl font-semibold text-[var(--color-primary)]">Or figure out your why first</h2>
          <p className="mx-auto mt-1 font-body text-sm text-[var(--color-text-secondary)]">
            What kind of points traveler are you? Take the 2-minute quiz and get the cards that actually fit.
          </p>
          <Link
            href="/guides/find-your-why"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)] bg-[var(--color-accent)] px-6 py-2.5 font-ui text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)] transition hover:bg-[var(--color-background)]"
          >
            Take the quiz <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </div>

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

      {/* Guides — the articles, driven by lib/guides.ts. */}
      <section className="mt-14 md:mt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">Guides worth reading</h2>
          <Link href="/guides" className="font-ui text-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline">Browse all guides &rarr;</Link>
        </div>
        <p className="mt-2 font-body text-[var(--color-text-secondary)]">Plain-English playbooks for getting more out of your points.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {GUIDES.filter((g) => g.featured).map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="group flex flex-col gap-1.5 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40"
            >
              <span className="font-display text-base font-semibold text-[var(--color-primary)]">{g.title}</span>
              <span className="font-body text-sm text-[var(--color-text-secondary)]">{g.description}</span>
              <span className="mt-1 font-ui text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)]">
                Read <span aria-hidden className="inline-block transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
              </span>
            </Link>
          ))}
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
