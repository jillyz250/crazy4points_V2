import type { Metadata } from 'next'
import Link from 'next/link'
import { GUIDE_CATEGORIES, guidesInCategory } from '@/lib/guides'

export const metadata: Metadata = {
  title: 'Points & Miles Guides — crazy4points',
  description:
    'Plain-English guides to airlines, hotels, and credit-card points: upgrades, best rate guarantees, transfers, and how to get more from your rewards.',
  alternates: { canonical: 'https://www.crazy4points.com/guides' },
  openGraph: {
    title: 'Points & Miles Guides — crazy4points',
    description:
      'Plain-English guides to airlines, hotels, and credit-card points, verified against official sources.',
    url: 'https://www.crazy4points.com/guides',
    type: 'website',
    siteName: 'crazy4points',
  },
}

export const revalidate = 86400

export default function GuidesHub() {
  return (
    <main className="rg-major-section">
      <div className="rg-container" style={{ maxWidth: '64rem' }}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
          Guides
        </span>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          Points &amp; Miles Guides
        </h1>
        <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">
          Plain-English playbooks for getting more out of your points, from airline upgrades to hotel
          price matches. Every guide is verified against official sources and dated so you know it&rsquo;s current.
        </p>

        {GUIDE_CATEGORIES.map((cat) => {
          const guides = guidesInCategory(cat.key)
          return (
            <section key={cat.key} id={cat.key} style={{ scrollMarginTop: '6rem', marginTop: '3rem' }}>
              <h2 className="font-display text-2xl font-semibold text-[var(--color-primary)]">{cat.label}</h2>
              <p className="mt-1 font-body text-[var(--color-text-secondary)]">{cat.blurb}</p>

              {guides.length === 0 ? (
                <p className="mt-4 font-body text-sm italic text-[var(--color-text-secondary)]">
                  More guides coming soon.
                </p>
              ) : (
                <div
                  className="mt-5"
                  style={{
                    display: 'grid',
                    gap: '1rem',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))',
                  }}
                >
                  {guides.map((g) => (
                    <Link
                      key={g.slug}
                      href={`/guides/${g.slug}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        background: 'var(--color-background-soft)',
                        border: '1px solid var(--color-border-soft)',
                        borderRadius: 'var(--radius-card)',
                        padding: '1.25rem 1.375rem',
                        textDecoration: 'none',
                        boxShadow: 'var(--shadow-soft)',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-primary)', lineHeight: 1.25 }}>
                        {g.title}
                      </span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                        {g.description}
                      </span>
                      <span style={{ marginTop: '0.25rem', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)' }}>
                        Read the guide →
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )
        })}

        <p className="mt-12 font-body text-sm text-[var(--color-text-secondary)]">
          Looking for a specific program instead? Browse our{' '}
          <Link href="/programs" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>airline and hotel program pages</Link>.
        </p>
      </div>
    </main>
  )
}
