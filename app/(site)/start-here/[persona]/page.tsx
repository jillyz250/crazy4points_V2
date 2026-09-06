import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PERSONAS, personaByKey } from '@/lib/startHere'

export function generateStaticParams() {
  return PERSONAS.map((p) => ({ persona: p.key }))
}

export async function generateMetadata({ params }: { params: Promise<{ persona: string }> }): Promise<Metadata> {
  const { persona } = await params
  const p = personaByKey(persona)
  if (!p) return { title: 'Start Here | Crazy4Points' }
  return {
    title: `${p.title} — Start Here | Crazy4Points`,
    description: p.intro,
  }
}

export default async function PersonaPage({ params }: { params: Promise<{ persona: string }> }) {
  const { persona } = await params
  const p = personaByKey(persona)
  if (!p) notFound()

  return (
    <>
      {/* ===== Persona hero ===== */}
      <section style={{ background: 'radial-gradient(120% 90% at 50% -10%, #f3ecfa 0%, var(--color-background) 60%)' }}>
        <div className="rg-container" style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
          <Link href="/start-here" className="inline-flex items-center gap-1 font-ui text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
            <span aria-hidden>←</span> Start Here
          </Link>
          <div className="mt-5 grid items-center gap-8 md:grid-cols-2">
            {/* image (or accent-gradient placeholder until generated) */}
            <div className="relative order-first aspect-[4/3] w-full overflow-hidden rounded-2xl md:order-last" style={{ background: `linear-gradient(150deg, ${p.accent}, ${p.accent}bb)`, boxShadow: '0 24px 56px -30px rgba(62,26,87,0.5)' }}>
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt={p.title} className="absolute inset-0 h-full w-full object-cover object-top" />
              )}
            </div>
            <div>
              <span className="mb-3 block h-[2px] w-8 rounded" style={{ background: 'var(--color-accent)' }} />
              <h1 className="font-display text-3xl font-bold leading-tight text-[var(--color-primary)] sm:text-4xl">{p.title}</h1>
              <p className="mt-3 font-display text-lg italic text-[var(--color-primary)]">{p.tagline}</p>
              <p className="mt-4 font-body text-[var(--color-text-secondary)] md:text-lg">{p.intro}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3 steps ===== */}
      <section className="rg-container rg-sub-section">
        <div className="mb-6">
          <div className="h-[2px] w-8 rounded" style={{ background: 'var(--color-accent)' }} />
          <h2 className="mt-2 font-display text-2xl font-bold text-[var(--color-primary)] md:text-3xl">Your path, in three steps</h2>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {p.steps.map((step, i) => (
            <li key={i} className="flex flex-col rounded-2xl bg-white p-5" style={{ border: '1px solid rgba(107,45,143,0.12)', boxShadow: 'var(--shadow-soft)' }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full font-ui text-sm font-extrabold" style={{ background: `${p.accent}1F`, color: p.accent, border: `2px solid ${p.accent}` }}>{i + 1}</span>
              <p className="mt-3 font-body text-sm text-[var(--color-text-primary)]">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ===== Tools for this persona ===== */}
      <section className="rg-container" style={{ paddingBottom: '2rem' }}>
        <div className="mb-6">
          <div className="h-[2px] w-8 rounded" style={{ background: 'var(--color-accent)' }} />
          <h2 className="mt-2 font-display text-2xl font-bold text-[var(--color-primary)] md:text-3xl">Where to go next</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {p.tools.map((t) => (
            <Link key={t.label} href={t.href} className="group flex flex-col rounded-2xl bg-white p-5 transition-transform duration-200 hover:-translate-y-1" style={{ border: '1px solid rgba(107,45,143,0.12)', boxShadow: '0 14px 34px -22px rgba(62,26,87,0.4)' }}>
              <div className="h-[2px] w-6 rounded" style={{ background: 'var(--color-accent)' }} />
              <h3 className="mt-2 font-display text-lg font-bold text-[var(--color-primary)]">{t.label}</h3>
              <p className="mt-1.5 grow font-body text-sm text-[var(--color-text-secondary)]">{t.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 font-ui text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                Open {t.label} <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="rg-container" style={{ paddingBottom: '4rem' }}>
        <div className="flex flex-col items-center gap-4 rounded-2xl px-6 py-12 text-center" style={{ background: 'linear-gradient(135deg, #2a0f3d, #6B2D8F)' }}>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Never miss a move.</h2>
          <p className="max-w-xl font-body text-sm text-white/85">The Insider List brings the best deals and the how-tos straight to your inbox.</p>
          <Link href="/newsletter" className="rounded-full px-6 py-3 font-ui text-sm font-bold uppercase tracking-[0.06em] text-[#1a1a1a]" style={{ background: 'linear-gradient(180deg,#e9c757,#c99a25)' }}>
            Join the Insider List →
          </Link>
        </div>
      </section>
    </>
  )
}
