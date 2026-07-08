import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import ChecklistDownloadCard from '@/components/tools/ChecklistDownloadCard'

const PDF_HREF = '/downloads/csr-2026-benefits-checklist.pdf'

export const metadata: Metadata = {
  title: 'Free Chase Sapphire Reserve 2026 Benefits Checklist (Printable PDF)',
  description:
    'A free, fillable, printable checklist of every 2026 Chase Sapphire Reserve benefit — credits, the $75K spend unlocks, dining & ticket trackers, and more. Verified against Chase’s official terms.',
  alternates: { canonical: 'https://www.crazy4points.com/tools/sapphire-reserve-checklist' },
  openGraph: {
    title: 'Free Chase Sapphire Reserve 2026 Benefits Checklist',
    description:
      'Fillable, printable PDF of every 2026 CSR benefit — credits by reset date, the $75K spend unlocks, and dining & ticket trackers.',
    images: ['/images/tools/csr-checklist-p1.png'],
  },
}

const INSIDE: string[] = [
  'A one-time setup list so you never miss an enrollment (StubHub, Peloton, DashPass, IHG status & more)',
  'Every 2026 credit, grouped by when it resets — monthly, twice-a-year, and annual',
  'A dining tracker for the Sapphire Exclusive Tables credit — date, amount, star rating & "loved it?" notes',
  'A tickets tracker for the StubHub & viagogo credit',
  'The $75,000 spend-club unlocks with a progress tracker',
  'An earning cheat-sheet + the full travel & purchase protection suite',
]

const PAGES = [
  { src: '/images/tools/csr-checklist-p1.png', label: 'Page 1 · Setup + credits' },
  { src: '/images/tools/csr-checklist-p2.png', label: 'Page 2 · Dining + ticket trackers' },
  { src: '/images/tools/csr-checklist-p3.png', label: 'Page 3 · Unlocks, perks & protection' },
]

export default function SapphireReserveChecklistPage() {
  return (
    <main className="rg-major-section">
      <div className="rg-container" style={{ maxWidth: '64rem' }}>
        {/* Hero */}
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
              Free printable · Updated 2026
            </span>
            <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
              Chase Sapphire Reserve 2026 Benefits Checklist
            </h1>
            <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">
              You pay $795 a year — use every penny of it. This free, fillable checklist tracks
              every credit, enrollment, and perk so nothing expires unused. Check the boxes on your
              phone, or print it and grab a pen.
            </p>

            <ul className="mt-6 flex flex-col gap-3">
              {INSIDE.map((item) => (
                <li key={item} className="flex items-start gap-3 font-body text-[var(--color-text-primary)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="mt-1 h-5 w-5 shrink-0" aria-hidden>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 font-body text-sm text-[var(--color-text-secondary)]">
              Every number is verified against Chase&rsquo;s official terms (July 2026). Benefits
              change — always confirm at{' '}
              <a href="https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve" className="text-[var(--color-primary)] underline" target="_blank" rel="noopener noreferrer">chase.com</a>.
              Not affiliated with Chase.
            </p>
          </div>

          {/* Download + signup */}
          <div className="lg:sticky lg:top-24">
            <ChecklistDownloadCard
              pdfHref={PDF_HREF}
              downloadName="Chase-Sapphire-Reserve-2026-Checklist.pdf"
              checklistId="chase-sapphire-reserve-2026"
            />
            <p className="mt-3 text-center font-body text-xs text-[var(--color-text-secondary)]">
              3-page PDF · also see the full{' '}
              <Link href="/cards/chase-sapphire-reserve" className="text-[var(--color-primary)] underline">
                Sapphire Reserve card details
              </Link>
            </p>
          </div>
        </div>

        {/* Preview */}
        <section className="rg-sub-section">
          <h2 className="text-center font-display text-2xl font-semibold text-[var(--color-primary)]">
            Peek inside
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {PAGES.map((p) => (
              <figure key={p.src} className="flex flex-col items-center">
                <div className="w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)] shadow-[var(--shadow-soft)]">
                  <Image
                    src={p.src}
                    alt={p.label}
                    width={900}
                    height={1165}
                    className="h-auto w-full"
                    sizes="(max-width: 640px) 100vw, 20rem"
                  />
                </div>
                <figcaption className="mt-3 text-center font-ui text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                  {p.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
