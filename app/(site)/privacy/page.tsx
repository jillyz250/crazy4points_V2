import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How crazy4points collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <div className="rg-section bg-[var(--color-ivory)]">
      <div className="rg-container max-w-3xl">
        <p className="rg-section-label mb-3">Legal</p>
        <h1 className="font-display text-4xl font-bold text-[var(--color-navy)] mb-4">
          Privacy Policy
        </h1>
        <div className="rg-gold-bar" />
        <p className="font-body text-sm text-[var(--color-slate)] mt-4 mb-10">
          Last updated: March 31, 2026
        </p>

        <div className="prose max-w-none space-y-8">
          {[
            {
              heading: "Information We Collect",
              body: "crazy4points is a read-only platform. We do not require account creation, login, or submission of personal financial information. We may collect anonymized usage data (page views, tool interactions) through analytics providers to improve the platform.",
            },
            {
              heading: "How We Use Information",
              body: "Any information collected is used solely to improve platform performance, understand user behavior in aggregate, and deliver a better experience. We do not sell personal data to third parties.",
            },
            {
              heading: "Cookies",
              body: "We may use cookies or similar technologies for analytics and performance tracking. You can disable cookies in your browser settings, though some features may not function as intended.",
            },
            {
              heading: "Third-Party Services",
              body: "crazy4points may include affiliate links to third-party financial products and travel services. Please review the privacy policies of those third parties independently. We are not responsible for their data practices.",
            },
            {
              heading: "Contact",
              body: "For privacy questions, please contact us at privacy@crazy4points.com. Full contact details will be available upon site launch.",
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
