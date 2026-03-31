import Link from "next/link";

const footerNav = [
  {
    heading: "Explore",
    links: [
      { label: "Destinations", href: "/destinations" },
      { label: "Deals", href: "/deals" },
      { label: "Guides", href: "/guides" },
      { label: "Sweet Spots", href: "/sweet-spots" },
    ],
  },
  {
    heading: "Tools",
    links: [
      { label: "Transfer Bonus Tracker", href: "/tools/transfer-bonus-tracker" },
      { label: "Points Valuation", href: "/tools/points-valuation" },
      { label: "Award Availability", href: "/tools/award-availability" },
      { label: "Decision Engine", href: "/decision-engine" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Newsletter", href: "/newsletter" },
      { label: "Contact", href: "/contact" },
      { label: "Advertise", href: "/advertise" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[var(--color-navy-dark)] text-[var(--color-white)]">

      {/* Main footer grid */}
      <div className="rg-container py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="font-display text-2xl font-bold text-[var(--color-white)]">
                crazy4<span className="text-[var(--color-gold)]">points</span>
              </span>
            </Link>
            <p className="font-body text-sm text-[var(--color-slate-light)] leading-relaxed max-w-xs">
              The intelligent travel rewards platform. Earn more points. Book smarter trips.
              Get your ranked action plan — right now.
            </p>

            {/* Newsletter placeholder */}
            <div className="mt-8">
              <p className="font-ui text-xs font-700 uppercase tracking-widest text-[var(--color-gold)] mb-3">
                Free Weekly Intel
              </p>
              <div className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  placeholder="your@email.com"
                  disabled
                  className="flex-1 bg-[var(--color-navy)] border border-[var(--color-slate)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-white)] placeholder:text-[var(--color-slate)] focus:outline-none cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled
                  className="rg-btn-primary text-xs py-2.5 px-4 opacity-80 cursor-not-allowed"
                >
                  Join
                </button>
              </div>
              <p className="text-xs text-[var(--color-slate)] mt-2">
                Newsletter logic coming in Phase 2.
              </p>
            </div>
          </div>

          {/* Nav columns */}
          {footerNav.map((col) => (
            <div key={col.heading}>
              <h3 className="font-ui text-xs font-700 uppercase tracking-widest text-[var(--color-gold)] mb-5">
                {col.heading}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-body text-sm text-[var(--color-slate-light)] hover:text-[var(--color-white)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </div>

      {/* Legal bar */}
      <div className="border-t border-[var(--color-navy)]">
        <div className="rg-container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-[var(--color-slate)]">
            © {new Date().getFullYear()} crazy4points. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="font-body text-xs text-[var(--color-slate)] hover:text-[var(--color-white)] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-body text-xs text-[var(--color-slate)] hover:text-[var(--color-white)] transition-colors">
              Terms of Use
            </Link>
            <Link href="/disclosures" className="font-body text-xs text-[var(--color-slate)] hover:text-[var(--color-white)] transition-colors">
              Disclosures
            </Link>
          </div>
        </div>
      </div>

    </footer>
  );
}
