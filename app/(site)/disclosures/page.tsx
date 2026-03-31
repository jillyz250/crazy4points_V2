import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate Disclosures",
  description: "Affiliate and compensation disclosures for crazy4points.",
};

export default function DisclosuresPage() {
  return (
    <div className="rg-section bg-[var(--color-ivory)]">
      <div className="rg-container max-w-3xl">
        <p className="rg-section-label mb-3">Legal</p>
        <h1 className="font-display text-4xl font-bold text-[var(--color-navy)] mb-4">
          Affiliate Disclosures
        </h1>
        <div className="rg-gold-bar" />
        <p className="font-body text-sm text-[var(--color-slate)] mt-4 mb-10">
          Last updated: March 31, 2026
        </p>

        <div className="space-y-8">
          {[
            {
              heading: "FTC Disclosure",
              body: "crazy4points participates in affiliate marketing programs. This means we may earn a commission or referral fee when you click on links to financial products, travel services, or other offerings on this site and make a purchase or application. This is how we keep the platform free.",
            },
            {
              heading: "Editorial Independence",
              body: "Affiliate relationships do not influence our editorial coverage, tool rankings, or data. Points valuations, transfer bonus data, and sweet spot recommendations are based on publicly available information and our own analysis — not on compensation arrangements.",
            },
            {
              heading: "Credit Card Offers",
              body: "Some pages on crazy4points include links to credit card offers. We may receive compensation from card issuers when you apply through our links. Credit card terms, sign-up bonuses, and annual fees change frequently. Always review current terms on the issuer's website before applying.",
            },
            {
              heading: "No Guarantees",
              body: "crazy4points does not guarantee approval for any financial product. Credit decisions are made solely by the issuing bank. We are not a financial institution and do not provide credit.",
            },
            {
              heading: "Price Accuracy",
              body: "Award redemption values, transfer ratios, and deal pricing shown on this platform are for informational purposes and are subject to change. We make every effort to keep data current but cannot guarantee real-time accuracy.",
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
