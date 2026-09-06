import Link from 'next/link'
import type { ExperienceGroup } from '@/lib/experiences/marquee'
import { categoryBucket } from '@/lib/experiences/categories'
import FullBleedBanner from '@/components/preview/FullBleedBanner'
import { PERSONAS } from '@/lib/startHere'

// Flight/Hotel Deals lane data (computed in the page).
export type FlightBonus = { card: string; dest: string; pct: number | null; end: string | null; slug: string | null }
export type FlightSweetSpot = { id: string; title: string; route: string | null; points: number | null; cabin: string | null }
export type PromoAlert = { title: string; summary: string | null; type: string | null; slug: string }

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
// Gold-pill "jump to" nav (Jill, 2026-09-06): a slim row of gold pills right
// under the hero that anchor-scroll to each homepage section.
// "Start here" is a real destination (the tools hub + "what kind of points
// traveler are you?" guide), so it links to a page; the rest jump to sections.
// The "Your Toolkit" band — our actual tools as rich image tiles (baked-text
// banners). image=null renders an accent placeholder until the art is made.
const TOOLS: { label: string; href: string; desc: string; image: string | null; accent: string; caption?: string }[] = [
  { label: 'Decision Engine', href: '/decision-engine', desc: "Tell us your trip — we'll find the smartest way to book it.", image: '/hero-preview/cards/tool-decision-engine.png', accent: '#6B2D8F' },
  { label: 'Credit Card Explorer', href: '/cards', desc: 'Find the card that earns the points you need.', image: '/hero-preview/cards/tool-cards.png', accent: '#9A7B1F' },
  // Alliance names in a text caption (nominative — can't use alliance logos); footer disclosure covers it.
  { label: 'Alliance Explorer', href: '/tools/alliances', desc: 'The three big airline alliances, side by side.', image: '/hero-preview/cards/tool-alliances.png', accent: '#17868A', caption: 'Star Alliance · Oneworld · SkyTeam' },
  // Caption = Charlie-approved nominative fair use (plain names, no logos/®); the
  // footer carries the required not-affiliated disclosure.
  { label: 'Program Explorer', href: '/programs', desc: 'Know your programs — airlines & hotels.', image: '/hero-preview/cards/tool-programs.png', accent: '#33518A', caption: 'Covering United, Marriott, Delta, Hyatt & more' },
]

const PILLS = [
  { label: 'Start here', href: '/start-here' },
  { label: 'Experiences', href: '/experiences' },
  { label: 'Flight Deals', href: '#flights' },
  { label: 'Hotel Deals', href: '#hotels' },
  { label: 'Card Explorer', href: '#cards' },
  { label: 'Guides', href: '#guides' },
]
const ALERTS = [
  { tag: 'Sign-Up Bonus', title: 'Chase Ink Cash & Unlimited Hit 100K', sub: 'Biggest we’ve seen on these no-annual-fee cards.' },
  { tag: 'Sign-Up Bonus', title: 'Citi AAdvantage Executive Jumps to 125,000 Miles', sub: 'The biggest we’ve tracked on this card.' },
  { tag: 'Limited Offer', title: 'Bask Bank: 20,000 AAdvantage Miles', sub: 'A rare non-card way to earn AA miles.' },
]

// One real experience listing, styled to match the luxe homepage (white card,
// hairline border, gold rule, serif title). Reuses the getHomeExperiences groups.
function ExpCard({ g, serif }: { g: ExperienceGroup; serif: string }) {
  const href = g.packages.find((p) => p.detail_url)?.detail_url ?? '/experiences'
  const ext = href.startsWith('http')
  const bucket = categoryBucket(g.category)
  const price =
    g.fromPoints != null
      ? `From ${g.fromPoints.toLocaleString('en-US')} pts`
      : g.isAuction
        ? g.fromBid != null
          ? `Bid ${g.fromBid.toLocaleString('en-US')} pts`
          : 'Bid with points'
        : 'Redeem or bid'
  const inner = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={g.image_url as string} alt={g.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        {bucket && (
          <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: bucket.color, fontFamily: 'var(--font-ui)' }}>{bucket.label}</span>
        )}
      </div>
      <div className="flex grow flex-col p-4">
        <h4 style={{ fontFamily: serif, color: 'var(--color-primary)' }} className="line-clamp-2 text-[1.05rem] leading-snug">{g.title}</h4>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-[2px] w-5 rounded" style={{ background: 'var(--color-accent)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)' }}>{price}</span>
        </div>
      </div>
    </>
  )
  const cls = 'group flex flex-col overflow-hidden rounded-2xl bg-white transition-transform duration-200 hover:-translate-y-1'
  const style = { border: '1px solid rgba(107,45,143,0.12)', boxShadow: '0 14px 34px -22px rgba(62,26,87,0.4)' }
  return ext ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style}>{inner}</a>
  ) : (
    <Link href={href} className={cls} style={style}>{inner}</Link>
  )
}

