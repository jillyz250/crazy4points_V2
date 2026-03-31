import Link from "next/link";
import type { Metadata } from "next";

// Static placeholder data — will be replaced by Sanity queries in Phase 2
const destination = {
  name: "Tokyo",
  country: "Japan",
  region: "Asia Pacific",
  slug: "tokyo-japan",
  tagline: "One of the world's great cities — and one of its best award redemptions.",
  description: `Tokyo is a city that rewards every kind of traveler. From the chaos of Shibuya to the stillness of Senso-ji, it's a place that defies easy description. For points travelers, it's also one of the most compelling destinations in the world.

The ANA business class sweet spot via Virgin Atlantic remains one of the best values in award travel — 47,500 Virgin Points for a one-way business class ticket. Hyatt properties in Tokyo range from Category 1 to Category 8, offering options across every budget.`,
  highlights: [
    "ANA Business Class from 47,500 Virgin Points one-way",
    "Park Hyatt Tokyo via World of Hyatt — iconic and attainable",
    "JAL Sakura Lounge: among the best airport lounges in the world",
    "Multiple Category 1–3 Hyatt properties for budget-conscious stays",
  ],
  redemptions: [
    {
      type: "Flight",
      label: "Business Class",
      program: "Virgin Atlantic → ANA",
      points: "47,500",
      direction: "One-way from USA",
      value: "~2.4 cpp",
    },
    {
      type: "Hotel",
      label: "Luxury Stay",
      program: "World of Hyatt",
      points: "25,000–40,000 / night",
      direction: "Park Hyatt Tokyo",
      value: "~2.1 cpp",
    },
    {
      type: "Flight",
      label: "Economy Class",
      program: "Chase UR → United",
      points: "35,000",
      direction: "Round-trip from USA",
      value: "~1.5 cpp",
    },
  ],
  relatedDestinations: [
    { slug: "kyoto-japan", name: "Kyoto", country: "Japan" },
    { slug: "bali-indonesia", name: "Bali", country: "Indonesia" },
    { slug: "maldives", name: "Maldives", country: "Republic of Maldives" },
  ],
  bestPrograms: ["Virgin Atlantic", "World of Hyatt", "ANA Mileage Club", "Chase UR"],
  bestTime: "March–May, September–November",
  visa: "90-day visa-free for US citizens",
};

export const metadata: Metadata = {
  title: `${destination.name}, ${destination.country} — Award Travel Guide`,
  description: destination.tagline,
};

