import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: 'Cookie Policy | crazy4points',
  description: 'How crazy4points uses cookies and similar tracking technologies.',
};

const INTRO = `This Cookie Policy explains how ThankYouDeals Inc. ("Company," "we," 'our,' or "us") uses cookies and similar tracking technologies on Crazy4Points.com (the "Site"). It works together with our Privacy Policy and is designed to comply with GDPR, ePrivacy Directive, CCPA/CPRA, and Google Consent Mode requirements.`;

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      effectiveDate="January 1, 2026"
      lastUpdated="March 31, 2026"
      intro={INTRO}
      sections={[
        {
          heading: '1. What Are Cookies?',
          content: [
            'Cookies are small text files stored on your device when you visit a website. They help the Site function properly, remember your preferences, and understand how visitors interact with the Site.',
            'Cookies may be:',
            { type: 'list', items: ['Session cookies (deleted when you close your browser)', 'Persistent cookies (remain until they expire or are deleted)', 'First-party cookies (set by us)', "Third-party cookies (set by partners such as analytics or affiliate networks)"] },
          ],
        },
        {
          heading: '2. Types of Cookies We Use',
          content: [
            'A. Strictly Necessary Cookies — Essential for the Site to function. They support page navigation, basic site functionality, and security. They cannot be disabled.',
            'B. Analytics & Performance Cookies — Used to understand how visitors use the Site, including page views, click events, traffic sources, and device information. We use Google Analytics with Google Consent Mode to respect user preferences.',
            'C. Affiliate Tracking Cookies — When you click affiliate links, a cookie may be placed to attribute referrals, track conversions, and confirm commissions. These do not directly identify you personally to us.',
            'D. Preference Cookies — These remember your choices such as cookie consent settings and display preferences.',
            'E. Advertising & Measurement Cookies (Optional) — We do not currently use personalized advertising cookies. If this changes, we will update this Policy and request consent.',
          ],
        },
        {
          heading: '3. Google Consent Mode',
          content: [
            'We use Google Consent Mode to ensure analytics and measurement tools adjust their behavior based on your cookie preferences. Consent Mode controls analytics storage, ad storage (disabled by default), and measurement signals. If you decline analytics cookies, Google Analytics operates in a limited, cookieless mode.',
          ],
        },
        {
          heading: '4. How to Manage Cookies',
          content: [
            { type: 'list', items: ['Accept or reject non-essential cookies through our cookie banner', 'Change your preferences at any time', "Disable cookies through your browser settings"] },
            'Where required by law, we rely on your consent to place non-essential cookies on your device. You may withdraw your consent at any time without affecting the lawfulness of processing based on consent before its withdrawal. Please note: disabling certain cookies may affect Site functionality.',
          ],
        },
        {
          heading: '5. Third Party Cookies',
          content: [
            'Third party services may set cookies when you interact with the Site. These include Google Analytics, affiliate networks, and future embedded content providers. We do not control third party cookies and recommend reviewing their privacy policies.',
          ],
        },
        {
          heading: '6. Do Not Track (DNT)',
          content: ["The Site does not currently respond to Do Not Track signals, as no standard exists for interpreting them."],
        },
        {
          heading: '7. Data Retention',
          content: ["Cookie data is retained only as long as necessary for the purposes described in this Policy. Retention periods vary by cookie type and provider."],
        },
        {
          heading: '8. Example Cookies We Use',
          content: [
            {
              type: 'table',
              headers: ['Cookie', 'Purpose', "Duration"],
              rows: [
                ['_ga', 'Analytics (Google Analytics)', "2 years"],
                ['_gid', 'Analytics (Google Analytics)', "24 hours"],
                ['affiliate_click_id', 'Affiliate attribution', "Varies by network"],
              ],
            },
            'This list is illustrative and may change as our Site evolves.',
          ],
        },
        {
          heading: '9. Updates to This Cookie Policy',
          content: ["We may update this Cookie Policy from time to time. The 'Last Updated' date reflects the most recent revision."],
        },
      ]}
    />
  );
}
