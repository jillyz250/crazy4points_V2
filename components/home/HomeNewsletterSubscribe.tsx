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
            <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] !text-[var(--color-accent)]">The insider list</p>
            <h2 className="mt-3 font-display text-3xl font-semibold !text-white md:text-4xl">Never miss a points move</h2>
            <p className="mt-3 font-body !text-white/85">
              The best transfer bonuses, award sweet spots, and deals worth your miles, delivered to your inbox. Join the list.
            </p>
            <div className="mt-6">
              <NewsletterSignup />
            </div>
          </div>

          {/* Styled to read like an actual newsletter front page: masthead +
              gold double-rule + dateline + serif lead story, on cream paper. */}
          <Link
            href={`/newsletter/${latest.slug}`}
            className="group block overflow-hidden rounded-[var(--radius-card)] transition-transform hover:-translate-y-1"
            style={{
              background: "#FBF8F1",
              backgroundImage: "repeating-linear-gradient(0deg, rgba(74,32,95,0.025) 0 1px, transparent 1px 28px)",
              boxShadow: "0 22px 48px -16px rgba(0,0,0,0.45)",
            }}
          >
            <div className="px-6 pt-5 pb-3 text-center" style={{ borderBottom: "3px double #C9A227" }}>
              <p className="font-ui text-[0.58rem] font-semibold uppercase tracking-[0.28em]" style={{ color: "#8A6A1E" }}>Crazy4Points presents</p>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight" style={{ color: "var(--color-primary)" }}>The Insider List</p>
              <p className="mt-1.5 font-ui text-[0.6rem] uppercase tracking-[0.18em]" style={{ color: "#6B6470" }}>
                {latest.issue_number ? `No. ${latest.issue_number}` : "Latest"} &middot; {fmt(latest.sent_at)}
              </p>
            </div>
            <div className="px-6 py-5">
              <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.16em]" style={{ color: "#C0392B" }}>Lead Story</p>
              <p className="mt-1.5 font-display text-xl font-bold leading-snug" style={{ color: "var(--color-primary)" }}>{issueTitle(latest)}</p>
              {latest.hero_kicker && <p className="mt-2 font-body text-sm" style={{ color: "#4A4A4A" }}>{latest.hero_kicker}</p>}
              <span className="mt-3 inline-flex items-center gap-1 font-ui text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                Read the full issue <span aria-hidden className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
