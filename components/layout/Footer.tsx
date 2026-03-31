import Link from "next/link";

const footerNav = [
  {
    heading: "Explore",
    links: [
      { label: "Destinations", href: "/destinations" },
      { label: "Deals", href: "/deals" },
      { label: "Guides", href: "/guides" },
      { label: "Tools", href: "/tools" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Newsletter", href: "/newsletter" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[var(--color-bg-soft)] border-t border-[var(--color-border)]">

      {/* Main footer grid */}
      <div className="rg-container py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="font-display text-2xl font-bold text-[var(--color-text)]">
                crazy4<span className="text-[var(--color-primary)]">points</span>
              </span>
            </Link>
            <p className="font-body text-sm text-[var(--color-text-muted)] leading-relaxed max-w-xs">
              Company description placeholder.
            </p>

            {/* Newsletter placeholder */}
            <div className="mt-8">
              <p className="font-ui text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3">
                Newsletter
              </p>
              <div className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  placeholder="your@email.com"
                  disabled
                  className="flex-1 bg-[var(--color-white)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled
                  className="rg-btn-primary text-xs py-2.5 px-4 opacity-60 cursor-not-allowed"
                >
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Nav columns */}
          {footerNav.map((col) => (
            <div key={col.heading}>
              <h3 className="font-ui text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-5">
                {col.heading}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-body text-sm text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] transition-colors"
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
      <div className="border-t border-[var(--color-border)]">
        <div className="rg-container py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} crazy4points. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="font-body text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-body text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
              Terms of Use
            </Link>
            <Link href="/disclosures" className="font-body text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
              Disclosures
            </Link>
          </div>
        </div>
      </div>

    </footer>
  );
}
