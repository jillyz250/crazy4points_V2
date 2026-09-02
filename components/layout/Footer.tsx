import Link from "next/link";
import FooterNewsletterSignup from "./FooterNewsletterSignup";
import CapOneShoppingCallout from "@/components/shared/CapOneShoppingCallout";

const footerNav = [
  {
    heading: "Explore",
    links: [
      { label: "Credit Card Explorer", href: "/cards" },
      { label: "Alliance Explorer", href: "/tools/alliances" },
      { label: "Decision Engine", href: "/decision-engine" },
      { label: "Shopping Portals", href: "/tools/shopping-portals" },
      { label: "Alerts", href: "/alerts" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "How We Verify", href: "/how-we-verify" },
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
      {/* Newsletter signup band — sitewide CTA at top of footer. Auto-hidden
          via CSS on any page that already renders a primary newsletter signup
          (globals.css: body:has([data-primary-newsletter-signup])). CSS-based
          so it works in static/SSR HTML with no hydration flash. */}
      <div className="footer-newsletter-band border-b border-[var(--color-border-soft)] bg-[var(--color-background)]">
        <FooterNewsletterSignup />
      </div>

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
            <div className="mt-4 flex items-center gap-1">
              <a
                href="https://www.facebook.com/Crazy4Points"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Crazy4Points on Facebook"
                className="rg-tap-target inline-flex items-center justify-center text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/crazy4points/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Crazy4Points on Instagram"
                className="rg-tap-target inline-flex items-center justify-center text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>

            {/* Recommended free tool (referral) — permanent placement. */}
            <div className="mt-6">
              <CapOneShoppingCallout variant="compact" />
            </div>
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
            Content on Crazy4Points is for informational purposes only. We are not affiliated with any bank, airline, hotel loyalty program, or sweepstakes sponsor. All logos, brand names, and trademarks are the property of their respective owners and are used for identification purposes only. Always verify details directly with the relevant bank, airline, hotel, or sponsor.
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
