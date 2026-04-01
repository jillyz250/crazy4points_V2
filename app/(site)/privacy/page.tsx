import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: 'Privacy Policy | crazy4points',
  description: 'How ThankYouDeals Inc. collects, uses, and protects your information on crazy4points.com.',
};

const INTRO = `ThankYouDeals Inc. ("Company," "we," 'our,' or "us") operates Crazy4Points.com (the "Site"). This Privacy Policy explains how we collect, use, disclose, and protect your information when you visit or interact with the Site. We are committed to transparency, legal compliance, and protecting your privacy.`;

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effectiveDate="January 1, 2026"
      lastUpdated="March 31, 2026"
      intro={INTRO}
      sections={[
        {
          heading: '1. Information We Collect',
          content: [
            'A. Information You Provide Voluntarily',
            { type: 'list', items: ['Email address (e.g., newsletter signup)', 'Contact information (e.g., support requests)', "Optional profile information (future user accounts)"] },
            'We do not collect bank logins, credit card numbers, loyalty program passwords, or sensitive personal data.',
            'B. Automatically Collected Information',
            'We use analytics and cookies to collect:',
            { type: 'list', items: ['IP address', 'Browser type', 'Device information', 'Pages viewed', 'Referring URLs', 'Time on site', 'Click events', 'Conversion events', "Consent preferences"] },
            'C. Cookies & Tracking Technologies — You may manage or withdraw consent at any time. See our Cookie Policy for details.',
          ],
        },
        {
          heading: '2. How We Use Your Information',
          content: [
            'We use information to:',
            { type: 'list', items: ['Operate and improve the Site', 'Provide tools and features', 'Analyze performance and usage', 'Detect fraud or abuse', 'Comply with legal obligations', 'Send newsletters (only if you opt in)', "Support future user accounts and personalization"] },
            'We do not sell personal information.',
          ],
        },
        {
          heading: '3. Affiliate Links & Disclosures',
          content: [
            'Some links on our Site are affiliate links, meaning we may earn a commission if you make a purchase through them, at no additional cost to you. We participate in credit card, travel, loyalty, and retail affiliate programs. Affiliate partners may use cookies or tracking pixels to attribute referrals.',
          ],
        },
        {
          heading: '4. Google Consent Mode & Analytics',
          content: [
            'We use Google Analytics and Google Consent Mode to respect user consent preferences. Consent Mode adjusts analytics behavior, advertising cookies, and measurement signals. We do not use Google signals for personalized ads.',
          ],
        },
        {
          heading: '5. CCPA / CPRA Disclosures (California)',
          content: [
            'California residents have the right to:',
            { type: 'list', items: ['Know what personal information we collect', 'Request deletion', 'Correct inaccurate information', 'Opt out of sharing for cross-context behavioral advertising', "Limit use of sensitive personal information (we do not collect any)"] },
            'You may exercise these rights by visiting our Do Not Sell or Share My Personal Information page or emailing support@thankyoudeals.com. We do not sell personal information.',
          ],
        },
        {
          heading: '6. GDPR Disclosures (EU / UK)',
          content: [
            'Legal bases for processing include consent, legitimate interest, contract performance, and legal obligation. You have the right to access, correct, delete, restrict processing of, object to, and port your data, and to withdraw consent at any time.',
          ],
        },
        {
          heading: '7. Identity Verification',
          content: ["To protect your privacy, we may need to verify your identity before processing certain requests (e.g., deletion, access, correction)."],
        },
        {
          heading: '8. Data Retention',
          content: ["We retain information only as long as necessary for the purposes described in this Policy. Email subscription data is retained until you unsubscribe, unless otherwise required by law."],
        },
        {
          heading: '9. Data Security',
          content: ["We use administrative, technical, and physical safeguards to protect your information. No method of transmission or storage is 100% secure, but we take reasonable steps to reduce risk."],
        },
        {
          heading: '10. Data Breach Notification',
          content: ["If a data breach occurs that affects your personal information, we will notify you as required by applicable law."],
        },
        {
          heading: '11. Business Transfers',
          content: ["If we undergo a merger, acquisition, or asset sale, your information may be transferred as part of the transaction. We will notify you of any material changes."],
        },
        {
          heading: '12. Automated Decision Making',
          content: ["We do not use automated decision-making that produces legal or similarly significant effects. Future personalization features will be optional and transparent."],
        },
        {
          heading: "13. Children's Privacy",
          content: ["The Site is not intended for children under 16. We do not knowingly collect information from children."],
        },
        {
          heading: '14. Your Choices',
          content: [
            { type: 'list', items: ['Opt out of cookies', 'Withdraw consent', 'Unsubscribe from emails', 'Request deletion', "Request access or correction"] },
          ],
        },
        {
          heading: '15. Third Party Links',
          content: ["Our Site contains links to third-party websites. We are not responsible for their privacy practices."],
        },
        {
          heading: '16. International Transfers',
          content: ["Your information may be processed in the United States or other jurisdictions with different data protection laws."],
        },
        {
          heading: '17. Changes to This Policy',
          content: ["We may update this Privacy Policy from time to time. The 'Last Updated' date reflects the most recent revision. Continued use of the Site constitutes acceptance of the updated Policy."],
        },
      ]}
    />
  );
}
