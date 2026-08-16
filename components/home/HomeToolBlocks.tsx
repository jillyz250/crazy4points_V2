import Link from "next/link";
import type { DestPreview, CardPreview } from "@/utils/home/getHomeToolPreviews";

// ── shared showcase wrapper ─────────────────────────────────────────────────
function ToolShowcase({
  eyebrow, accent, title, copy, ctaLabel, ctaHref, bg, reverse, children,
}: {
  eyebrow: string; accent: string; title: string; copy: string; ctaLabel: string; ctaHref: string;
  bg: "paper" | "soft"; reverse?: boolean; children: React.ReactNode;
}) {
  return (
    <section className={`${bg === "soft" ? "bg-[var(--color-background-soft)]" : "bg-[var(--color-background)]"} py-12 md:py-16`}>
      <div className="rg-container px-6 md:px-8">
        <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className={reverse ? "md:order-2" : ""}>
            <p className="font-ui text-xs font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>{eyebrow}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">{title}</h2>
            <p className="mt-2 max-w-md font-body text-[var(--color-text-secondary)]">{copy}</p>
            <Link
              href={ctaHref}
              className="mt-5 inline-flex min-h-[46px] items-center gap-2 rounded-[10px] px-5 font-ui text-sm font-bold transition hover:brightness-110"
              style={{ background: accent, color: "#ffffff", boxShadow: `0 8px 20px -6px ${accent}` }}
            >
              {ctaLabel} <span aria-hidden>&rarr;</span>
            </Link>
          </div>
          <div className={reverse ? "md:order-1" : ""}>{children}</div>
        </div>
      </div>
    </section>
  );
}

// ── Decision Engine visual — a slot machine whose reels are real destinations.
// The slot-machine metaphor makes the "spin for a trip idea" tool obvious.
function DecisionEngineVisual({ destinations }: { destinations: DestPreview[] }) {
  const reels = destinations.slice(0, 3);
  return (
    <Link
      href="/decision-engine"
      aria-label="Spin the Decision Engine for a points-trip idea"
      className="group relative mx-auto block w-full max-w-[380px] pr-6"
    >
      {/* pull lever */}
      <span aria-hidden className="absolute right-1 top-7 z-20 flex flex-col items-center">
        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-[#ff6a6a] to-[#c81e1e] shadow-md ring-2 ring-white/70 transition-transform duration-300 group-hover:translate-y-2" />
        <span className="h-14 w-1.5 rounded-full bg-gradient-to-b from-[#d1d5db] to-[#8a8f98]" />
      </span>
      {/* machine body */}
      <div className="rounded-[20px] p-3 shadow-[0_22px_44px_-16px_rgba(74,32,95,0.55)]" style={{ background: "linear-gradient(160deg,#7d3aa3,#54276e)" }}>
        <div
          className="mb-2 rounded-lg py-1.5 text-center font-ui text-[0.62rem] font-extrabold uppercase tracking-[0.22em] text-[#3a2606]"
          style={{ background: "linear-gradient(135deg,#f7e08c,#d0a43a)" }}
        >
          Where to next?
        </div>
        <div className="grid grid-cols-3 gap-2">
          {reels.map((d, i) => (
            <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-lg ring-2 ring-white/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.image_url} alt={d.title} loading="eager" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 line-clamp-1 p-1 text-center font-ui text-[0.5rem] font-bold uppercase tracking-wide text-white">{d.title}</span>
            </div>
          ))}
        </div>
        {/* payline */}
        <div className="mx-auto mt-2 h-1 w-3/4 rounded-full" style={{ background: "linear-gradient(90deg,transparent,#f7e08c,transparent)" }} />
      </div>
    </Link>
  );
}

