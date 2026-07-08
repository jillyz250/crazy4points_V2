import Link from "next/link";
import NewsletterSignup from "@/components/home/NewsletterSignup";
import { issueTitle, type PublicNewsletterListItem } from "@/utils/content/publicNewsletters";

function fmt(d: string | null): string {
  return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";
}

/** Variant 1 — conversion-first: value + inline signup, latest issue as social proof. */
export default function HomeNewsletterSubscribe({ latest }: { latest: PublicNewsletterListItem }) {
  return (
    <section className="bg-[var(--color-primary)] py-14 md:py-20">
      <div className="rg-container px-6 md:px-8">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] !text-[var(--color-accent)]">Free newsletter</p>
            <h2 className="mt-3 font-display text-3xl font-semibold !text-white md:text-4xl">Never miss a points move</h2>
            <p className="mt-3 font-body !text-white/85">
              The best transfer bonuses, award sweet spots, and deals worth your miles, delivered to your inbox. Join the list.
            </p>
            <div className="mt-6">
              <NewsletterSignup />
            </div>
          </div>

          <Link href={`/newsletter/${latest.slug}`} className="block rounded-[var(--radius-card)] bg-white p-6 shadow-lg transition-shadow hover:shadow-xl">
            <p className="font-ui text-xs font-semibold uppercase tracking-[0.12em] !text-red-600">Latest Issue</p>
            <p className="mt-2 font-body text-xs text-[var(--color-text-secondary)]">{latest.issue_number ? `Issue #${latest.issue_number} · ` : ""}{fmt(latest.sent_at)}</p>
            <p className="mt-1 font-display text-xl font-semibold text-[var(--color-primary)]">{issueTitle(latest)}</p>
            {latest.hero_kicker && <p className="mt-2 font-body text-[var(--color-text-secondary)]">{latest.hero_kicker}</p>}
            <span className="mt-3 inline-block font-ui text-sm font-semibold text-[var(--color-primary)]">Read it &rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