export default function DestinationDetailPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="rg-img-placeholder"
          style={{
            background: "linear-gradient(135deg, #07112A 0%, var(--color-navy) 50%, #1a3560 100%)",
            minHeight: "480px",
          }}
        >
          {/* Breadcrumb */}
          <div className="rg-container relative z-20 pt-8">
            <nav className="flex items-center gap-2 text-xs font-ui" aria-label="Breadcrumb">
              <Link href="/" className="text-[var(--color-slate-light)] hover:text-[var(--color-gold)] transition-colors">Home</Link>
              <span className="text-[var(--color-slate)]">/</span>
              <Link href="/destinations" className="text-[var(--color-slate-light)] hover:text-[var(--color-gold)] transition-colors">Destinations</Link>
              <span className="text-[var(--color-slate)]">/</span>
              <span className="text-[var(--color-gold)]">{destination.name}</span>
            </nav>
          </div>

          {/* Hero content */}
          <div className="rg-container relative z-20 pb-16 pt-12">
            <div className="max-w-3xl">
              <p className="rg-section-label mb-3">{destination.region} · {destination.country}</p>
              <h1 className="font-display text-5xl md:text-6xl font-bold text-[var(--color-white)] mb-4">
                {destination.name}
              </h1>
              <div className="rg-gold-bar" />
              <p className="font-body text-xl text-[var(--color-slate-light)] mt-4 max-w-2xl leading-relaxed">
                {destination.tagline}
              </p>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-4 mt-8">
                {[
                  { label: "Best Time", value: destination.bestTime },
                  { label: "Visa (US)", value: destination.visa },
                  { label: "Top Program", value: destination.bestPrograms[0] },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                    <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-gold)] mb-1">{stat.label}</p>
                    <p className="font-body text-sm text-[var(--color-white)]">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none" aria-hidden="true">
          <svg viewBox="0 0 1440 40" xmlns="http://www.w3.org/2000/svg" className="w-full h-10" preserveAspectRatio="none">
            <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" fill="var(--color-ivory)" />
          </svg>
        </div>
      </section>

      {/* Main content */}
      <section className="rg-section bg-[var(--color-ivory)]">
        <div className="rg-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Left: content column */}
            <div className="lg:col-span-2 space-y-12">

              {/* Description */}
              <div>
                <h2 className="font-display text-2xl font-bold text-[var(--color-navy)] mb-4">
                  Why Points Travelers Love {destination.name}
                </h2>
                <div className="rg-gold-bar" />
                {destination.description.split("\n\n").map((para, i) => (
                  <p key={i} className="font-body text-base text-[var(--color-charcoal)] leading-relaxed mt-4">
                    {para}
                  </p>
                ))}
              </div>

              {/* Highlights */}
              <div>
                <h2 className="font-display text-2xl font-bold text-[var(--color-navy)] mb-4">
                  Top Award Highlights
                </h2>
                <div className="rg-gold-bar" />
                <ul className="space-y-3 mt-4">
                  {destination.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[var(--color-gold-light)] flex items-center justify-center shrink-0 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                          <path d="M2 5l2 2 4-4" stroke="var(--color-navy)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <p className="font-body text-sm text-[var(--color-charcoal)]">{highlight}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Redemption table */}
              <div>
                <h2 className="font-display text-2xl font-bold text-[var(--color-navy)] mb-4">
                  Best Redemptions Right Now
                </h2>
                <div className="rg-gold-bar" />
                <div className="space-y-4 mt-4">
                  {destination.redemptions.map((r, i) => (
                    <div key={i} className="rg-card p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="rg-badge">{r.type}</span>
                            <span className="font-ui text-xs text-[var(--color-slate)]">{r.label}</span>
                          </div>
                          <p className="font-display text-lg font-bold text-[var(--color-navy)]">{r.program}</p>
                          <p className="font-body text-sm text-[var(--color-slate)] mt-1">{r.direction}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-xl font-bold text-[var(--color-gold)]">{r.points}</p>
                          <p className="font-ui text-xs text-[var(--color-slate)] mt-1">{r.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right: sidebar */}
            <aside className="space-y-6">

              {/* Quick facts */}
              <div className="rg-card p-6">
                <h3 className="font-display text-lg font-bold text-[var(--color-navy)] mb-4">
                  Quick Facts
                </h3>
                <dl className="space-y-3">
                  {[
                    { term: "Region", detail: destination.region },
                    { term: "Country", detail: destination.country },
                    { term: "Best Time", detail: destination.bestTime },
                    { term: "Visa (US)", detail: destination.visa },
                  ].map((item) => (
                    <div key={item.term} className="flex justify-between gap-4">
                      <dt className="font-ui text-xs uppercase tracking-wider text-[var(--color-slate)]">{item.term}</dt>
                      <dd className="font-body text-sm text-[var(--color-charcoal)] text-right">{item.detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Best programs */}
              <div className="rg-card p-6">
                <h3 className="font-display text-lg font-bold text-[var(--color-navy)] mb-4">
                  Best Programs
                </h3>
                <div className="flex flex-wrap gap-2">
                  {destination.bestPrograms.map((p) => (
                    <span key={p} className="rg-badge">{p}</span>
                  ))}
                </div>
              </div>

              {/* Decision Engine CTA */}
              <div
                className="rounded-xl p-6"
                style={{ background: "var(--color-navy)" }}
              >
                <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-gold)] mb-2">
                  Decision Engine
                </p>
                <h3 className="font-display text-lg font-bold text-[var(--color-white)] mb-3 leading-snug">
                  Get your ranked plan for {destination.name}
                </h3>
                <p className="font-body text-sm text-[var(--color-slate-light)] mb-5">
                  See live transfer bonuses, current award availability, and the best move for your points right now.
                </p>
                <Link href="/decision-engine" className="rg-btn-primary w-full justify-center">
                  Launch Engine
                </Link>
              </div>

            </aside>

          </div>
        </div>
      </section>

      {/* Related destinations */}
      <section className="rg-section bg-[var(--color-white)]">
        <div className="rg-container">
          <h2 className="font-display text-2xl font-bold text-[var(--color-navy)] mb-2">
            You Might Also Like
          </h2>
          <div className="rg-gold-bar" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            {destination.relatedDestinations.map((rel) => (
              <Link key={rel.slug} href={`/destinations/${rel.slug}`} className="group block">
                <div className="rg-card overflow-hidden">
                  <div
                    className="rg-img-placeholder h-36"
                    style={{ background: "linear-gradient(135deg, #0B1C3D, #1a3a6e)" }}
                  />
                  <div className="p-4">
                    <p className="font-ui text-xs text-[var(--color-slate)] uppercase tracking-wider mb-1">
                      {rel.country}
                    </p>
                    <h3 className="font-display text-lg font-bold text-[var(--color-navy)] group-hover:text-[var(--color-gold)] transition-colors">
                      {rel.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
