import type { Metadata } from "next";
import { safeJsonLd } from "@/lib/jsonLd";

export const metadata: Metadata = {
  title: "How We Verify Our Data",
  description:
    "How crazy4points checks every points-and-miles fact: official sources first, corroborated with other reputable current sources, every figure confirmed more than once, and dated so you can see how fresh it is.",
};

// Reader-facing trust page. Also a citability signal for AI answer engines: an
// accountable, sourced, dated page is far more likely to be attributed than an
// anonymous one. Every principle here is the ritual's real practice, not aspiration.
const PRINCIPLES: { heading: string; body: string }[] = [
  {
    heading: "We go to the official source whenever possible.",
    body: "For a fact about a program or card, a transfer ratio, an annual fee, a welcome bonus, a fee change, we start with the company that actually sets it: the airline, hotel, bank, or loyalty program's own page. That is the source of truth, and it is where we look first.",
  },
  {
    heading: "When the official page does not tell the whole story, we corroborate.",
    body: "Official pages are sometimes incomplete, out of date, or slow to reflect a change. When that happens, we confirm the fact against other reputable, current sources and look for agreement before we publish. We weigh what the sources say. We do not repeat a single unverified claim.",
  },
  {
    heading: "Every specific figure gets checked more than once.",
    body: "A fee, a percentage, a date, a threshold, the details people actually act on, are confirmed against the official page and at least one independent, current source before they go live. One source is never enough on its own.",
  },
  {
    heading: "Our pages are dated, and we re-check them.",
    body: "Program and card pages carry a last-updated date so you can see how fresh the information is, and we re-verify them on a regular schedule and whenever something changes.",
  },
  {
    heading: "If we cannot verify it, we leave it out.",
    body: "We would rather publish less than publish something we are not sure about. We do not guess, and we do not fill gaps with estimates dressed up as facts.",
  },
  {
    heading: "Found something wrong? Tell us.",
    body: "Programs change constantly, and if we have missed one, we want to fix it fast. Reach out and we will check it against the source and update the page.",
  },
];

export default function HowWeVerifyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "How We Verify Our Data",
    url: "https://www.crazy4points.com/how-we-verify",
    inLanguage: "en-US",
    description:
      "crazy4points verifies points-and-miles facts with official sources first, corroborated with other reputable current sources, every figure confirmed more than once, and dated for freshness.",
    isPartOf: { "@id": "https://www.crazy4points.com/#website" },
    publisher: { "@id": "https://www.crazy4points.com/#organization" },
  };

  return (
    <section className="rg-major-section !pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <div className="rg-container">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-4xl font-bold text-[var(--color-primary)] md:text-5xl">
            How We Verify Our Data
          </h1>

          <p className="mt-6 font-body text-base leading-relaxed text-[var(--color-text-primary)]">
            Points and miles move fast, and bad information is everywhere. Programs change transfer ratios, quietly devalue award charts, and rebrand overnight. So before we publish a number, a deadline, or a benefit, we check it. Here is how.
          </p>

          <div className="mt-10 flex flex-col gap-8">
            {PRINCIPLES.map((p) => (
              <div key={p.heading}>
                <h2 className="font-display text-xl font-bold text-[var(--color-primary)]">
                  {p.heading}
                </h2>
                <p className="mt-2 font-body text-base leading-relaxed text-[var(--color-text-primary)]">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
