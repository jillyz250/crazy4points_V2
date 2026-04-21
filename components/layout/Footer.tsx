import Link from "next/link";

const footerNav = [
  {
    heading: "Explore",
    links: [
      { label: "Alerts", href: "/alerts" },
      { label: "Decision Engine", href: "/decision-engine" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Newsletter", href: "/newsletter" },
      { label: "Contact", href: "mailto:support@thankyoudeals.com" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
      { label: "Cookie Policy", href: "/cookie-policy" },
      { label: "Do Not Sell My Info", href: "/do-not-sell" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-soft)] bg-[var(--color-background-soft)]">
      <div className="rg-container px-6 py-20 md:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">

          {/* Brand column */}
          <div>
            <Link href="/" className="inline-block">
              <span className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
                crazy4<span className="text-[var(--color-primary)]">points</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm font-body text-sm text-[var(--color-text-secondary)]">
              The points game is messy. We make it make sense.
            </p>
          </div>

          {/* Nav columns */}
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

      {/* Legal bar */}
      <div className="border-t border-[var(--color-border-soft)]">
        <div className="rg-container px-6 pt-5 pb-1 md:px-8">
          <p className="text-center font-body text-[11px] leading-relaxed text-[var(--color-text-secondary)] opacity-70">
            Content on Crazy4Points is for informational purposes only. We are not affiliated with any bank, airline, or hotel loyalty program. Always verify details directly with your card issuer.
          </p>
        </div>
        <div className="rg-container flex flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row md:px-8">
          <p className="font-body text-xs text-[var(--color-text-secondary)]">
            © {new Date().getFullYear()} crazy4points · ThankYouDeals Inc. · New York, USA
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
              { label: "Cookie Policy", href: "/cookie-policy" },
              { label: "Do Not Sell My Info", href: "/do-not-sell" },
              { label: "Accessibility", href: "/accessibility" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
