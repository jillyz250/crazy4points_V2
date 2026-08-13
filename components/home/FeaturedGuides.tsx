import Link from "next/link";
import { GUIDES } from "@/lib/guides";

/**
 * Homepage featured-guides band. Driven by lib/guides.ts (featured flag), so
 * marking a guide `featured: true` in the registry surfaces it here, on
 * /start-here, and on the /guides hub with no extra wiring. Capped at 4 so the
 * homepage stays a scannable band; the full library is one click via
 * "Browse all guides".
 */
export default function FeaturedGuides() {
  const featured = GUIDES.filter((g) => g.featured).slice(0, 4);
  if (featured.length === 0) return null;

  return (
    <section className="bg-[var(--color-background-soft)] py-12 md:py-16">
      <div className="rg-container px-6 md:px-8">
        <div className="mb-7 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--color-primary)] md:text-2xl">
              Guides to get you started
            </h2>
            <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">
              Plain-English playbooks for getting more out of your points.
            </p>
          </div>
          <Link
            href="/guides"
            className="shrink-0 font-ui text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)]"
          >
            Browse all guides &rarr;
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {featured.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="group flex flex-col gap-1.5 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--color-primary)_40%,transparent)]"
            >
              <span className="font-display text-base font-semibold text-[var(--color-primary)]">
                {g.title}
              </span>
              <span className="font-body text-sm text-[var(--color-text-secondary)]">
                {g.description}
              </span>
              <span className="mt-1 font-ui text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)]">
                Read{" "}
                <span aria-hidden className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                  &rarr;
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
