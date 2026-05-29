import Link from "next/link";

const TOOLS: { label: string; href: string; blurb: string }[] = [
  {
    label: "The Points Hub",
    href: "/hub",
    blurb: "Should I transfer? Where can my points go? Interactive guides that answer the real questions.",
  },
  {
    label: "Decision Engine",
    href: "/decision-engine",
    blurb: "Can't decide where to go? Spin it and let us pick your next redemption for you.",
  },
  {
    label: "Alliance Explorer",
    href: "/tools/alliances",
    blurb: "See which airlines partner across Star Alliance, oneworld, and SkyTeam at a glance.",
  },
];

export default function HomeToolsBand() {
  return (
    <section className="border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)] py-12 md:py-16">
      <div className="rg-container px-6 md:px-8">
        <h2 className="mb-8 text-center font-display text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">
          Tools to plan your next trip
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.label}
              href={tool.href}
              className="group flex flex-col gap-2 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-6 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-md"
            >
              <h3 className="font-display text-lg font-semibold text-[var(--color-primary)] underline decoration-1 underline-offset-4 decoration-[var(--color-border-soft)] group-hover:decoration-[var(--color-primary)]">
                {tool.label}
              </h3>
              <p className="font-body text-sm text-[var(--color-text-secondary)]">
                {tool.blurb}
              </p>
              <span className="mt-auto pt-2 font-ui text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)]">
                Explore &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
