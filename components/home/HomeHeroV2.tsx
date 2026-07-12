import Link from "next/link";

interface Props {
  lastUpdated: string | null;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function HomeHeroV2({ lastUpdated }: Props) {
  const timestamp = formatTimestamp(lastUpdated);

  return (
    <section className="bg-gradient-to-br from-[var(--color-background-soft)] via-white to-[var(--color-background-soft)] py-12 md:py-16">
      <div className="rg-container px-6 md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center space-y-6 text-center md:space-y-8">
          <p className="font-ui text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-primary)]">
            Smart travel with points
          </p>

          {/* Display-scale hero — uses the .rg-display token (clamps
              2.5rem mobile / 4.5rem desktop, line-height 1.05,
              letter-spacing -0.02em). One dramatic Playfair moment
              per page, no decoration. */}
          <h1 className="rg-display">
            Because paying full price is overrated.
          </h1>

          <p className="max-w-2xl font-body text-lg text-[var(--color-text-secondary)] md:text-xl">
            Alerts on the points moves actually worth caring about. We track the chaos so you don&rsquo;t have to.
          </p>

          {/* "Start here" -> the curated /start-here page (find-your-why guide,
              the guide library, tool doors, and the newsletter signup). */}
          <Link
            href="/start-here"
            className="mt-2 inline-flex items-center rounded-md bg-[var(--color-accent)] px-7 py-3.5 font-ui text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)] shadow-sm transition hover:bg-[var(--color-accent-hover)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            Start here →
          </Link>

          {timestamp && (
            <p className="font-ui text-xs uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
              Updated {timestamp}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
