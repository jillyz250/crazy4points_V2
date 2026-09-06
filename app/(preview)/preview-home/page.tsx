import Link from 'next/link'
import type { Metadata } from 'next'

// PREVIEW ONLY — homepage v2 (Jill, 2026-09-05). Own route group so the live
// homepage is untouched and there's NO site header (the translucent nav below IS
// the nav). Jill's calls: dark glass nav, NO logo + NO Insider CTA in the nav
// (the hero's own button covers it), hero = the master banner.
export const metadata: Metadata = { title: 'Homepage v2 (preview)', robots: { index: false } }

const NAV = ['Alerts', 'Tools', 'Resources', 'Deals', 'Guides']

// Real social accounts we actually have (matches the footer). No fake YT/TT/PIN.
const FB_PATH = 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'
const IG_PATH = 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z'
const SOCIALS = [
  { label: 'Crazy4Points on Instagram', href: 'https://www.instagram.com/crazy4points/', path: IG_PATH },
  { label: 'Crazy4Points on Facebook', href: 'https://www.facebook.com/Crazy4Points', path: FB_PATH },
]

const CARDS: { title: string; sub: string; href: string; emoji: string }[] = [
  { title: 'Flight Deals', sub: 'Fly farther for less', href: '/alerts', emoji: '✈️' },
  { title: 'Hotel Deals', sub: 'Unlock dream stays', href: '/alerts', emoji: '🏨' },
  { title: 'Card Bonuses', sub: 'Maximize your rewards', href: '/cards', emoji: '💳' },
  { title: 'Travel Guides', sub: 'Expert tips & how-tos', href: '/guides', emoji: '📖' },
  { title: 'Tools', sub: 'Plan smarter', href: '/tools', emoji: '🧮' },
  { title: 'Experiences', sub: 'Book with points', href: '/experiences', emoji: '🎟️' },
]

// Static teasers (preview only) so the page reads like a real, polished homepage.
const ALERTS = [
  { tag: 'Sign-Up Bonus', title: 'Chase Ink Cash & Unlimited Hit 100K', sub: 'Biggest we’ve seen on these no-annual-fee cards.', href: '/alerts' },
  { tag: 'Sign-Up Bonus', title: 'Citi AAdvantage Executive Jumps to 125,000 Miles', sub: 'The biggest we’ve tracked on this card.', href: '/alerts' },
  { tag: 'Limited Offer', title: 'Bask Bank: 20,000 AAdvantage Miles', sub: 'A rare non-card way to earn AA miles (catch inside).', href: '/alerts' },
]
const EXPERIENCES = [
  { cat: 'ENTERTAINMENT', label: 'Michelin dinner + Cirque, Las Vegas', mode: 'BID WITH POINTS' },
  { cat: 'SPORTS', label: 'NFL in-stadium hospitality', mode: 'FROM 75,000 PTS' },
  { cat: 'MUSIC', label: 'Austin City Limits Festival', mode: 'BID WITH POINTS' },
]

