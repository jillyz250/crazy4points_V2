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
const FEATURED: { title: string; href: string } | null = {
  title: 'Turn Rakuten cash back into Amex points',
  href: '/blog/convert-rakuten-cash-back-to-amex-points-with-the-right-card',
}

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

        {/* Featured spotlight */}
        {FEATURED && (
          <Link
            href={FEATURED.href}
            className="mt-8 block rounded-[var(--radius-card)] border-2 border-[var(--color-accent)] bg-[var(--color-background)] px-5 py-4 text-center shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"
          >
            <span className="font-ui text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Featured
            </span>
            <span className="mt-1 block font-display text-lg font-semibold leading-snug text-[var(--color-primary)]">
              {FEATURED.title}
            </span>
          </Link>
        )}

        {/* Button stack */}
        <div className="mt-4 flex flex-col gap-3">
          {LINKS.map((l, i) => {
            const primary = i === 0
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`block rounded-[var(--radius-card)] border px-5 py-4 text-center shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 ${
                  primary
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'
                    : 'border-[var(--color-border-soft)] bg-[var(--color-background)] hover:border-[var(--color-primary)]'
                }`}
              >
                <span className={`block font-ui text-base font-semibold ${primary ? 'text-white' : 'text-[var(--color-primary)]'}`}>
                  {l.label}
                </span>
                {l.sub && (
                  <span className={`mt-0.5 block font-body text-sm ${primary ? 'text-white/85' : 'text-[var(--color-text-secondary)]'}`}>
                    {l.sub}
                  </span>
                )}
              </Link>
            )
          })}
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
