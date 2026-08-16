import Link from "next/link";
import { GUIDES, type GuideCategoryKey } from "@/lib/guides";

// Per-category accent so a guide is color-coded to its topic — richer and
// clearer than a wall of identical white cards.
const CAT: Record<GuideCategoryKey, { accent: string; tint: string; label: string }> = {
  "getting-started": { accent: "#6B2D8F", tint: "#F1E7F8", label: "Getting started" },
  airlines: { accent: "#0E7490", tint: "#DBEFF3", label: "Airlines" },
  hotels: { accent: "#B8912F", tint: "#FBF4DD", label: "Hotels" },
  cards: { accent: "#059669", tint: "#DEF4EC", label: "Cards" },
};

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
          {featured.map((g) => {
            const cat = CAT[g.category];
            return (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="group relative flex flex-col gap-2 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)] p-5 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgba(26,26,26,0.05),0_20px_36px_-16px_rgba(26,26,26,0.26)]"
                style={{ background: `linear-gradient(150deg, ${cat.tint} 0%, var(--color-background) 58%)` }}
              >
                {/* accent bar — grows full-bleed on hover */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 origin-left scale-x-[0.18] opacity-80 transition-transform duration-200 group-hover:scale-x-100"
                  style={{ background: cat.accent }}
                />
                <span
                  className="self-start rounded-full px-2.5 py-0.5 font-ui text-[0.6rem] font-bold uppercase tracking-wide text-white"
                  style={{ background: cat.accent }}
                >
                  {cat.label}
                </span>
                <span className="font-display text-base font-semibold text-[var(--color-primary)]">
                  {g.title}
                </span>
                <span className="font-body text-sm text-[var(--color-text-secondary)]">
                  {g.description}
                </span>
                <span
                  className="mt-auto pt-1 font-ui text-xs font-semibold uppercase tracking-[0.1em]"
                  style={{ color: cat.accent }}
                >
                  Read{" "}
                  <span aria-hidden className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                    &rarr;
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
