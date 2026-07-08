import Link from 'next/link'
import type { Metadata } from 'next'
import NewsletterSignup from '@/components/home/NewsletterSignup'
import { createClient } from '@/utils/supabase/server'
import { getPublicNewsletters, issueTitle } from '@/utils/content/publicNewsletters'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Newsletter | crazy4points',
  description:
    'The Crazy4Points newsletter: the week’s best points-and-miles deals, transfer bonuses, and award sweet spots. Subscribe, or browse every past issue.',
  alternates: { canonical: 'https://www.crazy4points.com/newsletter' },
}

function fmtDate(d: string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

export default async function NewsletterPage() {
  const supabase = await createClient()
  const issues = await getPublicNewsletters(supabase)
  const [latest, ...rest] = issues

  return (
    <main className="rg-major-section">
      <div className="rg-container px-6 md:px-8">
        {/* Signup hero */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-semibold text-[var(--color-primary)]">Stay in the Loop</h1>
          <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">
            The week&apos;s best points-and-miles deals, transfer bonuses, and award sweet spots, curated and delivered to your inbox.
          </p>
        </div>
        <div className="mt-10">
          <NewsletterSignup />
        </div>

        {/* Latest issue */}
        {latest && (
          <section className="mt-16 mx-auto max-w-2xl">
            <h2 className="font-ui text-sm uppercase tracking-wide text-[var(--color-text-secondary)] mb-3">Latest issue</h2>
            <Link
              href={`/newsletter/${latest.slug}`}
              className="block rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-6 shadow-[var(--shadow-soft)] hover:border-[var(--color-primary)] transition-colors"
            >
              <p className="font-body text-xs text-[var(--color-text-secondary)]">
                {latest.issue_number ? `Issue #${latest.issue_number} · ` : ''}{fmtDate(latest.sent_at)}
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-[var(--color-primary)]">{issueTitle(latest)}</p>
              {latest.hero_kicker && <p className="mt-2 font-body text-[var(--color-text-secondary)]">{latest.hero_kicker}</p>}
              <span className="mt-3 inline-block font-ui text-sm font-semibold text-[var(--color-primary)]">Read this issue &rarr;</span>
            </Link>
          </section>
        )}

        {/* Previous issues */}
        {rest.length > 0 && (
          <section className="mt-12 mx-auto max-w-2xl">
            <h2 className="font-ui text-sm uppercase tracking-wide text-[var(--color-text-secondary)] mb-3">Previous issues</h2>
            <ul className="divide-y divide-[var(--color-border-soft)]">
              {rest.map((n) => (
                <li key={n.slug}>
                  <Link href={`/newsletter/${n.slug}`} className="flex items-baseline justify-between gap-4 py-4 group">
                    <span className="font-body text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]">
                      {n.issue_number ? <span className="text-[var(--color-text-secondary)]">#{n.issue_number} </span> : null}
                      {issueTitle(n)}
                    </span>
                    <span className="shrink-0 font-body text-sm text-[var(--color-text-secondary)]">{fmtDate(n.sent_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
