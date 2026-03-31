import Link from "next/link";

export default function CTASection() {
  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      style={{
        background: "linear-gradient(135deg, var(--color-navy-dark) 0%, var(--color-navy) 100%)",
      }}
    >
      {/* Decorative gold circle */}
      <div
        className="absolute -right-32 -top-32 w-96 h-96 rounded-full opacity-5"
        style={{ background: "var(--color-gold)" }}
        aria-hidden="true"
      />
      <div
        className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full opacity-5"
        style={{ background: "var(--color-gold)" }}
        aria-hidden="true"
      />

      <div className="rg-container relative z-10">
        <div className="max-w-3xl mx-auto text-center">

          {/* Label */}
          <p className="rg-section-label mb-4">The Crown Jewel</p>

          {/* Headline */}
          <h2
            className="font-display text-3xl md:text-5xl font-bold leading-tight mb-6"
            style={{ color: "var(--color-white)" }}
          >
            Get Your Ranked Action Plan —{" "}
            <span style={{ color: "var(--color-gold)" }}>Right Now</span>
          </h2>

          <div className="rg-gold-bar mx-auto" />

          {/* Description */}
          <p
            className="font-body text-lg leading-relaxed mb-10 mt-6"
            style={{ color: "var(--color-slate-light)" }}
          >
            The Decision Engine checks all 14 live data feeds simultaneously and tells you
            exactly where to move your points today — with transfer ratio, cpp value, and
            award availability baked in.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              "Live Transfer Bonuses",
              "Award Availability",
              "CPP Calculations",
              "No Login Required",
              "4 Bank Programs",
            ].map((item) => (
              <span key={item} className="rg-badge rg-badge-navy text-xs px-4 py-2">
                {item}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/decision-engine" className="rg-btn-primary">
              Launch Decision Engine
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link href="/tools" className="rg-btn-outline">
              Explore All 14 Tools
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
