import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: 'Accessibility Statement | crazy4points',
  description: 'Our commitment to making crazy4points.com accessible to all users, including those with disabilities.',
};

const INTRO = `ThankYouDeals Inc. ("Company," "we," 'our,' or "us") is committed to providing an inclusive and user-friendly experience for all visitors to Crazy4Points.com (the "Site"), including individuals with disabilities. We strive to follow the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.`;

export default function AccessibilityPage() {
  return (
    <LegalPage
      title="Accessibility Statement"
      effectiveDate="January 1, 2026"
      lastUpdated="March 31, 2026"
      intro={INTRO}
      sections={[
        {
          heading: '1. Our Commitment',
          content: [
            'We are committed to making our Site accessible and usable for everyone. Our ongoing efforts include:',
            { type: 'list', items: ['Designing pages with clear structure and semantic HTML', 'Ensuring keyboard navigability', 'Maintaining sufficient color contrast', 'Supporting screen readers and assistive technologies', 'Providing descriptive alt text for meaningful images', 'Avoiding reliance on color alone to convey information', "Using automated testing tools and manual reviews to identify accessibility issues"] },
          ],
        },
        {
          heading: '2. Continuous Improvement',
          content: ["Accessibility is an ongoing process. As our content and features evolve, we continue to review and enhance accessibility across the Site. Some areas may still be in progress, and we welcome feedback to help us improve."],
        },
        {
          heading: '3. Third Party Content',
          content: ["Our Site may include third-party tools, widgets, or embedded content. We do not control the accessibility of these external platforms, but we encourage providers to follow accessibility best practices."],
        },
        {
          heading: '4. Feedback & Assistance',
          content: [
            'If you encounter accessibility barriers or need assistance accessing content, please contact us at support@thankyoudeals.com. Please include:',
            { type: 'list', items: ['A description of the issue', 'The page or feature where it occurred', "Any assistive technology you were using (optional)"] },
            'We aim to respond to accessibility inquiries within 5–10 business days.',
          ],
        },
        {
          heading: '5. Alternative Access',
          content: ["If you need information from the Site in an alternative format, we will provide reasonable accommodations upon request."],
        },
        {
          heading: '6. Updates to This Accessibility Statement',
          content: ["We may update this Accessibility Statement periodically to reflect improvements or changes in our accessibility practices. The 'Last Updated' date indicates the most recent revision."],
        },
      ]}
    />
  );
}
