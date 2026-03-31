import Link from "next/link";

export default function HomeHero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--color-navy-dark) 0%, var(--color-navy) 60%, #1a3a6e 100%)" }}
    >
      {/* Background texture overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, var(--color-gold) 0px, transparent 1px, transparent 40px, var(--color-gold) 41px)",
        }}
        aria-hidden="true"
      />

      {/* Gold accent line top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-gold)]" aria-hidden="true" />

      <div className="rg-container relative z-10 py-24 md:py-36 lg:py-44">
        <div className="max-w-3xl">

          {/* Eyebrow label */}
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="rg-badge rg-badge-navy">
              Travel Intelligence Platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-[var(--color-white)] leading-tight mb-6">
            Travel Smarter.{" "}
            <span className="text-[var(--color-gold)]">Earn More.</span>{" "}
            Go Farther.
          </h1>

          {/* Subheadline */}
          <p className="font-body text-lg md:text-xl text-[var(--color-slate-light)] leading-relaxed mb-10 max-w-2xl">
            Real-time transfer bonuses, sweet spot alerts, and a ranked action plan
            built around your points — right now. No guesswork. No spreadsheets.
            Just your best move.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/decision-engine" className="rg-btn-primary">
              Get My Action Plan
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link href="/tools/transfer-bonus-tracker" className="rg-btn-outline">
              Transfer Bonus Tracker
            </Link>
          </div>

          {/* Social proof row */}
          <div className="mt-12 flex flex-col sm:flex-row gap-6 sm:gap-10">
            {[
              { stat: "14", label: "Live Tracking Tools" },
              { stat: "4", label: "Bank Programs Monitored" },
              { stat: "Free", label: "No Login Required" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="font-display text-2xl font-bold text-[var(--color-gold)]">
                  {item.stat}
                </span>
                <span className="font-ui text-xs uppercase tracking-wider text-[var(--color-slate-light)]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none" aria-hidden="true">
        <svg
          viewBox="0 0 1440 60"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-12 md:h-16"
          preserveAspectRatio="none"
        >
          <path
            d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
            fill="var(--color-ivory)"
          />
        </svg>
      </div>
    </section>
  );
}
