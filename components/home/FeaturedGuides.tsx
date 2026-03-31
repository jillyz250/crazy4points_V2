import Link from "next/link";

const guides = [
  {
    slug: "how-to-transfer-chase-points",
    title: "How to Transfer Chase Ultimate Rewards Points",
    category: "Beginner Guide",
    readTime: "8 min read",
    excerpt:
      "Everything you need to know about moving Chase UR points to airline and hotel partners — and when it makes sense to do it.",
  },
  {
    slug: "best-business-class-sweet-spots",
    title: "The 7 Best Business Class Sweet Spots Right Now",
    category: "Sweet Spots",
    readTime: "12 min read",
    excerpt:
      "These award redemptions are still delivering 2+ cents per point in 2026. Here's exactly how to book each one.",
  },
  {
    slug: "amex-transfer-partners-ranked",
    title: "Amex Membership Rewards Transfer Partners, Ranked",
    category: "Points Strategy",
    readTime: "10 min read",
    excerpt:
      "A complete breakdown of every Amex MR transfer partner, ranked by redemption value, transfer speed, and sweet spot availability.",
  },
];

export default function FeaturedGuides() {
  return (
    <section className="rg-section bg-[var(--color-ivory)]">
      <div className="rg-container">

        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="rg-section-label">Learn the Game</p>
            <h2 className="rg-section-title">Strategy Guides</h2>
            <div className="rg-gold-bar" />
            <p className="rg-section-subtitle">
              Deep-dive guides on points strategy, transfer partners, and award booking — written for people who want to get it right.
            </p>
          </div>
          <Link href="/guides" className="rg-btn-outline self-start md:self-auto shrink-0">
            All Guides
          </Link>
        </div>

        {/* Guide cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group block">
              <article className="rg-card h-full flex flex-col">

                {/* Image placeholder */}
                <div
                  className="h-44 rg-img-placeholder"
                  style={{ background: "linear-gradient(135deg, #0B1C3D 0%, #1a3560 100%)" }}
                >
                  <div className="absolute top-3 left-3 z-20">
                    <span className="rg-badge">{guide.category}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <p className="font-ui text-xs text-[var(--color-slate)] mb-3">
                    {guide.readTime}
                  </p>
                  <h3 className="font-display text-lg font-bold text-[var(--color-navy)] mb-3 leading-snug group-hover:text-[var(--color-gold)] transition-colors flex-1">
                    {guide.title}
                  </h3>
                  <p className="font-body text-sm text-[var(--color-slate)] leading-relaxed mb-5">
                    {guide.excerpt}
                  </p>
                  <span className="font-ui text-xs font-700 uppercase tracking-widest text-[var(--color-gold)] group-hover:gap-2 flex items-center gap-1.5 transition-all">
                    Read Guide
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>

              </article>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
