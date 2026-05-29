import Link from "next/link";

// Homepage tool tiles — a 2x2 grid of the site's highest-intent destinations.
// Each tile owns an accent color (applied to the icon chip, the corner glow,
// and the hover border) so the four read as distinct "rooms" rather than a
// uniform card wall. Colors stay inside a palette that coexists with the
// Royal Glow purple/gold rather than fighting it.
type Tool = {
  label: string;
  href: string;
  blurb: string;
  cta: string;
  /** Accent hex — drives icon chip bg, glow, and hover border. */
  accent: string;
  /** Soft tint behind the icon chip. */
  tint: string;
  icon: React.ReactNode;
};

const TOOLS: Tool[] = [
  {
    label: "Decision Engine",
    href: "/decision-engine",
    blurb: "Can't decide where to go? Spin it and let us pick your next redemption.",
    cta: "Spin now",
    accent: "#D4AF37",
    tint: "#FBF4DD",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Alliance Explorer",
    href: "/tools/alliances",
    blurb: "See which airlines partner across Star Alliance, oneworld, and SkyTeam at a glance.",
    cta: "Explore alliances",
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
    blurb: "Browse the cards worth carrying — earn rates, transfer partners, and welcome offers.",
    cta: "Browse cards",
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
    label: "Should I Transfer?",
    href: "/hub/should-i-transfer",
    blurb: "Sitting on points? Find out if transferring beats booking through the portal.",
    cta: "Find out",
    accent: "#6B2D8F",
    tint: "#F1E7F8",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" />
      </svg>
    ),
  },
];

export default function HomeToolsBand() {
  return (
    <section className="border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)] py-12 md:py-16">
      <div className="rg-container px-6 md:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
          <h2 className="font-display text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">
            Tools to plan your next trip
          </h2>
          <p className="mt-3 font-body text-[var(--color-text-secondary)]">
            Four ways to turn the points you have into the trip you want.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <Link
              key={tool.label}
              href={tool.href}
              className="group relative flex flex-col gap-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-6 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              style={{ ["--tool-accent" as string]: tool.accent }}
            >
              {/* Top accent bar — reveals on hover */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
                style={{ background: tool.accent }}
              />
              {/* Corner glow */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-60"
                style={{ background: tool.accent }}
              />

              <span
                aria-hidden
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: tool.tint, color: tool.accent }}
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
                style={{ color: tool.accent }}
              >
                {tool.cta}
                <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
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
