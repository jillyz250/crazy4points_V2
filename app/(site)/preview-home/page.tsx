import Link from 'next/link'
import type { Metadata } from 'next'

// PREVIEW ONLY — the elevated homepage v2 (Jill, 2026-09-04). Standalone route so
// the live homepage (app/(site)/page.tsx) is untouched. Uses the real brand kit
// (mascot cutout + wordmark) with LIVE text over a scene, per Jill's calls:
//  - nav logo = wordmark only (mascot is in the hero right below)
//  - headline/subtext/button = real HTML text, not baked into an image
//  - tools = the bottom card click-ins
//  - social icons kept in the top bar
// Below the hero + card row, all 9 existing homepage sections are PRESERVED
// (represented here by a labeled placeholder so nothing is lost when we integrate).
export const metadata: Metadata = { title: 'Homepage v2 (preview)', robots: { index: false } }

const PILLS = ['Bigger Trips', 'Better Stays', 'More Points', 'Happier You']

const NAV = ['Alerts', 'Tools', 'Resources', 'Deals', 'Guides']

const SOCIALS = [
  { label: 'Instagram', icon: 'IG' },
  { label: 'YouTube', icon: 'YT' },
  { label: 'TikTok', icon: 'TT' },
  { label: 'Facebook', icon: 'FB' },
  { label: 'Pinterest', icon: 'PIN' },
]

// The "tools" click-ins (this is HomeToolBlocks reimagined as cards).
const CARDS: { title: string; sub: string; href: string; emoji: string }[] = [
  { title: 'Flight Deals', sub: 'Fly farther for less', href: '/alerts', emoji: '✈️' },
  { title: 'Hotel Deals', sub: 'Unlock dream stays', href: '/alerts', emoji: '🏨' },
  { title: 'Credit Card Bonuses', sub: 'Maximize your rewards', href: '/cards', emoji: '💳' },
  { title: 'Travel Guides', sub: 'Expert tips & how-tos', href: '/guides', emoji: '📖' },
  { title: 'Tools & Calculators', sub: 'Plan smarter', href: '/tools', emoji: '🧮' },
  { title: 'Community', sub: 'Travel farther together', href: '/', emoji: '💜' },
]

export default function PreviewHome() {
  return (
    <div style={{ background: 'var(--color-background)' }}>
      {/* ===== HERO — your banner, with the header floating OVER the image ===== */}
      <section className="relative">
        {/* the hero banner image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-preview/hero-poolside.png" alt="" className="block w-full" />
        {/* real headline text for SEO + screen readers (the baked one is decorative) */}
        <h1 className="sr-only">Because paying full price is so last season — smart travel with points. Get the latest travel deals, credit card bonuses and insider strategies to fly farther, stay better and do more, for less.</h1>

        {/* Floating header overlay (utility bar + nav), transparent over the image */}
        <div className="absolute inset-x-0 top-0 z-20">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-36" style={{ background: 'linear-gradient(to bottom, rgba(40,15,60,0.45), rgba(40,15,60,0))' }} />

          {/* utility bar */}
          <div className="relative rg-container flex items-center justify-between gap-4 py-2 text-[12px] text-white" style={{ fontFamily: 'var(--font-ui)' }}>
            <Link href="/newsletter" className="inline-flex items-center gap-1.5 font-semibold drop-shadow hover:opacity-90">
              <span aria-hidden>{'✉️'}</span> Get the Best Deals (Seriously) <span aria-hidden>{'→'}</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                {SOCIALS.map((s) => (
                  <span key={s.label} title={s.label} className="grid h-6 w-6 place-items-center rounded-full text-[9px] font-bold"
                    style={{ background: 'rgba(255,255,255,0.22)' }}>{s.icon}</span>
                ))}
              </div>
              <span className="hidden opacity-50 md:inline">|</span>
              <nav className="hidden items-center gap-3 drop-shadow md:flex">
                <Link href="/about" className="hover:opacity-90">About</Link>
                <Link href="/contact" className="hover:opacity-90">Contact</Link>
                <Link href="/login" className="inline-flex items-center gap-1 hover:opacity-90"><span aria-hidden>{'👤'}</span> Sign In</Link>
              </nav>
            </div>
          </div>

          {/* nav row — wordmark-only logo + dropdowns over the image */}
          <div className="relative rg-container flex items-center justify-between gap-4 py-2">
            <Link href="/" aria-label="Crazy4Points home" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand-kit/logos/crazy4points-wordmark-hero.png" alt="Crazy4Points" className="h-8 w-auto drop-shadow-lg sm:h-10" />
            </Link>
            <nav className="hidden items-center gap-6 lg:flex" style={{ fontFamily: 'var(--font-ui)' }}>
              {NAV.map((n) => (
                <Link key={n} href="/" className="text-sm font-bold text-white drop-shadow hover:text-[var(--color-accent)]">
                  {n} <span className="text-[10px] opacity-70">{'▾'}</span>
                </Link>
              ))}
            </nav>
            <div className="hidden justify-end lg:flex lg:w-64">
              <label className="flex w-full items-center gap-2 rounded-full border px-4 py-2 backdrop-blur"
                style={{ borderColor: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.18)' }}>
                <span aria-hidden className="text-white">{'🔍'}</span>
                <input placeholder="Search deals, cards..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/75" style={{ fontSize: '16px' }} />
              </label>
            </div>
          </div>
        </div>

        {/* real clickable button over the baked "JOIN THE INSIDER LIST" */}
        <Link href="/newsletter" aria-label="Join the Insider List"
          className="absolute z-20" style={{ left: '52.5%', top: '54.5%', width: '28%', height: '10%' }} />
      </section>

      {/* ===== Tools card row (the click-ins) — sits just under the hero ===== */}
      <section style={{ background: 'var(--color-background-soft)' }}>
        <div className="rg-container py-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CARDS.map((c) => (
              <Link key={c.title} href={c.href}
                className="group flex flex-col justify-between rounded-[var(--radius-ui)] border p-3 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
                style={{ background: '#fff', borderColor: 'var(--color-border-soft)' }}>
                <div className="mb-6 text-2xl" aria-hidden>{c.emoji}</div>
                <div>
                  <div className="text-sm font-bold text-[var(--color-primary)]" style={{ fontFamily: 'var(--font-ui)' }}>{c.title}</div>
                  <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{c.sub}</div>
                </div>
                <div className="mt-2 text-sm font-bold text-[var(--color-accent)] opacity-0 transition group-hover:opacity-100" aria-hidden>{'→'}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Everything below is PRESERVED from the current homepage ===== */}
      <section className="rg-container rg-major-section">
        <div className="rounded-[var(--radius-card)] border border-dashed p-8 text-center" style={{ borderColor: 'var(--color-border-soft)', marginTop: '2rem' }}>
          <p className="font-[var(--font-display)] text-xl font-bold text-[var(--color-primary)]">{'↓'} Existing sections continue here (nothing lost)</p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]" style={{ fontFamily: 'var(--font-body)' }}>
            Latest Alerts &middot; Experiences &middot; Sweepstakes &middot; Featured Guides &middot; Newsletter signup &middot; Cap One callout
            &mdash; all carried over and restyled to match when we integrate.
          </p>
        </div>
      </section>
    </div>
  )
}
