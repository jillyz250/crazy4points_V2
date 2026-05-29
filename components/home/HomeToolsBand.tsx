import Link from "next/link";

// Homepage tool tiles — the 4 Tier-1 tools (each takes YOUR input and computes
// a personal answer). Colors match the "Tools" dropdown dots 1:1 so a tool
// reads the same wherever it appears. Each tile owns an accent that drives the
// solid icon chip, the gradient wash, the hover ring, and the colored glow —
// so the four read as distinct, premium "rooms" rather than a flat card wall.
type Tool = {
  label: string;
  href: string;
  blurb: string;
  cta: string;
  /** Accent hex — drives icon chip, wash, hover ring, glow. */
  accent: string;
  /** Soft tint for the gradient wash behind the tile. */
  tint: string;
  comingSoon?: boolean;
  icon: React.ReactNode;
};

const TOOLS: Tool[] = [
  {
    label: "Best Way to Book It",
    href: "/hub/best-way-to-book",
    blurb: "Punch in a route — JFK to HNL — and we'll show you every smart way to book it, sorted by miles with the catch up front.",
    cta: "Find the route",
    accent: "#6B2D8F",
    tint: "#F1E7F8",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    label: "Where Can My Points Take Me?",
    href: "/hub/where-can-i-go",
    blurb: "Tell us your balance — we'll show you the trips you can actually book right now.",
    cta: "See destinations",
    accent: "#2563EB",
    tint: "#E5EDFD",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.9 6 4 9-.1 3-1.5 6.4-4 9-2.5-2.6-3.9-6-4-9 .1-3 1.5-6.4 4-9z" />
      </svg>
    ),
  },
  {
    label: "Compare Credit Cards",
    href: "/programs?type=credit_card",
    blurb: "Put two cards head-to-head — earn rates, transfer partners, and welcome offers, side by side.",
    cta: "Compare cards",
    accent: "#059669",
    tint: "#DEF4EC",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M2.5 9.5h19M6 14.5h4" />
      </svg>
    ),
  },
  {
    label: "Will My Free Night Cert Fit?",
    href: "/hub/fnc-fit",
    blurb: "Got a free night certificate? Check whether it covers the hotel you actually want.",
    cta: "Coming soon",
    accent: "#D4AF37",
    tint: "#FBF4DD",
    comingSoon: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M3 18v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5M3 18v2M21 18v2M3 13V7a2 2 0 0 1 2-2h6v6" />
      </svg>
    ),
  },
];

function TileInner({ tool }: { tool: Tool }) {
  return (
    <>
      {/* Always-on accent bar at top; grows full-bleed on hover */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 origin-left scale-x-[0.18] opacity-80 transition-transform duration-200 group-hover:scale-x-100"
        style={{ background: tool.accent }}
      />
      {/* Corner glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-50"
        style={{ background: tool.accent }}
      />

      <span
        aria-hidden
        className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105"
        style={{ background: tool.accent }}
      >
        {tool.icon}
      </span>

      <h3 className="font-display text-lg font-semibold text-[var(--color-primary)]">
        {tool.label}
      </h3>
      <p className="font-body text-sm text-[var(--color-text-secondary)]">
        {tool.blurb}
      </p>
      <span
        className="mt-auto inline-flex items-center gap-1 pt-1 font-ui text-xs font-semibold uppercase tracking-[0.1em]"
        style={{ color: tool.comingSoon ? "var(--color-text-secondary)" : tool.accent }}
      >
        {tool.cta}
        {!tool.comingSoon && (
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
            &rarr;
          </span>
        )}
      </span>
    </>
  );
}

export default function HomeToolsBand() {
  return (
    <section className="border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)] py-12 md:py-16">
      <div className="rg-container px-6 md:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
          <h2 className="font-display text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">
            Tools to plan your next trip
          </h2>
          <p className="mt-3 font-body text-[var(--color-text-secondary)]">
            Tell them what you've got — they'll do the thinking and hand back an answer.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => {
            const baseClass =
              "group relative flex flex-col gap-3 overflow-hidden rounded-[var(--radius-card)] border border-white/60 p-6 shadow-[0_1px_2px_rgba(26,26,26,0.04),0_8px_24px_-12px_rgba(26,26,26,0.18),inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-[var(--color-border-soft)] transition-all duration-300 will-change-transform";
            const wash = {
              background: `linear-gradient(135deg, ${tool.tint} 0%, var(--color-background) 62%)`,
            } as React.CSSProperties;

            return tool.comingSoon ? (
              <div
                key={tool.label}
                className={`${baseClass} cursor-default opacity-80`}
                style={wash}
                aria-label={`${tool.label} (coming soon)`}
              >
                <span className="absolute right-4 top-4 z-10 rounded-full bg-white/80 px-2 py-0.5 font-ui text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)] shadow-sm">
                  Coming Soon
                </span>
                <TileInner tool={tool} />
              </div>
            ) : (
              <Link
                key={tool.label}
                href={tool.href}
                className={`${baseClass} hover:-translate-y-1.5 hover:shadow-[0_2px_4px_rgba(26,26,26,0.05),0_24px_40px_-16px_rgba(26,26,26,0.28),inset_0_1px_0_rgba(255,255,255,0.8)]`}
                style={wash}
              >
                <TileInner tool={tool} />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
