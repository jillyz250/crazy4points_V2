import Link from "next/link";
import type { ExperienceGroup } from "@/lib/experiences/marquee";

// Short, on-brand program labels (source_platform is verbose). Mirrors the
// map in ExperienceCard so a home card reads like one on /experiences.
const PROGRAM_LABEL: Record<string, string> = {
  amex: "Amex",
  hyatt: "World of Hyatt",
  citi: "Citi",
  atmos: "Atmos Rewards",
  delta: "Delta SkyMiles",
  accor: "ALL Accor",
  "marriott-bonvoy": "Marriott Bonvoy",
  united: "United MileagePlus",
  chase: "Chase",
  hilton: "Hilton Honors",
  choice: "Choice Privileges",
  "flying-blue": "Flying Blue",
  wyndham: "Wyndham Rewards",
};

function programLabel(g: ExperienceGroup): string {
  return (g.program_slug && PROGRAM_LABEL[g.program_slug]) || g.source_platform || "Points program";
}

// Points-forward one-liner + a Book/Bid tag, no derived math.
function priceLine(g: ExperienceGroup): { label: string; tag: string } {
  if (g.fromPoints != null) return { label: `From ${g.fromPoints.toLocaleString("en-US")} points`, tag: "Book" };
  if (g.isAuction) return { label: "Bid with points", tag: "Bid" };
  return { label: "Redeem or bid", tag: "View" };
}

// A "glass" preview card: hero photo + program + title + points/bid + tag.
function GlassCard({ group }: { group: ExperienceGroup }) {
  const label = programLabel(group);
  const price = priceLine(group);
  const href = group.packages.find((p) => p.detail_url)?.detail_url ?? "/experiences";
  const external = href.startsWith("http");

  const inner = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {/* External hero image — plain <img> (same as /experiences cards). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={group.image_url as string}
          alt={group.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        {group.category && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 font-ui text-[0.6rem] uppercase tracking-wide text-white backdrop-blur-sm">
            {group.category}
          </span>
        )}
      </div>
      <div className="flex grow flex-col gap-1 p-3">
        <p className="font-ui text-[0.65rem] uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</p>
        <h3 className="line-clamp-2 font-display text-[0.95rem] leading-snug text-[var(--color-primary)]">{group.title}</h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-ui text-xs font-semibold text-[var(--color-primary)]">{price.label}</span>
          <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 font-ui text-[0.6rem] font-bold uppercase tracking-wide text-white">
            {price.tag}
          </span>
        </div>
      </div>
    </>
  );

  const cls =
    "group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-white/60 bg-white/60 shadow-[0_8px_20px_-8px_rgba(74,32,95,0.22)] ring-1 ring-[var(--color-border-soft)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1";

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

/**
 * Homepage "Experience Finder" block — the one image-forward resource block.
 * Three real, photographed listings inside a tinted glass panel, with a CTA to
 * the full finder. Renders nothing if we have no photographed listings.
 */
export default function HomeExperiencesBlock({ groups }: { groups: ExperienceGroup[] }) {
  if (!groups.length) return null;
  return (
    <section className="bg-[var(--color-background-soft)] py-12 md:py-16">
      <div className="rg-container px-6 md:px-8">
        <div
          className="mx-auto max-w-5xl overflow-hidden rounded-[calc(var(--radius-card)+4px)] border border-[var(--color-border-soft)] p-6 shadow-[0_1px_2px_rgba(26,26,26,0.04),0_18px_40px_-20px_rgba(74,32,95,0.28)] md:p-8"
          style={{ background: "linear-gradient(160deg, #F1E7F8 0%, var(--color-background) 70%)" }}
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="font-ui text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                Experience Finder
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">
                Money can&apos;t buy it. Points can.
              </h2>
              <p className="mt-2 font-body text-[var(--color-text-secondary)]">
                Find real-world experiences your points unlock: concerts, sports, chef&apos;s tables, VIP trips. Redeem points outright, or bid on them in an auction.
              </p>
            </div>
            <Link
              href="/experiences"
              className="rg-tap-target inline-flex items-center gap-1 rounded-[var(--radius-ui)] px-4 font-ui text-sm font-semibold text-[var(--color-primary)] ring-1.5 ring-inset ring-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
              style={{ minHeight: 44, boxShadow: "inset 0 0 0 1.5px var(--color-primary)" }}
            >
              Explore all <span aria-hidden>&rarr;</span>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {groups.map((g) => (
              <GlassCard key={g.key} group={g} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
