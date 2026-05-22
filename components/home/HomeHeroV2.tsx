import Link from "next/link";
import Image from "next/image";

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
    <section className="bg-white py-16 md:py-24">
      <div className="rg-container px-6 md:px-8">
        {/* Asymmetric 12-col grid on desktop — copy 7/12, mascot 5/12.
            On mobile + small tablet the mascot is hidden so the H1 has
            full breathing room; the elevated treatment leans on
            whitespace + typography there. */}
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-12">
          <div className="flex flex-col items-start space-y-6 md:col-span-7 md:space-y-8">
            <p className="font-ui text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-primary)]">
              Smart travel with points
            </p>

            {/* Display-scale hero. One dramatic Playfair moment per page. */}
            <h1 className="rg-display text-left">
              Because paying full price is overrated.
            </h1>

            <p className="max-w-xl font-body text-lg text-[var(--color-text-secondary)] md:text-xl">
              Alerts on the points moves actually worth caring about. We track the chaos so you don&rsquo;t have to.
            </p>

            <Link
              href="/alerts"
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

          {/* Mascot — desktop/tablet only. Soft radial aura behind her
              reads as a glow, not a card. Gentle float animation (4s).
              Hidden under md to keep the mobile hero clean + elevated. */}
          <div className="relative hidden md:col-span-5 md:flex md:justify-center">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                aria-hidden
                className="h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(107,45,143,0.28), rgba(212,175,55,0.10) 55%, transparent 80%)",
                }}
              />
            </div>
            <Image
              src="/mascot.png"
              alt="Crazy4Points mascot — your travel friend"
              width={1024}
              height={1024}
              priority
              sizes="(min-width: 768px) 360px, 0px"
              className="relative h-auto w-[320px] motion-safe:animate-[c4p-float_4s_ease-in-out_infinite] lg:w-[380px]"
            />
          </div>
        </div>
      </div>

      {/* Float keyframe — scoped to the hero so it doesn't leak globally. */}
      <style>{`
        @keyframes c4p-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
      `}</style>
    </section>
  );
}
