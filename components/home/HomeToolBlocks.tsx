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
              className="mt-5 inline-flex min-h-[46px] items-center gap-2 rounded-[10px] px-5 font-ui text-sm font-bold text-white transition hover:brightness-110"
              style={{ background: accent, boxShadow: `0 8px 20px -6px ${accent}` }}
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

// ── Decision Engine visual — fanned real destination photos ─────────────────
function DestCard({ d, pos, spin }: { d: DestPreview; pos: string; spin?: boolean }) {
  return (
    <div className={`absolute aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_18px_36px_-12px_rgba(0,0,0,0.45)] ring-1 ring-black/5 ${pos}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={d.image_url} alt={d.title} loading="eager" decoding="async" className="h-full w-full object-cover" />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      {spin && (
        <span className="absolute right-2 top-2 rounded-full bg-white px-2.5 py-0.5 font-ui text-[0.55rem] font-bold uppercase tracking-wide text-[var(--color-primary)] shadow">
          Spin
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <p className="line-clamp-1 font-display text-sm font-bold leading-tight text-white drop-shadow">{d.title}</p>
        {d.country && <p className="font-ui text-[0.6rem] font-semibold uppercase tracking-wide text-[#F0D488]">{d.country}</p>}
      </div>
    </div>
  );
}
function DecisionEngineVisual({ destinations }: { destinations: DestPreview[] }) {
  const [a, b, c] = destinations;
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-[420px] overflow-hidden">
      {a && <DestCard d={a} pos="left-[2%] top-[6%] w-[56%] -rotate-[7deg] opacity-80" />}
      {b && <DestCard d={b} pos="right-[2%] top-[0%] w-[56%] rotate-[6deg] opacity-90" />}
      {c && <DestCard d={c} pos="bottom-[3%] left-1/2 w-[60%] -translate-x-1/2 rotate-[1deg] z-10" spin />}
    </div>
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
const ALLIANCES = [
  { name: "oneworld", members: "AA · BA · Qatar", grad: "linear-gradient(150deg,#b3122a,#7a0c1c)", mark: "◉" },
  { name: "SkyTeam", members: "Delta · AF · KLM", grad: "linear-gradient(150deg,#0a4ea2,#062f63)", mark: "◈" },
  { name: "Star Alliance", members: "United · ANA · Lufthansa", grad: "linear-gradient(150deg,#0f2a5c,#c99a1e)", mark: "✦" },
];
function AllianceVisual() {
  return (
    <div className="mx-auto grid max-w-[420px] grid-cols-3 gap-2.5 md:gap-3">
      {ALLIANCES.map((a) => (
        <div key={a.name} className="flex flex-col items-center rounded-2xl p-4 text-center text-white shadow-[0_14px_28px_-10px_rgba(0,0,0,0.4)]" style={{ background: a.grad }}>
          <span aria-hidden className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/40 bg-white/15 text-lg">{a.mark}</span>
          <span className="font-display text-[0.9rem] font-bold leading-tight">{a.name}</span>
          <span className="mt-1 font-ui text-[0.6rem] opacity-85">{a.members}</span>
        </div>
      ))}
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
          <div className="text-white">
            <p className="font-display text-lg font-semibold">Free points &amp; miles giveaways</p>
            <p className="font-body text-sm text-white/85">Airlines, hotels, and banks, refreshed daily. Enter the live ones before they close.</p>
          </div>
          <Link
            href="/sweepstakes"
            className="inline-flex min-h-[46px] shrink-0 items-center gap-2 rounded-[10px] bg-white px-5 font-ui text-sm font-bold text-[#0E7490] transition hover:brightness-95"
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
  destinations, cards,
}: {
  destinations: DestPreview[];
  cards: CardPreview[];
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
        eyebrow="Alliance Explorer" accent="#6B2D8F" bg="paper"
        title="Know your alliance."
        copy="oneworld, SkyTeam, and Star Alliance, side by side: tier ladders, lounge access, and status equivalency at a glance, so you know what your status is really worth."
        ctaLabel="Explore alliances" ctaHref="/tools/alliances"
      >
        <AllianceVisual />
      </ToolShowcase>
    </>
  );
}