// ── Card Explorer visual — fanned issuer-colored mini cards ──────────────────
const ISSUER_GRAD: Record<string, string> = {
  Chase: "linear-gradient(135deg,#2166a8,#0b365e)",
  "American Express": "linear-gradient(135deg,#2b2f36,#14171c)",
  Citi: "linear-gradient(135deg,#0a4ea2,#062f63)",
  "Capital One": "linear-gradient(135deg,#004977,#c8102e)",
  Barclays: "linear-gradient(135deg,#0075c9,#004a80)",
  "Bank of America": "linear-gradient(135deg,#012169,#9b1b2f)",
  "US Bank": "linear-gradient(135deg,#0c2074,#1746a2)",
  "Wells Fargo": "linear-gradient(135deg,#b31b30,#7a1220)",
  Bilt: "linear-gradient(135deg,#2b2b30,#141416)",
};
function issuerGrad(n: string): string {
  return ISSUER_GRAD[n] ?? "linear-gradient(135deg,#6B2D8F,#48205F)";
}
function MiniCard({ c, pos }: { c: CardPreview; pos: string }) {
  return (
    <div
      className={`absolute flex aspect-[1.6/1] w-[60%] flex-col justify-between rounded-xl p-3 text-white shadow-[0_18px_34px_-12px_rgba(0,0,0,0.45)] ${pos}`}
      style={{ background: issuerGrad(c.issuer) }}
    >
      <div className="flex items-center justify-between">
        <span aria-hidden className="h-5 w-7 rounded-[3px] bg-gradient-to-br from-[#f4d78a] to-[#b8912f]" />
        {c.network && <span className="font-ui text-[0.6rem] font-bold uppercase tracking-wide opacity-90">{c.network}</span>}
      </div>
      <div>
        <p className="line-clamp-1 font-display text-[0.82rem] font-bold leading-tight">{c.name}</p>
        {c.currency && <p className="font-ui text-[0.55rem] font-semibold text-[#F0D488]">{c.currency}</p>}
      </div>
    </div>
  );
}
function CardExplorerVisual({ cards }: { cards: CardPreview[] }) {
  const [a, b, c] = cards;
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-[420px] overflow-hidden">
      {a && <MiniCard c={a} pos="left-[3%] top-[8%] -rotate-[7deg] opacity-90" />}
      {b && <MiniCard c={b} pos="bottom-[6%] left-1/2 w-[62%] -translate-x-1/2 rotate-[2deg] z-10" />}
      {c && <MiniCard c={c} pos="right-[3%] top-[4%] rotate-[7deg] opacity-90" />}
    </div>
  );
}

