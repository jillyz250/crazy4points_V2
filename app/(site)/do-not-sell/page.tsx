import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: 'Do Not Sell or Share My Personal Information | crazy4points',
  description: 'California residents: exercise your CCPA/CPRA rights to opt out of the sale or sharing of personal information.',
};

const INTRO = `This page is provided in accordance with the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA). It explains your rights as a California resident and provides a method to exercise your choices regarding the 'sale' or 'sharing' of personal information. Crazy4Points.com is operated by ThankYouDeals Inc.`;

export default function DoNotSellPage() {
  return (
    <LegalPage
      title="Do Not Sell or Share My Personal Information"
      effectiveDate="January 1, 2026"
      lastUpdated="March 31, 2026"
      intro={INTRO}
      sections={[
        {
          heading: '1. Your Rights Under CCPA/CPRA',
          content: [
            'California residents have the right to:',
            { type: 'list', items: ['Request that we do not sell or share their personal information', 'Request access to the personal information we collect', 'Request deletion of personal information (subject to legal exceptions)', 'Correct inaccurate personal information', "Limit the use of sensitive personal information (we do not collect sensitive data)"] },
            'These rights apply to personal information collected online and offline.',
          ],
        },
        {
          heading: '2. Categories of Personal Information We Collect',
          content: [
            'We collect limited personal information, which may include:',
            { type: 'list', items: ['Identifiers such as IP address', 'Device information', 'Browser type and settings', 'Online activity such as pages viewed and referral sources', "Cookie and tracking identifiers used for analytics or affiliate attribution"] },
            'We do not sell personal information for monetary consideration. However, under California law, certain data practices — such as sharing identifiers with analytics or affiliate partners — may be considered a 'sale' or 'sharing' of personal information.',
          ],
        },
        {
          heading: '3. How to Opt Out of Sale or Sharing',
          content: [
            'If you are a California resident, you may opt out of the sale or sharing of your personal information by contacting us at support@thankyoudeals.com. Please include your request to opt out, your state of residence, and any relevant details to help us process your request.',
            'We will respond to verifiable consumer requests within the timeframes required by applicable law (generally within 45 days). We may need to verify your identity before completing your request.',
          ],
        },
        {
          heading: '4. Cookies, Analytics & Affiliate Tracking',
          content: [
            'Some cookies used on our Site may be considered 'sharing' under California law. These include analytics cookies (e.g., Google Analytics), affiliate tracking cookies, and measurement tools used to attribute referrals.',
            'You may opt out by:',
            { type: 'list', items: ['Using our cookie banner to decline non-essential cookies', 'Adjusting browser settings to block tracking', "Emailing us to request a CCPA opt-out"] },
          ],
        },
        {
          heading: '5. Authorized Agents',
          content: ["California residents may designate an authorized agent to submit requests on their behalf. We may require proof of authorization and verification of your identity."],
        },
        {
          heading: '6. Non-Discrimination',
          content: [
            'We will not discriminate against you for exercising your CCPA/CPRA rights. This means we will not:',
            { type: 'list', items: ['Deny you services', 'Charge different prices', "Provide a different level of service"] },
          ],
        },
        {
          heading: '7. Children's Data',
          content: ["We do not knowingly collect personal information from children under 16. We do not sell or share personal information of minors."],
        },
        {
          heading: '8. Updates to This Page',
          content: ["We may update this page from time to time. The 'Last Updated' date reflects the most recent revision."],
        },
      ]}
    />
  );
}
