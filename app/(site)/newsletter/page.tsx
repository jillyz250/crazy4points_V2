import NewsletterSignup from '@/components/home/NewsletterSignup'

export const metadata = {
  title: 'Newsletter | crazy4points',
  description: 'Subscribe to the Crazy4Points newsletter — the latest travel rewards offers, points deals, and bonuses delivered to your inbox.',
}

export default function NewsletterPage() {
  return (
    <main className="rg-major-section">
      <div className="rg-container px-6 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-semibold text-[var(--color-primary)]">
            Stay in the Loop
          </h1>
          <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">
            Subscribe for the latest travel rewards offers, points deals, and bonuses — curated and delivered to your inbox.
          </p>
        </div>
        <div className="mt-12">
          <NewsletterSignup />
        </div>
      </div>
    </main>
  )
}
