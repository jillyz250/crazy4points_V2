/**
 * Global 404 for the entire app.
 *
 * Must live at app/not-found.tsx (the root) — Next.js only renders
 * a route-group's not-found.tsx for `notFound()` calls from within
 * that group's routes, NOT for truly unmatched URLs. So a file at
 * app/(site)/not-found.tsx wouldn't catch /random-bogus-url. This one
 * does.
 *
 * Imports Header + Footer manually because the root layout (app/layout.tsx)
 * doesn't include them — that's done by app/(site)/layout.tsx, which
 * doesn't wrap unmatched routes.
 *
 * Returns HTTP 404 automatically (Next.js handles the status code for
 * not-found.tsx). Don't redirect unknown URLs to the homepage; that's
 * a "soft 404" that Google penalizes as deceptive.
 */
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { createAdminClient } from "@/utils/supabase/server";
import { getResourceNavCounts } from "@/utils/supabase/queries";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page took a wrong turn at the gate. Let's get you back to the alerts.",
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  // Header needs resourceCounts so the Resources nav dropdown renders correctly.
  // Defensive fallback to zeros if the query fails — we don't want a 404 page
  // to itself fail to render.
  const supabase = createAdminClient();
  const resourceCounts = await getResourceNavCounts(supabase).catch(() => ({
    airline: 0,
    hotel: 0,
    alliance: 0,
    credit_card: 0,
  }));

  return (
    <>
      <Header resourceCounts={resourceCounts} />
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
      <Footer />
    </>
  );
}
