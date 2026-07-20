import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getPublicNewsletterBySlug, issueTitle } from '@/utils/content/publicNewsletters'
import NewsletterIssueBody from '@/components/newsletter/NewsletterIssueBody'
import NewsletterSignup from '@/components/home/NewsletterSignup'

export const revalidate = 3600

const SITE = 'https://www.crazy4points.com'

function fmtDate(d: string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const n = await getPublicNewsletterBySlug(supabase, slug)
  if (!n) return { title: 'Newsletter | crazy4points' }
  const title = issueTitle(n)
  const description = n.hero_kicker || `The Crazy4Points newsletter, issue ${n.issue_number ?? ''}: points deals, transfer bonuses, and award sweet spots.`
  const url = `${SITE}/newsletter/${n.slug}`
  return {
    title: `${title} | Crazy4Points Newsletter`,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article', publishedTime: n.sent_at ?? undefined },
  }
}

export default async function NewsletterIssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const n = await getPublicNewsletterBySlug(supabase, slug)
  if (!n) notFound()

  const title = issueTitle(n)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    datePublished: n.sent_at ?? undefined,
    dateModified: n.sent_at ?? undefined,
    author: { '@type': 'Organization', name: 'Crazy4Points' },
    publisher: { '@type': 'Organization', name: 'Crazy4Points' },
    mainEntityOfPage: `${SITE}/newsletter/${n.slug}`,
    description: n.hero_kicker ?? undefined,
  }

  return (
    <main className="rg-major-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="rg-container px-6 md:px-8">
        <article>
          <header className="mx-auto max-w-2xl">
            <Link href="/newsletter" className="font-ui text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">&larr; All issues</Link>
            {n.hero_kicker && <p className="mt-6 font-ui text-sm uppercase tracking-wide text-[var(--color-accent)]">{n.hero_kicker}</p>}
            <h1 className="mt-2 font-display text-3xl md:text-4xl font-semibold text-[var(--color-primary)]">{title}</h1>
            <p className="mt-3 font-body text-sm text-[var(--color-text-secondary)]">
              {n.issue_number ? `Issue #${n.issue_number} · ` : ''}Originally sent {fmtDate(n.sent_at)}
            </p>
            {/* Freshness notice — deals age */}
            <p className="mt-6 rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-4 py-3 font-body text-sm text-[var(--color-text-secondary)]">
              This issue was originally sent on {fmtDate(n.sent_at)}. Some promotions, award availability, and transfer bonuses mentioned below may have changed or expired since then.
            </p>
          </header>

          <div className="mt-10">
            <NewsletterIssueBody n={n} />
          </div>
        </article>

        {/* Subscribe CTA */}
        <section className="mt-16 mx-auto max-w-2xl">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-6 text-center">
            <p className="font-display text-xl font-semibold text-[var(--color-primary)]">Get this in your inbox</p>
            <p className="mt-2 font-body text-[var(--color-text-secondary)]">The best points-and-miles moves, delivered to your inbox. No spam.</p>
            <div className="mt-5"><NewsletterSignup isPrimary /></div>
          </div>
          <p className="mt-8 text-center">
            <Link href="/newsletter" className="font-ui text-sm font-semibold text-[var(--color-primary)] hover:underline">Browse all past issues &rarr;</Link>
          </p>
        </section>
      </div>
    </main>
  )
}