// Faint gold plane motif for the deal-card headers.
const PLANE = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 16.5V11.5L21 16z" /></svg>

const DEAL_CARD = 'group flex flex-col overflow-hidden rounded-2xl bg-white transition-transform duration-200 hover:-translate-y-1'
const DEAL_STYLE = { border: '1px solid rgba(107,45,143,0.12)', boxShadow: '0 14px 34px -22px rgba(62,26,87,0.4)' }

// Lane 1 — an active transfer bonus (the "act now" card): gold stat header.
function BonusCard({ b, serif }: { b: FlightBonus; serif: string }) {
  const href = b.slug ? `/alerts/${b.slug}` : '/alerts'
  const ends = b.end ? new Date(b.end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null
  return (
    <Link href={href} className={DEAL_CARD} style={DEAL_STYLE}>
      <div className="relative overflow-hidden p-5" style={{ background: 'linear-gradient(135deg,#f8e7a8 0%,#ebcc66 50%,#cfa63f 100%)' }}>
        <span className="pointer-events-none absolute -right-2 -top-2 h-16 w-16 rotate-12" style={{ color: '#8a6a1e', opacity: 0.28 }}>{PLANE}</span>
        <div className="flex items-baseline gap-1.5">
          <span style={{ fontFamily: serif, color: '#3E1A57' }} className="text-3xl font-extrabold leading-none">{b.pct != null ? `+${b.pct}%` : 'Bonus'}</span>
          {b.pct != null && <span className="font-ui text-xs font-bold uppercase tracking-[0.14em]" style={{ color: '#6b520f' }}>bonus</span>}
        </div>
        <h4 style={{ fontFamily: serif, color: '#3E1A57' }} className="mt-1.5 text-[1.05rem] font-bold leading-snug">{b.card} → {b.dest}</h4>
      </div>
      <div className="flex grow flex-col p-4">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Move your points over for {b.pct != null ? `${b.pct}% ` : ''}extra miles.</p>
        {ends && <p className="mt-2 font-ui text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-alert)' }}>Ends {ends}</p>}
        <span className="mt-3 inline-flex items-center gap-1 font-ui text-sm font-bold" style={{ color: 'var(--color-primary)' }}>See the deal <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span></span>
      </div>
    </Link>
  )
}

// A current promo (from an alert): gold header with the type tag, summary below.
function PromoCard({ p, serif }: { p: PromoAlert; serif: string }) {
  const tag = (p.type || 'deal').replace(/_/g, ' ')
  return (
    <Link href={`/alerts/${p.slug}`} className={DEAL_CARD} style={DEAL_STYLE}>
      <div className="relative overflow-hidden p-5" style={{ background: 'linear-gradient(135deg,#f8e7a8 0%,#ebcc66 50%,#cfa63f 100%)' }}>
        <span className="pointer-events-none absolute -right-2 -top-2 h-16 w-16 rotate-12" style={{ color: '#8a6a1e', opacity: 0.28 }}>{PLANE}</span>
        <span className="inline-flex w-fit rounded-full bg-white/70 px-2.5 py-0.5 font-ui text-[11px] font-bold uppercase tracking-wide" style={{ color: '#3E1A57' }}>{tag}</span>
        <h4 style={{ fontFamily: serif, color: '#3E1A57' }} className="mt-2 line-clamp-2 text-[1.05rem] font-bold leading-snug">{p.title}</h4>
      </div>
      <div className="flex grow flex-col p-4">
        {p.summary && <p className="line-clamp-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{p.summary}</p>}
        <span className="mt-3 inline-flex items-center gap-1 font-ui text-sm font-bold" style={{ color: 'var(--color-primary)' }}>See the deal <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span></span>
      </div>
    </Link>
  )
}

// Lane 2 — a flight sweet spot (evergreen): soft-lavender stat header.
function SweetSpotCard({ s, serif }: { s: FlightSweetSpot; serif: string }) {
  const cabin = s.cabin ? s.cabin.replace(/_/g, ' ') : null
  return (
    <Link href="/sweet-spots" className={DEAL_CARD} style={DEAL_STYLE}>
      <div className="relative overflow-hidden p-5" style={{ background: 'linear-gradient(135deg,#f3ecfa 0%,#e7d9f5 55%,#d9c7ef 100%)' }}>
        <span className="pointer-events-none absolute -right-2 -top-2 h-16 w-16 rotate-12" style={{ color: 'var(--color-primary)', opacity: 0.22 }}>{PLANE}</span>
        {s.points != null ? (
          <div className="flex items-baseline gap-1.5">
            <span style={{ fontFamily: serif, color: 'var(--color-primary)' }} className="text-3xl font-extrabold leading-none">{s.points.toLocaleString('en-US')}</span>
            <span className="font-ui text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--color-primary)' }}>pts</span>
          </div>
        ) : (
          <span style={{ fontFamily: serif, color: 'var(--color-primary)' }} className="text-2xl font-extrabold">Sweet spot</span>
        )}
        {cabin && <span className="mt-2 inline-flex w-fit rounded-full bg-white/70 px-2.5 py-0.5 font-ui text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>{cabin}</span>}
      </div>
      <div className="flex grow flex-col p-4">
        <h4 style={{ fontFamily: serif, color: 'var(--color-primary)' }} className="line-clamp-2 text-[1.02rem] font-bold leading-snug">{s.title}</h4>
        {s.route && <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{s.route}</p>}
        <span className="mt-3 inline-flex items-center gap-1 font-ui text-sm font-bold" style={{ color: 'var(--color-primary)' }}>See how <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span></span>
      </div>
    </Link>
  )
}

export default function PreviewHomeMock({ variant, experiences = [], flightBonuses = [], flightSweetSpots = [], hotelPromos = [], hotelSweetSpots = [] }: { variant: 'editorial' | 'immersive' | 'index'; experiences?: ExperienceGroup[]; flightBonuses?: FlightBonus[]; flightSweetSpots?: FlightSweetSpot[]; hotelPromos?: PromoAlert[]; hotelSweetSpots?: FlightSweetSpot[] }) {
  const dark = variant === 'immersive'
  const isIndex = variant === 'index'
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

      {/* ===== Gold-pill jump nav (index only) ===== */}
      {isIndex && (
        <div style={{ background: 'var(--color-background)' }}>
          <style>{`
            .c4p-pill{position:relative;overflow:hidden;transition:transform .18s ease}
            .c4p-pill:hover{transform:translateY(-1.5px)}
            .c4p-pill-gold{background:linear-gradient(180deg,#f8e7a8 0%,#ebcc66 48%,#cfa63f 100%);color:#3E1A57;border:1.5px solid #b8862a;box-shadow:0 6px 14px -8px rgba(201,161,58,.85),inset 0 1px 0 rgba(255,255,255,.75),inset 0 -2px 4px rgba(150,110,30,.28)}
            .c4p-pill-new{background:linear-gradient(180deg,#7a34a3 0%,#5a2378 55%,#431a63 100%);color:#f4d97a;border:1.5px solid #D4AF37;box-shadow:0 8px 18px -9px rgba(74,29,99,.85),inset 0 1px 0 rgba(255,255,255,.18)}
            .c4p-pill .c4p-lbl{position:relative;z-index:1}
            .c4p-pill-gold::after{content:'';position:absolute;top:0;left:-70%;width:45%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.85),transparent);transform:skewX(-20deg);animation:c4pShimmer 4s ease-in-out infinite}
            @keyframes c4pShimmer{0%{left:-70%}40%{left:140%}100%{left:140%}}
            @media (prefers-reduced-motion: reduce){.c4p-pill-gold::after{animation:none;opacity:0}}
          `}</style>
          <div className="rg-container" style={{ paddingTop: '1.5rem', paddingBottom: '1.75rem' }}>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PILLS.map((p) => {
                const primary = p.href === '/start-here'
                if (primary) {
                  return (
                    <a key={p.label} href={p.href} className="c4p-pill c4p-pill-new inline-flex flex-col items-center justify-center rounded-full px-4 py-1.5 leading-none" style={{ fontFamily: 'var(--font-ui)' }}>
                      <span className="c4p-lbl text-[0.6rem] font-semibold" style={{ opacity: 0.9 }}>New?</span>
                      <span className="c4p-lbl mt-0.5 text-[0.8rem] font-extrabold">Start here</span>
                    </a>
                  )
                }
                return (
                  <a key={p.label} href={p.href} className="c4p-pill c4p-pill-gold inline-flex items-center rounded-full px-4 py-1.5 text-[0.75rem] font-bold" style={{ fontFamily: 'var(--font-ui)' }}>
                    <span className="c4p-lbl">{p.label}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== Experiences section — full-bleed banner right under the hero + real listings ===== */}
      {experiences.length > 0 && (
        <section id="experiences" style={{ background: 'var(--color-background)', scrollMarginTop: '84px' }}>
          <FullBleedBanner image="/hero-preview/cards/experiences-banner.png" alt="VIP Experiences — book with points" />
          <div className="rg-container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
            {/* real top listings pulled from the DB */}
            <div className="mx-auto mb-6 flex max-w-5xl flex-wrap items-end justify-between gap-3">
              <div>
                <div className="h-[2px] w-8 rounded" style={{ background: 'var(--color-accent)' }} />
                <h3 style={{ fontFamily: serif, color: 'var(--color-primary)' }} className="mt-2 text-xl font-bold sm:text-2xl">Money can&apos;t buy it. Points can.</h3>
              </div>
              <Link href="/experiences" className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-ui)' }}>Explore all <span aria-hidden>→</span></Link>
            </div>
            <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-3">
              {experiences.slice(0, 3).map((g) => (
                <ExpCard key={g.key} g={g} serif={serif} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Flight Deals section — two lanes: transfer bonuses + sweet spots ===== */}
      {isIndex && (flightBonuses.length > 0 || flightSweetSpots.length > 0) && (
        <section id="flights" style={{ background: 'var(--color-background-soft)', scrollMarginTop: '84px' }}>
          <FullBleedBanner title="Flight Deals" sub="AWARD SALES & SWEET SPOTS" />
          <div className="rg-container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
            {/* Lane 1 — ending soon: transfer bonuses */}
            {flightBonuses.length > 0 && (
              <>
                <div className="mx-auto mb-5 flex max-w-5xl flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="h-[2px] w-8 rounded" style={{ background: 'var(--color-accent)' }} />
                    <h3 style={{ fontFamily: serif, color: 'var(--color-primary)' }} className="mt-2 text-xl font-bold sm:text-2xl">Ending soon: transfer bonuses</h3>
                    <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">Move points to these airlines for extra miles — while the promo lasts.</p>
                  </div>
                  <Link href="/alerts" className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-ui)' }}>See all deals <span aria-hidden>→</span></Link>
                </div>
                <div className="mx-auto mb-10 grid max-w-5xl gap-5 sm:grid-cols-3">
                  {flightBonuses.slice(0, 3).map((b, i) => <BonusCard key={i} b={b} serif={serif} />)}
                </div>
              </>
            )}
            {/* Lane 2 — sweet spots worth chasing */}
            {flightSweetSpots.length > 0 && (
              <>
                <div className="mx-auto mb-5 flex max-w-5xl flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="h-[2px] w-8 rounded" style={{ background: 'var(--color-accent)' }} />
                    <h3 style={{ fontFamily: serif, color: 'var(--color-primary)' }} className="mt-2 text-xl font-bold sm:text-2xl">Sweet spots worth chasing</h3>
                    <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">The evergreen redemptions that are always smart, not just on sale.</p>
                  </div>
                  <Link href="/sweet-spots" className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-ui)' }}>Explore sweet spots <span aria-hidden>→</span></Link>
                </div>
                <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-3">
                  {flightSweetSpots.slice(0, 3).map((s) => <SweetSpotCard key={s.id} s={s} serif={serif} />)}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ===== Hotel Deals section — two lanes: current promos + sweet spots ===== */}
      {isIndex && (hotelPromos.length > 0 || hotelSweetSpots.length > 0) && (
        <section id="hotels" style={{ background: 'var(--color-background)', scrollMarginTop: '84px' }}>
          <FullBleedBanner title="Hotel Deals" sub="FREE NIGHTS & DREAM STAYS" />
          <div className="rg-container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
            {/* Lane 1 — happening now: hotel promos */}
            {hotelPromos.length > 0 && (
              <>
                <div className="mx-auto mb-5 flex max-w-5xl flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="h-[2px] w-8 rounded" style={{ background: 'var(--color-accent)' }} />
                    <h3 style={{ fontFamily: serif, color: 'var(--color-primary)' }} className="mt-2 text-xl font-bold sm:text-2xl">Happening now: hotel deals</h3>
                    <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">Point sales, elevated card offers, and limited promos worth grabbing.</p>
                  </div>
                  <Link href="/alerts" className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-ui)' }}>See all deals <span aria-hidden>→</span></Link>
                </div>
                <div className="mx-auto mb-10 grid max-w-5xl gap-5 sm:grid-cols-3">
                  {hotelPromos.slice(0, 3).map((p, i) => <PromoCard key={i} p={p} serif={serif} />)}
                </div>
              </>
            )}
            {/* Lane 2 — sweet spots worth chasing */}
            {hotelSweetSpots.length > 0 && (
              <>
                <div className="mx-auto mb-5 flex max-w-5xl flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="h-[2px] w-8 rounded" style={{ background: 'var(--color-accent)' }} />
                    <h3 style={{ fontFamily: serif, color: 'var(--color-primary)' }} className="mt-2 text-xl font-bold sm:text-2xl">Sweet spots worth chasing</h3>
                    <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">Aspirational stays and free-night tricks that always over-deliver.</p>
                  </div>
                  <Link href="/sweet-spots" className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-ui)' }}>Explore sweet spots <span aria-hidden>→</span></Link>
                </div>
                <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-3">
                  {hotelSweetSpots.slice(0, 3).map((s) => <SweetSpotCard key={s.id} s={s} serif={serif} />)}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ===== Your Toolkit — real tools as image tiles (index) ===== */}
      {isIndex && (
        <section id="tools" style={{ background: 'var(--color-background-soft)', scrollMarginTop: '84px' }}>
          <div className="rg-container rg-major-section">
            <div className="mb-6">
              <div className="h-[2px] w-8 rounded" style={{ background: 'var(--color-accent)' }} />
              <h2 style={{ fontFamily: serif, color: 'var(--color-primary)' }} className="mt-2 text-2xl font-bold sm:text-3xl">Your Toolkit</h2>
              <p className="mt-2 max-w-xl font-body text-[var(--color-text-secondary)]">Plan smarter, travel further — the tools that turn your points into trips.</p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2">
              {TOOLS.map((t) => (
                <Link key={t.label} href={t.href} className="group relative block overflow-hidden rounded-2xl transition-transform duration-200 hover:-translate-y-1" style={{ border: '1px solid rgba(107,45,143,0.12)', boxShadow: '0 14px 34px -22px rgba(62,26,87,0.4)' }}>
                  <div className="relative aspect-[16/9] w-full overflow-hidden" style={{ background: `linear-gradient(150deg, ${t.accent}, ${t.accent}bb)` }}>
                    {t.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.image} alt={t.label} className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col justify-center p-6 text-white">
                        <div className="h-[2px] w-7 rounded" style={{ background: 'rgba(255,255,255,0.85)' }} />
                        <div style={{ fontFamily: serif }} className="mt-2 text-2xl font-bold leading-tight">{t.label}</div>
                        <p className="mt-1.5 max-w-[16rem] text-sm text-white/85">{t.desc}</p>
                        <span className="mt-3 inline-flex items-center gap-1 font-ui text-sm font-bold text-white">Open <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span></span>
                      </div>
                    )}
                  </div>
                  {/* Charlie-approved nominative caption (footer carries the not-affiliated disclosure) */}
                  {t.caption && (
                    <div className="bg-white px-4 py-2 text-center" style={{ borderTop: '1px solid rgba(107,45,143,0.1)' }}>
                      <p className="font-ui text-xs text-[var(--color-text-secondary)]">{t.caption}</p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== New here? Find your path — persona funnel into /start-here (index) ===== */}
      {isIndex && (
        <section id="new-here" style={{ background: 'var(--color-background)', scrollMarginTop: '84px' }}>
          <div className="rg-container rg-major-section">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="h-[2px] w-8 rounded" style={{ background: 'var(--color-accent)' }} />
                <h2 style={{ fontFamily: serif, color: 'var(--color-primary)' }} className="mt-2 text-2xl font-bold sm:text-3xl">New to points? Find your path.</h2>
                <p className="mt-2 max-w-xl font-body text-[var(--color-text-secondary)]">Pick the traveler that sounds like you — we&apos;ll show you exactly where to start.</p>
              </div>
              <Link href="/start-here" className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-ui)' }}>Start here <span aria-hidden>→</span></Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {PERSONAS.map((p) => (
                <Link key={p.key} href={`/start-here/${p.key}`} className="group flex flex-col overflow-hidden rounded-2xl bg-white transition-transform duration-200 hover:-translate-y-1" style={{ border: '1px solid rgba(107,45,143,0.12)', boxShadow: '0 14px 34px -22px rgba(62,26,87,0.4)' }}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: `linear-gradient(150deg, ${p.accent}, ${p.accent}bb)` }}>
                    {p.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.title} className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105" />
                    )}
                  </div>
                  <div className="p-3">
                    <div style={{ fontFamily: serif, color: 'var(--color-primary)' }} className="text-[0.95rem] font-bold leading-tight">{p.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Category cards (editorial / immersive only; index uses the pill jump-nav) ===== */}
      {!isIndex && (
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
      )}

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
