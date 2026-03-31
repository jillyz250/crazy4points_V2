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
    <footer className="border-t border-[var(--color-border-soft)] bg-[var(--color-background-soft)]">
      <div className="rg-container px-6 py-20 md:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <Link href="/" className="inline-block">
              <span className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
                crazy4<span className="text-[var(--color-primary)]">points</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm font-body text-sm text-[var(--color-text-secondary)]">
              Footer content placeholder.
            </p>
          </div>

          {footerNav.map((col) => (
            <div key={col.heading}>
              <h3 className="font-display text-lg font-semibold text-[var(--color-primary)]">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-ui text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
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

      <div className="border-t border-[var(--color-border-soft)]">
        <div className="rg-container flex flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row md:px-8">
          <p className="font-body text-xs text-[var(--color-text-secondary)]">
            © {new Date().getFullYear()} crazy4points. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
            >
              Terms of Use
            </Link>
            <Link
              href="/disclosures"
              className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
            >
              Disclosures
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
