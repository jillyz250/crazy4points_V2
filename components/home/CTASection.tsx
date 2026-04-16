import NewsletterSignup from './NewsletterSignup'

export default function CTASection() {
  return (
    <section className="bg-[var(--color-background-soft)] py-20">
      <div className="rg-container px-6 md:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold text-[var(--color-primary)]">
            Never Miss a Deal
          </h2>
          <p className="mt-3 font-body text-[var(--color-text-secondary)]">
            Get the best travel rewards alerts delivered to your inbox every morning.
          </p>
        </div>
        <div className="mt-8">
          <NewsletterSignup />
        </div>
      </div>
    </section>
  )
}
