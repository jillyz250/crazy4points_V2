import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'crazy4points — Tips & Trips',
  description: 'The newsletter, guides, deals, and tools from crazy4points, all in one place.',
  alternates: { canonical: 'https://www.crazy4points.com/links' },
}

export const revalidate = 86400

// Spotlight card at the top. Swap this whenever you want to feature something
// new (a fresh post, a live deal). Set to null to hide it entirely.
// Recent social-post articles, newest first. Add each new IG/FB post's article
// to the TOP and keep the last ~4 so every recent "link in bio" still resolves.
const LATEST: { title: string; href: string }[] = [
  { title: "Wyndham's last-chance 15,000-point bonus (register by Sept 3)", href: '/alerts/wyndham-summer-of-rewards-15k' },
  { title: 'An NFL ticket for 100 United miles (Chiefs vs. Seahawks)', href: '/alerts/united-100-mile-nfl-ticket' },
  { title: 'Southwest just opened its booking window to April 2027', href: '/programs/southwest' },
  { title: 'Hyatt and Air Canada are now trading points', href: '/alerts/hyatt-aeroplan-partnership' },
]

// The permanent button stack. The first item renders as the primary (filled)
// button. Reorder freely.
const LINKS: { label: string; sub?: string; href: string }[] = [
  { label: 'Get the newsletter', sub: 'Tips and trips in your inbox', href: '/newsletter' },
  { label: 'New to points? Start here', href: '/start-here' },
  { label: 'Guides', sub: 'Plain-English playbooks', href: '/guides' },
  { label: 'The blog', href: '/blog' },
  { label: 'Card Explorer', sub: 'Find the card that fits you', href: '/cards' },
  { label: 'Decision Engine', sub: 'Where can my points take me?', href: '/decision-engine' },
]

export default function LinksPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-[var(--color-background-soft)] px-5 py-12">
      <div className="w-full max-w-[26rem]">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <Image
            src="/crazy4points-logo.png"
            alt="crazy4points"
            width={1317}
            height={509}
            priority
            className="h-auto w-[220px]"
          />
          <p className="mt-4 font-body text-[var(--color-text-secondary)]">
            Travel smarter. Earn more. Go farther.
          </p>
        </div>

        {/* Newsletter first — the primary action */}
        <Link
          href={LINKS[0].href}
          className="mt-8 block rounded-[var(--radius-card)] border border-[var(--color-primary)] bg-[var(--color-primary)] px-5 py-4 text-center shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)]"
        >
          <span className="block font-ui text-base font-semibold text-white">{LINKS[0].label}</span>
          {LINKS[0].sub && (
            <span className="mt-0.5 block font-body text-sm text-white/85">{LINKS[0].sub}</span>
          )}
        </Link>

        {/* Latest from the feed — the articles behind recent posts */}
        {LATEST.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-center font-ui text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Latest from the feed
            </p>
            <div className="flex flex-col gap-2.5">
              {LATEST.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-[var(--radius-card)] px-5 py-4 text-center shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 ${
                    i === 0
                      ? 'border-2 border-[var(--color-accent)] bg-[var(--color-background)]'
                      : 'border border-[var(--color-border-soft)] bg-[var(--color-background)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  <span className="block font-display text-base font-semibold leading-snug text-[var(--color-primary)]">
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Button stack (newsletter is rendered above) */}
        <div className="mt-4 flex flex-col gap-3">
          {LINKS.slice(1).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-5 py-4 text-center shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]"
            >
              <span className="block font-ui text-base font-semibold text-[var(--color-primary)]">
                {l.label}
              </span>
              {l.sub && (
                <span className="mt-0.5 block font-body text-sm text-[var(--color-text-secondary)]">
                  {l.sub}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center font-body text-xs text-[var(--color-text-secondary)]">
          <Link href="/" className="underline underline-offset-4 hover:text-[var(--color-primary)]">crazy4points.com</Link>
          <span className="mx-2" aria-hidden>&middot;</span>
          <Link href="/disclosures" className="underline underline-offset-4 hover:text-[var(--color-primary)]">Disclosures</Link>
        </footer>
      </div>
    </main>
  )
}
