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
            'E. Advertising & Measurement Cookies (Optional) — We use the Meta (Facebook) Pixel to measure how our content performs and, where applicable, to support advertising. These cookies are only set after you accept cookies through our banner. If you decline, the Meta Pixel is not loaded and no data is sent to Meta.',
          ],
        },
        {
          heading: '3. Google Consent Mode',
          content: [
            'We use Google Consent Mode so analytics and measurement tools adjust to your cookie preferences. Analytics cookies (Google Analytics) are enabled by default so we can understand how the Site is used; if you decline through our banner, Google Analytics switches to a limited, cookieless mode. Advertising and measurement cookies, including ad storage, are disabled by default and are enabled only after you accept. You can change your choice at any time through the banner.',
          ],
        },
        {
          heading: '4. How to Manage Cookies',
          content: [
            { type: 'list', items: ['Accept or reject non-essential cookies through our cookie banner', 'Change your preferences at any time', "Disable cookies through your browser settings"] },
            'We set analytics cookies by default under our legitimate interest in understanding Site usage, and you can opt out at any time through the banner, which switches Google Analytics to a cookieless mode. Advertising cookies (the Meta Pixel and Google ad signals) are set only after you accept. You may withdraw consent or opt out at any time without affecting the lawfulness of processing before your change. Please note: disabling certain cookies may affect Site functionality.',
          ],
        },
        {
          heading: '5. Third Party Cookies',
          content: [
            'Third party services may set cookies when you interact with the Site. These include Google Analytics, the Meta (Facebook) Pixel, affiliate networks, and future embedded content providers. We do not control third party cookies and recommend reviewing their privacy policies.',
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
                ['_fbp', 'Advertising & measurement (Meta Pixel), set only after consent', "3 months"],
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
