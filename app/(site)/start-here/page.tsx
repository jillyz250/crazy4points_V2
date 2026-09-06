import type { Metadata } from 'next'
import Link from 'next/link'
import { PERSONAS, SITE_TUTORIAL } from '@/lib/startHere'

export const metadata: Metadata = {
  title: 'Start Here — Your Guide to Points Travel | Crazy4Points',
  description:
    'New to points and miles? Start here. Find the path that fits how you like to travel, then learn exactly how to use Crazy4Points to travel in luxury for less.',
}

export default function StartHerePage() {
  return (
    <>
      {/* ===== Welcome hero ===== */}
      <section style={{ background: 'radial-gradient(120% 90% at 50% -10%, #f3ecfa 0%, var(--color-background) 60%)' }}>
        <div className="rg-container" style={{ paddingTop: '3rem', paddingBottom: '2.5rem' }}>
          <div className="mx-auto max-w-2xl text-center">
            <span className="mx-auto mb-3 block h-[2px] w-8 rounded" style={{ background: 'var(--color-accent)' }} />
            <h1 className="font-display text-3xl font-bold leading-tight text-[var(--color-primary)] sm:text-4xl">New here? Start here.</h1>
            <p className="mt-4 font-body text-[var(--color-text-secondary)] md:text-lg">
              Luxury travel for less, using points you&apos;re probably already earning. Pick the path that sounds like
              you and we&apos;ll show you exactly where to begin.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Personas ===== */}
      <section className="rg-container" style={{ paddingBottom: '1rem' }}>
        <div className="mb-6">
          <div className="h-[2px] w-8 rounded" style={{ background: 'var(--color-accent)' }} />
          <h2 className="mt-2 font-display text-2xl font-bold text-[var(--color-primary)] md:text-3xl">What kind of points traveler are you?</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {PERSONAS.map((p) => (
            <Link
              key={p.key}
              href={`/start-here/${p.key}`}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white transition-transform duration-200 hover:-translate-y-1"
              style={{ border: '1px solid rgba(107,45,143,0.12)', boxShadow: '0 14px 34px -22px rgba(62,26,87,0.4)' }}
            >
              {/* image (or accent-gradient placeholder until generated) */}
              <div className="relative aspect-[16/10] w-full overflow-hidden" style={{ background: `linear-gradient(150deg, ${p.accent}, ${p.accent}bb)` }}>
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                )}
                <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(30,10,45,0.35), transparent 55%)' }} />
                <span className="absolute bottom-3 left-4 font-display text-xl font-bold text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>{p.title}</span>
              </div>
              <div className="flex grow flex-col p-5">
                <p className="font-body text-sm text-[var(--color-text-secondary)]">{p.tagline}</p>
                <span className="mt-3 inline-flex items-center gap-1 font-ui text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                  Show me <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== How the site works ===== */}
      <section className="rg-container rg-sub-section">
        <div className="mb-6">
          <div className="h-[2px] w-8 rounded" style={{ background: 'var(--color-accent)' }} />
          <h2 className="mt-2 font-display text-2xl font-bold text-[var(--color-primary)] md:text-3xl">How Crazy4Points works</h2>
          <p className="mt-2 max-w-2xl font-body text-[var(--color-text-secondary)]">Four things do the heavy lifting. Here&apos;s what each is and how to get the most from it.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {SITE_TUTORIAL.map((t) => (
            <div key={t.name} className="flex flex-col rounded-2xl bg-white p-5" style={{ border: '1px solid rgba(107,45,143,0.12)', boxShadow: 'var(--shadow-soft)' }}>
              <div className="h-[2px] w-6 rounded" style={{ background: 'var(--color-accent)' }} />
              <h3 className="mt-2 font-display text-lg font-bold text-[var(--color-primary)]">{t.name}</h3>
              <p className="mt-1.5 font-body text-sm text-[var(--color-text-primary)]">{t.what}</p>
              <p className="mt-2 font-body text-sm text-[var(--color-text-secondary)]"><span className="font-semibold text-[var(--color-primary)]">How:</span> {t.how}</p>
              <Link href={t.href} className="mt-3 inline-flex items-center gap-1 font-ui text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                Explore {t.name} <span aria-hidden>→</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="rg-container" style={{ paddingBottom: '4rem' }}>
        <div className="flex flex-col items-center gap-4 rounded-2xl px-6 py-12 text-center" style={{ background: 'linear-gradient(135deg, #2a0f3d, #6B2D8F)' }}>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Champagne travel. Diet Coke prices.</h2>
          <p className="max-w-xl font-body text-sm text-white/85">Start with the newsletter — the deals actually worth your time, and the how-tos to use them, in your inbox.</p>
          <Link href="/newsletter" className="rounded-full px-6 py-3 font-ui text-sm font-bold uppercase tracking-[0.06em] text-[#1a1a1a]" style={{ background: 'linear-gradient(180deg,#e9c757,#c99a25)' }}>
            Join the Insider List →
          </Link>
        </div>
      </section>
    </>
  )
}
