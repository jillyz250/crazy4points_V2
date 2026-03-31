import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: 'Terms of Service | crazy4points',
  description: 'Terms and conditions for using crazy4points.com.',
};

const INTRO = `Welcome to Crazy4Points.com, operated by ThankYouDeals Inc. ("Company," "we," 'our,' or "us"). By accessing or using this website (the "Site"), you agree to these Terms of Service ("Terms"). If you do not agree, you must discontinue use of the Site.`;

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      effectiveDate="January 1, 2026"
      lastUpdated="March 31, 2026"
      intro={INTRO}
      sections={[
        {
          heading: '1. User Eligibility',
          content: ["You must be at least 18 years old to use this Site. By using the Site, you represent and warrant that you meet this requirement."],
        },
        {
          heading: '2. Use of the Site',
          content: [
            'You may use the Site only for lawful purposes and in accordance with these Terms. You agree not to:',
            { type: 'list', items: ['Access or use the Site for any unlawful purpose', 'Attempt to interfere with the Site's operation', 'Scrape, copy, or reproduce content without permission', 'Use automated tools (bots, crawlers) without authorization', "Attempt to gain unauthorized access to systems or data"] },
            'We reserve the right to suspend or terminate access at any time, without notice, for any reason, including violation of these Terms.',
          ],
        },
        {
          heading: '3. No Financial, Legal, or Professional Advice',
          content: ["All content on the Site is for informational purposes only. We do not provide financial advice, legal advice, tax advice, or investment recommendations. You are responsible for verifying any information before acting on it."],
        },
        {
          heading: '4. No Guarantee of Results',
          content: ["We do not guarantee any specific results, including approval for financial products, earning rewards or bonuses, achieving travel outcomes, or receiving specific credit limits or offers. All decisions made using information from the Site are your responsibility."],
        },
        {
          heading: '5. Affiliate Relationships',
          content: ["Crazy4Points participates in affiliate programs. Some links may earn us a commission at no additional cost to you. We do not guarantee approval for any credit card, eligibility for any loyalty program, or accuracy of third-party offers. Affiliate partners may change terms without notice."],
        },
        {
          heading: '6. Intellectual Property',
          content: ["All content, branding, design, and materials on the Site are owned by ThankYouDeals Inc. or licensed to us. You may not copy, reproduce, republish, or redistribute materials or use our trademarks without permission. You may share links to our content with proper attribution."],
        },
        {
          heading: '7. User Submissions (Future Features)',
          content: ["If the Site allows user accounts or submissions in the future: you retain ownership of your content, you grant us a license to display and operate it, you agree not to upload unlawful or harmful content, and we may remove content at our discretion."],
        },
        {
          heading: '8. Third Party Links',
          content: ["The Site contains links to third party websites. We are not responsible for their content, privacy practices, accuracy, or security. You access third party sites at your own risk."],
        },
        {
          heading: '9. Content Accuracy and Timeliness',
          content: ["Information on the Site may become outdated, inaccurate, or unavailable. We are under no obligation to update or maintain the accuracy of any content, including credit card offers, loyalty program rules, transfer ratios, bonus promotions, or travel deals. You should verify information directly with the relevant provider."],
        },
        {
          heading: '10. Disclaimer of Warranties',
          content: ["The Site is provided as is and as available without warranties of any kind. We do not guarantee accuracy, availability, reliability, or error-free operation. Use of the Site is at your own risk."],
        },
        {
          heading: '11. Limitation of Liability',
          content: ["To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages, loss of data, loss of profits, errors or inaccuracies, or third-party actions or offers. Our total liability will not exceed $100 USD."],
        },
        {
          heading: '12. Indemnification',
          content: ["You agree to indemnify and hold harmless ThankYouDeals Inc. from any claims arising from your use of the Site, your violation of these Terms, or your violation of any law or third-party rights."],
        },
        {
          heading: '13. Force Majeure',
          content: ["We are not liable for any failure or delay caused by events beyond our reasonable control, including internet outages, hosting failures, natural disasters, acts of war or terrorism, labor disputes, or third-party service failures."],
        },
        {
          heading: '14. Arbitration and Dispute Resolution',
          content: ["Any disputes arising out of or relating to these Terms or your use of the Site shall be resolved through binding arbitration in the State of New York, except where prohibited by law. You waive the right to participate in class actions or class-wide arbitration."],
        },
        {
          heading: '15. California Consumer Rights',
          content: ["California residents may have additional rights regarding their personal information. Please refer to our Privacy Policy and Do Not Sell or Share My Personal Information page for details."],
        },
        {
          heading: '16. Changes to the Site',
          content: ["We may modify, update, or discontinue any part of the Site at any time without notice."],
        },
        {
          heading: '17. Changes to These Terms',
          content: ["We may update these Terms periodically. The Last Updated date reflects the most recent revision. Continued use of the Site constitutes acceptance of updated Terms."],
        },
        {
          heading: '18. Governing Law',
          content: ["These Terms are governed by the laws of the State of New York, without regard to conflict of law principles."],
        },
      ]}
    />
  );
}
