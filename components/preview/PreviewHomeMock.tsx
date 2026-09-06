import Link from 'next/link'

// Full homepage mockup, two looks (Jill 2026-09-06): 'editorial' (elegant serif +
// real destination photos, cream/airy — the B direction) vs 'immersive' (deep-plum
// gradients, punchy gold). Shared header (Option C) + hero; the body styling swaps
// by variant. Static teasers so it reads like a real, complete homepage.

const NAV = ['Alerts', 'Tools', 'Resources', 'Deals', 'Guides']
const FB = 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'
const IG = 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z'

const CARDS = [
  { t: 'Experiences', s: 'Book with points', img: '/hero-preview/cards/card-photo-guides.jpg' },
  { t: 'Flight Deals', s: 'Fly farther for less', img: '/hero-preview/cards/card-photo-flights.jpg' },
  { t: 'Hotel Deals', s: 'Unlock dream stays', img: '/hero-preview/cards/card-photo-hotels.jpg' },
  { t: 'Card Bonuses', s: 'Maximize your rewards', img: '/hero-preview/cards/card-photo-cards.jpg' },
]
const ALERTS = [
  { tag: 'Sign-Up Bonus', title: 'Chase Ink Cash & Unlimited Hit 100K', sub: 'Biggest we’ve seen on these no-annual-fee cards.' },
  { tag: 'Sign-Up Bonus', title: 'Citi AAdvantage Executive Jumps to 125,000 Miles', sub: 'The biggest we’ve tracked on this card.' },
  { tag: 'Limited Offer', title: 'Bask Bank: 20,000 AAdvantage Miles', sub: 'A rare non-card way to earn AA miles.' },
]

export default function PreviewHomeMock({ variant }: { variant: 'editorial' | 'immersive' }) {
  const dark = variant === 'immersive'
  const serif = 'var(--font-display)'
  return (
    <div style={{ background: dark ? '#1c0a2b' : 'var(--color-background)' }}>
      {/* ===== Header (Option C) ===== */}
      <header className="fixed inset-x-0 top-0 z-30" style={{ fontFamily: 'var(--font-ui)' }}>
        <div className="flex items-center gap-4 px-5 py-1.5 sm:px-8" style={{ background: 'rgba(30,10,45,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-2.5">
            {[IG, FB].map((p, i) => (
              <a key={i} href="#" className="text-white/85 hover:text-[var(--color-accent)]"><svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d={p} /></svg></a>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3 text-[13px] font-semibold text-white/90">
            <span>Sign In</span><span className="opacity-40">|</span><span className="text-[var(--color-accent)]">Join the Insider List</span>
          </div>
        </div>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-2 sm:px-8" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(107,45,143,0.12)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero-preview/logo-full.png" alt="Crazy4Points" className="h-10 w-auto justify-self-start sm:h-12" />
          <nav className="hidden items-center gap-7 justify-self-center md:flex">
            {NAV.map((n) => <Link key={n} href="/" className="text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-accent)]">{n}</Link>)}
          </nav>
          <label className="hidden items-center gap-2 justify-self-end rounded-full px-3.5 py-2 lg:flex" style={{ border: '1px solid rgba(107,45,143,0.25)', background: 'rgba(255,255,255,0.7)' }}>
            <span className="text-xs text-[var(--color-primary)]">🔍</span>
            <input placeholder="Search deals, cards…" className="w-44 bg-transparent text-sm outline-none" style={{ fontSize: '16px' }} />
          </label>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-preview/hero-poolside.png" alt="" className="block w-full" />
        <Link href="/newsletter" aria-label="Join the Insider List" className="absolute z-20" style={{ left: '52.5%', top: '54.5%', width: '28%', height: '10%' }} />
      </section>

      {/* ===== Quick tools — photo cards (editorial) / gradient cards (immersive) ===== */}
      <section style={{ background: dark ? '#1c0a2b' : 'var(--color-background-soft)' }}>
        <div className="rg-container py-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {CARDS.map((c) => (
              <Link key={c.t} href="/" className="group relative flex h-40 flex-col justify-end overflow-hidden rounded-2xl p-4 text-white shadow-[0_14px_30px_-18px_rgba(107,45,143,0.6)]">
                {variant === 'editorial' ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.img} alt="" className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(30,10,45,0.82), rgba(30,10,45,0.15) 60%, rgba(30,10,45,0.05))' }} />
                  </>
                ) : (
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(150deg,#5a2378,#3a1550)' }} />
                )}
                <div className="relative">
                  <div className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em]" style={{ color: 'var(--color-accent)' }}>{c.s}</div>
                  <div style={{ fontFamily: serif }} className="mt-0.5 text-xl leading-tight">{c.t}</div>
                  <div className="mt-1.5 h-[3px] w-9 rounded" style={{ background: 'var(--color-accent)' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Latest alerts ===== */}
      <section className="rg-container rg-major-section">
        <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-ui)' }}>Fresh today</p>
        <h2 style={{ fontFamily: serif, color: dark ? '#fff' : 'var(--color-primary)' }} className="mb-6 text-2xl font-bold sm:text-3xl">The points moves worth caring about</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {ALERTS.map((a) => (
            <div key={a.title} className="flex flex-col rounded-2xl p-5"
              style={dark
                ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }
                : { background: '#fff', border: '1px solid var(--color-border-soft)', boxShadow: 'var(--shadow-soft)' }}>
              <span className="mb-3 inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-bold uppercase" style={{ background: dark ? 'rgba(212,175,55,0.18)' : 'var(--color-background-soft)', color: dark ? 'var(--color-accent)' : 'var(--color-primary)', border: dark ? '1px solid rgba(212,175,55,0.3)' : '1px solid var(--color-border-soft)' }}>{a.tag}</span>
              <h3 style={{ fontFamily: serif, color: dark ? '#fff' : 'var(--color-text-primary)' }} className="text-lg font-bold leading-snug">{a.title}</h3>
              <p className="mt-2 text-sm" style={{ color: dark ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)' }}>{a.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Newsletter band ===== */}
      <section className="rg-container rg-major-section">
        <div className="flex flex-col items-center gap-4 rounded-2xl px-6 py-12 text-center" style={{ background: 'linear-gradient(135deg, #2a0f3d, #6B2D8F)' }}>
          <h2 style={{ fontFamily: serif }} className="text-2xl font-bold text-white sm:text-3xl">Champagne travel. Diet Coke prices.</h2>
          <p className="max-w-xl text-sm text-white/85">The deals actually worth your time, in your inbox.</p>
          <Link href="/newsletter" className="rounded-full px-6 py-3 text-sm font-bold uppercase tracking-[0.06em] text-[#1a1a1a]" style={{ background: 'linear-gradient(180deg,#e9c757,#c99a25)', fontFamily: 'var(--font-ui)' }}>Join the Insider List →</Link>
        </div>
      </section>
    </div>
  )
}
