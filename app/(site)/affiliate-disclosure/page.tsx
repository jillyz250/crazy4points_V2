import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: 'Affiliate Disclosure | crazy4points',
  description: 'How crazy4points uses affiliate links and earns compensation.',
};

const INTRO = `Crazy4Points.com is owned and operated by ThankYouDeals Inc. ("Company," "we," 'our,' or "us"). This Affiliate Disclosure explains how we use affiliate links and how we may earn compensation when you interact with certain links or offers on the Site. We are committed to transparency and want you to understand how affiliate relationships support our work.`;

export default function AffiliateDisclosurePage() {
  return (
    <LegalPage
      title="Affiliate Disclosure"
      effectiveDate="January 1, 2026"
      lastUpdated="March 31, 2026"
      intro={INTRO}
      sections={[
        {
          heading: '1. What Are Affiliate Links?',
          content: [
            'Some links on our Site are affiliate links, meaning we may earn compensation when you:',
            { type: 'list', items: ['Click a link', 'Sign up for a service', 'Apply for a financial product', 'Make a purchase', "Complete a qualifying action defined by the affiliate partner"] },
            'This comes at no additional cost to you. We may receive compensation for qualifying actions even if you do not complete a purchase.',
          ],
        },
        {
          heading: '2. How Affiliate Compensation Works',
          content: [
            'When you click an affiliate link, a tracking cookie or unique identifier may be used to attribute your action to our Site, track conversions, and confirm eligibility for commissions. These tracking methods do not directly identify you personally to us.',
          ],
        },
        {
          heading: '3. Not Financial Advice',
          content: [
            'Content on this Site is for informational purposes only and should not be considered financial advice, legal advice, or tax advice. You are responsible for evaluating any information before making decisions.',
          ],
        },
        {
          heading: '4. Our Commitment to Integrity',
          content: [
            'Affiliate compensation does not influence:',
            { type: 'list', items: ['The content we publish', 'The deals or offers we highlight', 'Our opinions or recommendations', "The order in which information appears"] },
            'We strive to provide accurate, unbiased, and helpful information.',
          ],
        },
        {
          heading: '5. Financial Products & Credit Card Offers',
          content: [
            'Some affiliate links relate to credit cards, banking products, loyalty programs, and travel rewards programs. We do not guarantee approval for any financial product, eligibility for any offer, or accuracy or availability of third-party terms. Always verify details directly with the provider.',
          ],
        },
        {
          heading: '6. Third Party Advertisers & Networks',
          content: [
            'We partner with various affiliate networks and advertisers. These third parties may use cookies or tracking pixels, collect limited technical data, and update or change offers without notice. We do not control third party tracking technologies.',
          ],
        },
        {
          heading: '7. Your Choices',
          content: [
            { type: 'list', items: ['Decline non-essential cookies through our cookie banner', 'Adjust your browser settings to block tracking', "Review our Cookie Policy for more details"] },
          ],
        },
        {
          heading: '8. Accuracy of Information',
          content: [
            'We make every effort to keep information accurate and up to date. However, offers may change without notice, terms may vary by provider, and promotions may expire. We are under no obligation to update outdated information.',
          ],
        },
      ]}
    />
  );
}
