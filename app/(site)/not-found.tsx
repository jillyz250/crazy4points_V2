/**
 * (site)-scoped 404. Triggered when a page inside the (site) route group
 * calls notFound() (e.g. /programs/[unknown-slug] or /alerts/[unknown]).
 *
 * Does NOT render Header/Footer — app/(site)/layout.tsx already wraps
 * this with both. Rendering them again here was the cause of the double-
 * header bug. The root app/not-found.tsx still renders its own Header
 * because it catches truly unmatched URLs that don't pass through any
 * route group's layout.
 */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page took a wrong turn at the gate. Let's get you back to the alerts.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex-1">
      <section className="bg-gradient-to-br from-[var(--color-background-soft)] via-white to-[var(--color-background-soft)] py-16 md:py-24">
        <div className="rg-container px-6 md:px-8">
          <div className="mx-auto flex max-w-2xl flex-col items-center space-y-6 text-center md:space-y-8">
            <p className="font-ui text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-primary)]">
              404 · Lost luggage
            </p>

            <h1 className="font-display text-4xl leading-[1.1] text-[var(--color-primary)] md:text-5xl lg:text-6xl">
              Lost luggage.
            </h1>

            <p className="max-w-xl font-body text-lg text-[var(--color-text-secondary)] md:text-xl">
              The page you&rsquo;re looking for didn&rsquo;t make it to baggage claim.
              Let&rsquo;s get you back to the alerts &mdash; that&rsquo;s where everything actually lands.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/alerts"
                className="inline-flex items-center rounded-md bg-[var(--color-accent)] px-7 py-3.5 font-ui text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)] shadow-sm transition hover:bg-[#c49f2f] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              >
                See active alerts →
              </Link>
              <Link
                href="/"
                className="inline-flex items-center rounded-md border border-[var(--color-primary)] px-7 py-3.5 font-ui text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              >
                Back to home
              </Link>
            </div>

            <div className="pt-6">
              <p className="font-ui text-xs uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
                Or browse by program
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-body text-sm">
                <Link href="/programs?type=airline" className="text-[var(--color-primary)] underline-offset-4 hover:underline">
                  Airlines
                </Link>
                <Link href="/programs?type=hotel" className="text-[var(--color-primary)] underline-offset-4 hover:underline">
                  Hotels
                </Link>
                <Link href="/programs?type=credit_card" className="text-[var(--color-primary)] underline-offset-4 hover:underline">
                  Credit cards
                </Link>
                <Link href="/blog" className="text-[var(--color-primary)] underline-offset-4 hover:underline">
                  Blog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
