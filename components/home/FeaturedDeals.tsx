import Link from "next/link";

const deals = [
  {
    slug: "chase-united-30pct-bonus",
    title: "30% Transfer Bonus: Chase → United MileagePlus",
    category: "Transfer Bonus",
    expiry: "Expires Apr 15, 2026",
    urgency: "4 days left",
    programs: ["Chase UR", "United"],
    isUrgent: true,
  },
  {
    slug: "amex-delta-25pct",
    title: "25% Transfer Bonus: Amex → Delta SkyMiles",
    category: "Transfer Bonus",
    expiry: "Expires Apr 30, 2026",
    urgency: "19 days left",
    programs: ["Amex MR", "Delta"],
    isUrgent: false,
  },
  {
    slug: "hyatt-category-1-maldives",
    title: "Maldives Category 1 Redemption — Limited Availability",
    category: "Sweet Spot",
    expiry: "While availability lasts",
    urgency: "Low availability",
    programs: ["World of Hyatt"],
    isUrgent: true,
  },
];

export default function FeaturedDeals() {
  return (
    <section className="rg-section" style={{ background: "var(--color-navy)" }}>
      <div className="rg-container">

        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="rg-section-label">Act Now</p>
            <h2 className="rg-section-title" style={{ color: "var(--color-white)" }}>
              Live Deals & Bonuses
            </h2>
            <div className="rg-gold-bar" />
            <p className="rg-section-subtitle" style={{ color: "var(--color-slate-light)" }}>
              Transfer bonuses, sweet spots, and limited-time offers — ranked by urgency and value.
            </p>
          </div>
          <Link href="/deals" className="rg-btn-outline self-start md:self-auto shrink-0">
            All Deals
          </Link>
        </div>

        {/* Deal cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <Link key={deal.slug} href={`/deals/${deal.slug}`} className="group block">
              <article
                className="h-full rounded-xl border p-6 transition-all duration-200 group-hover:border-[var(--color-gold)] group-hover:shadow-[var(--shadow-gold)]"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >

                {/* Top row */}
                <div className="flex items-center justify-between mb-4">
                  <span className="rg-badge">{deal.category}</span>
                  {deal.isUrgent && (
                    <span className="flex items-center gap-1.5 font-ui text-xs font-700 text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      {deal.urgency}
                    </span>
                  )}
                  {!deal.isUrgent && (
                    <span className="font-ui text-xs text-[var(--color-slate-light)]">
                      {deal.urgency}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-display text-lg font-bold text-[var(--color-white)] mb-4 group-hover:text-[var(--color-gold)] transition-colors leading-snug">
                  {deal.title}
                </h3>

                {/* Programs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {deal.programs.map((p) => (
                    <span
                      key={p}
                      className="font-ui text-xs px-2 py-1 rounded-md"
                      style={{ background: "rgba(201,168,76,0.15)", color: "var(--color-gold-light)" }}
                    >
                      {p}
                    </span>
                  ))}
                </div>

                {/* Expiry */}
                <p className="font-body text-xs text-[var(--color-slate-light)]">
                  {deal.expiry}
                </p>

              </article>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