export default function PreviewHome() {
  return (
    <div style={{ background: 'var(--color-background)' }}>
      {/* ===== HERO with the dark-glass nav floating over it ===== */}
      <section className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-preview/hero-poolside.png" alt="" className="block w-full" />
        <h1 className="sr-only">Because paying full price is so last season — smart travel with points. The latest deals, card bonuses, and insider strategies to fly farther and stay better for less.</h1>

        {/* Light frosted-glass nav — simple wordmark left, nav centered (Jill 2026-09-06) */}
        <div className="absolute inset-x-0 top-0 z-20">
          <div
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-3 sm:px-8"
            style={{
              background: 'rgba(255,255,255,0.55)',
              WebkitBackdropFilter: 'blur(14px)',
              backdropFilter: 'blur(14px)',
              borderBottom: '1px solid rgba(107,45,143,0.12)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            {/* left: simple text wordmark */}
            <Link href="/" className="justify-self-start font-[var(--font-display)] text-xl font-extrabold tracking-tight text-[var(--color-primary)] sm:text-2xl">
              Crazy<span className="text-[var(--color-accent)]">4</span>Points
            </Link>

            {/* center: nav links */}
            <nav className="hidden items-center gap-7 justify-self-center md:flex">
              {NAV.map((n) => (
                <Link key={n} href="/" className="text-sm font-bold text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)]">
                  {n}
                </Link>
              ))}
            </nav>

            {/* right: socials + search + sign in */}
            <div className="flex items-center justify-self-end gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                {SOCIALS.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                    className="text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)]">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d={s.path} /></svg>
                  </a>
                ))}
              </div>
              <label className="hidden items-center gap-2 rounded-full px-3 py-1.5 lg:flex"
                style={{ border: '1px solid rgba(107,45,143,0.25)', background: 'rgba(255,255,255,0.6)' }}>
                <span aria-hidden className="text-xs text-[var(--color-primary)]">{'🔍'}</span>
                <input placeholder="Search deals, cards…" className="w-36 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]" style={{ fontSize: '16px' }} />
              </label>
              <Link href="/login" className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)]">Sign In</Link>
            </div>
          </div>
        </div>

        {/* real clickable button over the baked "JOIN THE INSIDER LIST" */}
        <Link href="/newsletter" aria-label="Join the Insider List" className="absolute z-20"
          style={{ left: '52.5%', top: '54.5%', width: '28%', height: '10%' }} />
      </section>

      {/* ===== Tools card row ===== */}
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
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Latest Alerts ===== */}
      <section className="rg-container rg-major-section">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-ui)' }}>Fresh today</p>
            <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-primary)] sm:text-3xl">The points moves worth caring about</h2>
          </div>
          <Link href="/alerts" className="hidden text-sm font-bold text-[var(--color-primary)] hover:underline sm:inline">All alerts →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {ALERTS.map((a) => (
            <Link key={a.title} href={a.href} className="flex flex-col rounded-[var(--radius-card)] border bg-white p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"
              style={{ borderColor: 'var(--color-border-soft)' }}>
              <span className="mb-3 inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
                style={{ background: 'var(--color-background-soft)', color: 'var(--color-primary)', border: '1px solid var(--color-border-soft)' }}>{a.tag}</span>
              <h3 className="font-[var(--font-display)] text-lg font-bold leading-snug text-[var(--color-text-primary)]">{a.title}</h3>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{a.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== Real experiences strip ===== */}
      <section style={{ background: 'var(--color-background-soft)' }}>
        <div className="rg-container rg-major-section">
          <h2 className="mb-6 font-[var(--font-display)] text-2xl font-bold text-[var(--color-primary)] sm:text-3xl">Real experiences you can book with points</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {EXPERIENCES.map((e) => (
              <div key={e.label} className="relative flex h-44 flex-col justify-between overflow-hidden rounded-[var(--radius-card)] p-5 text-white"
                style={{ background: 'linear-gradient(135deg, #4a1d63, #6B2D8F)' }}>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-90">{e.cat}</span>
                <div>
                  <div className="font-[var(--font-display)] text-lg font-bold leading-snug">{e.label}</div>
                  <div className="mt-1 text-xs font-bold text-[var(--color-accent)]">{e.mode}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Newsletter band ===== */}
      <section className="rg-container rg-major-section">
        <div className="flex flex-col items-center gap-4 rounded-[var(--radius-card)] px-6 py-12 text-center"
          style={{ background: 'linear-gradient(135deg, #2a0f3d, #6B2D8F)' }}>
          <h2 className="font-[var(--font-display)] text-2xl font-bold text-white sm:text-3xl">Champagne travel. Diet Coke prices.</h2>
          <p className="max-w-xl text-sm text-white/85">The deals actually worth your time, in your inbox. No spam, just smarter travel.</p>
          <Link href="/newsletter" className="rounded-[var(--radius-ui)] px-6 py-3 text-sm font-bold uppercase tracking-[0.06em] text-[#1a1a1a]"
            style={{ background: 'linear-gradient(180deg,#e9c757,#c99a25)', fontFamily: 'var(--font-ui)' }}>Join the Insider List →</Link>
        </div>
      </section>
    </div>
  )
}
