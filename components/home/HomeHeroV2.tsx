import Link from "next/link";

export type HeroPhoto = { image_url: string; title: string; category: string | null };

interface Props {
  lastUpdated: string | null;
  photos?: HeroPhoto[];
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// One hero photo tile — rounded, cover-fit, with a soft scrim + category chip.
function HeroTile({ photo, className }: { photo: HeroPhoto; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[var(--radius-card)] shadow-[0_12px_30px_-12px_rgba(74,32,95,0.4)] ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.image_url} alt={photo.title} loading="eager" decoding="async" className="h-full w-full object-cover" />
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      {photo.category && (
        <span className="absolute left-2.5 top-2.5 rounded-full bg-black/50 px-2 py-0.5 font-ui text-[0.6rem] uppercase tracking-wide text-white backdrop-blur-sm">
          {photo.category}
        </span>
      )}
    </div>
  );
}

export default function HomeHeroV2({ lastUpdated, photos = [] }: Props) {
  const timestamp = formatTimestamp(lastUpdated);
  const hasGrid = photos.length >= 3;

  return (
    <section className="bg-gradient-to-br from-[var(--color-background-soft)] via-white to-[var(--color-background-soft)] py-12 md:py-16">
      <div className="rg-container px-6 md:px-8">
        <div className={`mx-auto grid max-w-6xl items-center gap-8 ${hasGrid ? "md:grid-cols-2 md:gap-12" : "max-w-3xl"}`}>
          {/* Left — headline + single clean CTA */}
          <div className={`flex flex-col gap-5 ${hasGrid ? "text-center md:text-left" : "items-center text-center"}`}>
            <p className="font-ui text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-primary)]">
              Smart travel with points
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-[var(--color-primary)] md:text-5xl">
              Because paying full price is overrated.
            </h1>
            <p className="max-w-xl font-body text-lg text-[var(--color-text-secondary)] md:text-xl">
              Alerts on the points moves actually worth caring about. We track the chaos so you don&rsquo;t have to.
            </p>
            {/* "Start here" -> the curated /start-here page. No directional arrow:
                on the split layout it read like it pointed at the photos. */}
            <div className={`flex ${hasGrid ? "justify-center md:justify-start" : "justify-center"}`}>
              <Link
                href="/start-here"
                className="inline-flex items-center rounded-md bg-[var(--color-accent)] px-7 py-3.5 font-ui text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)] shadow-sm transition hover:bg-[var(--color-accent-hover)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              >
                Start here
              </Link>
            </div>
            {timestamp && (
              <p className="font-ui text-xs uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
                Updated {timestamp}
              </p>
            )}
          </div>

          {/* Right — experience photo grid (one tall + two stacked). */}
          {hasGrid && (
            <div className="grid h-[300px] grid-cols-2 grid-rows-2 gap-2.5 md:h-[380px] md:gap-3">
              <HeroTile photo={photos[0]} className="row-span-2" />
              <HeroTile photo={photos[1]} />
              <HeroTile photo={photos[2]} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
