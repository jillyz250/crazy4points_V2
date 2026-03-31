import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms and conditions for using crazy4points.",
};

export default function TermsPage() {
  return (
    <div className="rg-section bg-[var(--color-ivory)]">
      <div className="rg-container max-w-3xl">
        <p className="rg-section-label mb-3">Legal</p>
        <h1 className="font-display text-4xl font-bold text-[var(--color-navy)] mb-4">
          Terms of Use
        </h1>
        <div className="rg-gold-bar" />
        <p className="font-body text-sm text-[var(--color-slate)] mt-4 mb-10">
          Last updated: March 31, 2026
        </p>

        <div className="space-y-8">
          {[
            {
              heading: "Acceptance of Terms",
              body: "By accessing and using crazy4points.com, you agree to be bound by these Terms of Use. If you do not agree, please discontinue use of the platform.",
            },
            {
              heading: "Informational Purposes Only",
              body: "All content on crazy4points is provided for informational and educational purposes only. Nothing on this platform constitutes financial advice, credit advice, or a recommendation to apply for any financial product. Points valuations, transfer ratios, and award availability are subject to change and may not reflect real-time conditions at the time you read them.",
            },
            {
              heading: "Intellectual Property",
              body: "The crazy4points Decision Engine, brand, design, editorial content, and data compilations are the intellectual property of crazy4points. Unauthorized reproduction, scraping, or redistribution is prohibited.",
            },
            {
              heading: "Affiliate Relationships",
              body: "crazy4points participates in affiliate marketing programs. We may earn a commission when you apply for financial products through links on this site. This does not affect our editorial independence or recommendations.",
            },
            {
              heading: "Limitation of Liability",
              body: "crazy4points is not liable for decisions made based on information provided on this platform. Award availability, transfer bonuses, and redemption values change frequently. Always verify current terms directly with the relevant loyalty program before transferring points.",
            },
            {
              heading: "Changes to Terms",
              body: "We reserve the right to update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the updated Terms.",
            },
          ].map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-xl font-bold text-[var(--color-navy)] mb-3">
                {section.heading}
              </h2>
              <p className="font-body text-base text-[var(--color-charcoal)] leading-relaxed">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
