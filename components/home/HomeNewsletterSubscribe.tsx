import { issueTitle, type PublicNewsletterListItem } from "@/utils/content/publicNewsletters";
import HomeNewsletterCard from "@/components/home/HomeNewsletterCard";

function fmt(d: string | null): string {
  return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";
}

/** Newsletter section — a single front-page preview + a subscribe CTA that opens
 *  the signup form in a modal (see HomeNewsletterCard). */
export default function HomeNewsletterSubscribe({ latest }: { latest: PublicNewsletterListItem }) {
  return (
    <HomeNewsletterCard
      title={issueTitle(latest)}
      issueLabel={latest.issue_number ? `No. ${latest.issue_number}` : "Latest"}
      dateLabel={fmt(latest.sent_at)}
      kicker={latest.hero_kicker ?? null}
      slug={latest.slug}
    />
  );
}
