import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { getAllPrograms } from '@/utils/supabase/queries'

export const metadata: Metadata = {
  title: 'Ways To Book',
  description:
    'Every way to book award flights — by airline, cabin, and program. Compare partner redemptions side-by-side and find the cheapest path to the seat you want.',
  alternates: { canonical: 'https://www.crazy4points.com/tools/ways-to-book' },
}

export const revalidate = 300

export default async function WaysToBookPage({
  searchParams,
}: {
  searchParams: Promise<{ operator?: string }>
}) {
  const { operator } = await searchParams
  const supabase = createAdminClient()
  const programs = await getAllPrograms(supabase)
  const operators = programs
    .filter((p) => p.type === 'airline' && (p.partner_access ?? 'NO') !== 'NO')
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <main className="rg-major-section">
      <div className="rg-container" style={{ maxWidth: '60rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.25rem 0.625rem',
            borderRadius: '999px',
            background: 'var(--color-accent)',
            color: '#1A1A1A',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}
        >
          Coming soon
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: 'var(--color-primary)',
            marginBottom: '1rem',
            lineHeight: 1.1,
          }}
        >
          Ways To Book
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.0625rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.55,
            marginBottom: '1.5rem',
          }}
        >
          The full Ways To Book tool is coming soon. It will let you pick any
          airline, optionally enter the points you have, and see every way to
          book the seat — ranked by cost, with transfer paths and side-by-side
          comparison.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.55,
            marginBottom: '2.5rem',
          }}
        >
          For now, every airline page surfaces its own &ldquo;Where to spend&rdquo;
          and &ldquo;Ways to book&rdquo; sections with the same data. Pick an
          airline below to jump straight to it.
        </p>

        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            color: 'var(--color-primary)',
            marginBottom: '1rem',
          }}
        >
          Airlines covered so far
        </h2>
        <ul
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
            gap: '0.5rem',
            listStyle: 'none',
            padding: 0,
          }}
        >
          {operators.map((p) => (
            <li key={p.id}>
              <Link
                href={`/programs/${p.slug}`}
                style={{
                  display: 'block',
                  padding: '0.625rem 0.875rem',
                  background:
                    operator === p.slug ? 'var(--color-background-soft)' : '#fff',
                  border: '1px solid var(--color-border-soft)',
                  borderRadius: 'var(--radius-ui)',
                  textDecoration: 'none',
                  color: 'var(--color-primary)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                }}
              >
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
