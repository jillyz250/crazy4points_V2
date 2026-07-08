import Link from "next/link";
import { issueTitle, type PublicNewsletterListItem } from "@/utils/content/publicNewsletters";

function fmt(d: string | null): string {
  return d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) : "";
}

/** Homepage teaser for the latest published newsletter issue. */
export default function HomeNewsletterBand({ latest }: { latest: PublicNewsletterListItem }) {
  return (
    <section className="bg-[var(--color-background-soft)] py-12 md:py-16">
      <div className="rg-container px-6 md:px-8">
        <div className="mb-7 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-[var(--color-primary)] md:text-2xl">
            From the newsletter
          </h2>
          <Link
            href="/newsletter"
            className="shrink-0 font-ui text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)]"
          >
            Browse all issues &rarr;
          </Link>
        </div>
        <Link
          href={`/newsletter/${latest.slug}`}
          className="block rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-6 shadow-[var(--shadow-soft)] transition-colors hover:border-[var(--color-primary)]"
        >
          <p className="font-body text-xs text-[var(--color-text-secondary)]">
            {latest.issue_number ? `Issue #${latest.issue_number} · ` : ""}{fmt(latest.sent_at)}
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-[var(--color-primary)] md:text-xl">
            {issueTitle(latest)}
          </p>
          {latest.hero_kicker && (
            <p className="mt-2 font-body text-[var(--color-text-secondary)]">{latest.hero_kicker}</p>
          )}
          <span className="mt-3 inline-block font-ui text-sm font-semibold text-[var(--color-primary)]">
            Read this issue &rarr;
          </span>
        </Link>
      </div>
    </section>
  );
}