// ── Alliance Explorer visual — 3 alliance tiles (verified members) ───────────
// Crisp drawn emblems (generic geometry, not the copyrighted alliance marks) —
// sharp at any size, unlike the low-res favicons.
const EMBLEMS = {
  rings: (
    <svg viewBox="0 0 40 40" width="34" height="34" fill="none" stroke="currentColor" strokeWidth={3.2}>
      <circle cx="20" cy="20" r="15" />
      <circle cx="20" cy="20" r="6" fill="currentColor" stroke="none" />
    </svg>
  ),
  diamond: (
    <svg viewBox="0 0 40 40" width="34" height="34" fill="none" stroke="currentColor" strokeWidth={3.2}>
      <path d="M20 5 L34 20 L20 35 L6 20 Z" />
      <path d="M20 13 L27 20 L20 27 L13 20 Z" fill="currentColor" stroke="none" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 40 40" width="34" height="34" fill="currentColor">
      <path d="M20 3.5 l4.94 10.6 11.66 1.2 -8.7 7.8 2.48 11.45 -10.38 -6.02 -10.38 6.02 2.48 -11.45 -8.7 -7.8 11.66 -1.2 Z" />
    </svg>
  ),
};
const ALLIANCES = [
  { name: "oneworld", members: "AA · BA · Qatar", slug: "oneworld", c1: "#d0102e", c2: "#8f0a1f", emblem: EMBLEMS.rings },
  { name: "SkyTeam", members: "Delta · AF · KLM", slug: "skyteam", c1: "#1a56a8", c2: "#0d2f63", emblem: EMBLEMS.diamond },
  { name: "Star Alliance", members: "United · ANA · LH", slug: "star-alliance", c1: "#1c3f7a", c2: "#0b1f42", emblem: EMBLEMS.star },
];
function AllianceVisual({ members }: { members: Record<string, string[]> }) {
  return (
    <div className="mx-auto grid max-w-[460px] grid-cols-3 gap-2.5 md:gap-3">
      {ALLIANCES.map((a) => {
        const list = members[a.slug] ?? [];
        return (
          <div key={a.name} className="group [perspective:900px]">
            <Link
              href={`/tools/alliances#${a.slug}`}
              aria-label={`${a.name}: ${list.length} member airlines. Open in the Alliance Explorer.`}
              className="relative block h-[176px] w-full rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.12),0_12px_24px_-10px_rgba(0,0,0,0.4)] transition-transform duration-500 md:h-[216px] [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus-within:[transform:rotateY(180deg)] motion-reduce:transition-none motion-reduce:group-hover:[transform:none]"
            >
              {/* FRONT */}
              <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-[var(--color-background)] [backface-visibility:hidden]">
                <div className="relative flex h-[74px] shrink-0 items-center justify-center" style={{ background: `linear-gradient(150deg, ${a.c1}, ${a.c2})` }}>
                  <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.05) 42%, rgba(0,0,0,0.14) 100%)" }} />
                  <span className="relative text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">{a.emblem}</span>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
                  <p className="font-display text-[0.85rem] font-bold leading-tight" style={{ color: "var(--color-primary)" }}>{a.name}</p>
                  <p className="mt-1 font-ui text-[0.56rem] leading-tight" style={{ color: "var(--color-text-secondary)" }}>{a.members}</p>
                  <p className="mt-1.5 font-ui text-[0.5rem] font-semibold uppercase tracking-wide" style={{ color: a.c1 }}>{list.length} airlines</p>
                </div>
              </div>
              {/* BACK — just the member airlines */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]" style={{ background: `linear-gradient(150deg, ${a.c1}, ${a.c2})` }}>
                <ul className="h-full columns-2 gap-x-2 px-2.5 py-3 text-[0.58rem] font-medium leading-[1.3] text-white">
                  {list.map((m) => (
                    <li key={m} className="mb-[2px] break-inside-avoid">{m}</li>
                  ))}
                </ul>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

// ── Sweepstakes CTA strip (no rich preview -> a compact banner) ──────────────
export function HomeSweepstakesCTA() {
  return (
    <section className="bg-[var(--color-background)] pb-12 md:pb-16">
      <div className="rg-container px-6 md:px-8">
        <div
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] p-5 shadow-[0_14px_30px_-14px_rgba(14,116,144,0.55)] md:p-6"
          style={{ background: "linear-gradient(120deg,#0E7490,#0b5563)" }}
        >
          <div>
            <p className="font-display text-lg font-semibold" style={{ color: "#ffffff" }}>Free points &amp; miles giveaways</p>
            <p className="font-body text-sm" style={{ color: "rgba(255,255,255,0.88)" }}>Airlines, hotels, and banks, refreshed daily. Enter the live ones before they close.</p>
          </div>
          <Link
            href="/sweepstakes"
            className="inline-flex min-h-[46px] shrink-0 items-center gap-2 rounded-[10px] bg-white px-5 font-ui text-sm font-bold transition hover:brightness-95"
            style={{ color: "#0E7490" }}
          >
            See giveaways <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── the three tool showcase blocks ──────────────────────────────────────────
export default function HomeToolBlocks({
  destinations, cards, allianceMembers,
}: {
  destinations: DestPreview[];
  cards: CardPreview[];
  allianceMembers: Record<string, string[]>;
}) {
  return (
    <>
      <ToolShowcase
        eyebrow="Decision Engine" accent="#B8912F" bg="paper"
        title="Not sure where to go? Let us pick."
        copy="Spin for a points-trip idea, wide open or filtered to the points you already have. A fast nudge when you want to travel but don't know where."
        ctaLabel="Spin it" ctaHref="/decision-engine"
      >
        <DecisionEngineVisual destinations={destinations} />
      </ToolShowcase>

      <ToolShowcase
        eyebrow="Card Explorer" accent="#059669" bg="soft" reverse
        title="Find your next card in minutes."
        copy="Browse every card, filter by the perks you actually want, and compare up to three side by side. See which points each one earns before you apply."
        ctaLabel="Explore cards" ctaHref="/cards"
      >
        <CardExplorerVisual cards={cards} />
      </ToolShowcase>

      <ToolShowcase
        eyebrow="Alliance Explorer" accent="#8B3FB0" bg="paper"
        title="Know your alliance."
        copy="oneworld, SkyTeam, and Star Alliance, side by side: tier ladders, lounge access, and status equivalency at a glance, so you know what your status is really worth."
        ctaLabel="Explore alliances" ctaHref="/tools/alliances"
      >
        <AllianceVisual members={allianceMembers} />
      </ToolShowcase>
    </>
  );
}
