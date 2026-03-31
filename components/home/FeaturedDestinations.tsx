import Link from "next/link";

const destinations = [
  {
    slug: "tokyo-japan",
    name: "Tokyo, Japan",
    region: "Asia Pacific",
    pointsFrom: "35,000",
    program: "ANA",
    tag: "Sweet Spot",
  },
  {
    slug: "maldives",
    name: "Maldives",
    region: "Indian Ocean",
    pointsFrom: "60,000",
    program: "World of Hyatt",
    tag: "Luxury",
  },
  {
    slug: "paris-france",
    name: "Paris, France",
    region: "Europe",
    pointsFrom: "50,000",
    program: "Air France/KLM",
    tag: "Editor's Pick",
  },
  {
    slug: "maui-hawaii",
    name: "Maui, Hawaii",
    region: "USA",
    pointsFrom: "25,000",
    program: "Chase UR",
    tag: "Top Value",
  },
];

export default function FeaturedDestinations() {
  return (
    <section className="rg-section bg-[var(--color-ivory)]">
      <div className="rg-container">

        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="rg-section-label">Explore the World Free</p>
            <h2 className="rg-section-title">Featured Destinations</h2>
            <div className="rg-gold-bar" />
            <p className="rg-section-subtitle">
              Top award travel destinations ranked by value, availability, and current transfer bonuses.
            </p>
          </div>
          <Link href="/destinations" className="rg-btn-outline self-start md:self-auto shrink-0">
            All Destinations
          </Link>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((dest) => (
            <Link key={dest.slug} href={`/destinations/${dest.slug}`} className="group block">
              <article className="rg-card h-full">

                {/* Image placeholder */}
                <div className="rg-img-placeholder h-48 relative">
                  <span className="absolute inset-0 flex items-center justify-center z-10 opacity-30">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" aria-hidden="true">
                      <circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    </svg>
                  </span>
                  {/* Badge */}
                  <div className="absolute top-3 left-3 z-20">
                    <span className="rg-badge">{dest.tag}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-slate)] mb-1">
                    {dest.region}
                  </p>
                  <h3 className="font-display text-lg font-bold text-[var(--color-navy)] mb-3 group-hover:text-[var(--color-gold)] transition-colors">
                    {dest.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-ui text-xs text-[var(--color-slate)]">From</p>
                      <p className="font-display text-xl font-bold text-[var(--color-gold)]">
                        {dest.pointsFrom}
                        <span className="font-body text-xs text-[var(--color-slate)] ml-1">pts</span>
                      </p>
                    </div>
                    <span className="font-ui text-xs text-[var(--color-slate)] bg-[var(--color-ivory-dark)] px-2 py-1 rounded-md">
                      {dest.program}
                    </span>
                  </div>
                </div>

              </article>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
