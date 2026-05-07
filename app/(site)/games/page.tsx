import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Games — crazy4points',
  description:
    'A daily rotation of small browser games for points-and-miles travelers. New puzzle every day. Anonymous, free, no login.',
};

type GameCard = {
  slug: string;
  name: string;
  day: string;
  tagline: string;
  description: string;
  status: 'live' | 'soon';
  emoji: string;
};

const GAMES: GameCard[] = [
  {
    slug: 'middle-seat',
    name: 'Middle Seat',
    day: 'Friday',
    tagline: 'A logic-puzzle of seat assignments.',
    description:
      "Read the case. Drag passengers to seats. Satisfy every constraint as fast as you can — fastest tier is First Class Suite arriving early. Slowest is the back-row middle with a broken TV.",
    status: 'live',
    emoji: '✈️',
  },
  {
    slug: 'code-crack',
    name: 'Code Crack',
    day: 'Monday',
    tagline: 'IATA airport-code trivia.',
    description:
      "Three letters, one airport. Type the city given the code, or the code given the city. Streak-based.",
    status: 'soon',
    emoji: '🔤',
  },
  {
    slug: 'routle',
    name: 'Routle',
    day: 'Tuesday',
    tagline: 'Guess the mystery route.',
    description:
      "Six clues, dripping out one at a time: distance, alliance, hub, partner, runway count, mile cost. Guess in fewest clues.",
    status: 'soon',
    emoji: '🗺️',
  },
  {
    slug: 'pyramid',
    name: 'Pyramid',
    day: 'Wednesday',
    tagline: 'Pick the better redemption.',
    description:
      "Six rungs. Two redemptions per rung. Pick the higher cents-per-point value to climb. Wrong answer drops you back down.",
    status: 'soon',
    emoji: '🏔️',
  },
  {
    slug: 'layover',
    name: 'Layover',
    day: 'Thursday',
    tagline: 'Three hours at HKG. Where do you go?',
    description:
      "Daily airport scenario. Pick the lounge, the dim sum, the shower pod, or the quiet zone. See community % + Jill's pick.",
    status: 'soon',
    emoji: '🛫',
  },
  {
    slug: 'fare-class',
    name: 'Fare Class Decoder',
    day: 'Saturday',
    tagline: "Five fare codes. Sort them.",
    description:
      "Drag the J / Y / I / Z codes into the right slot: paid biz, upgrade-eligible, award F, and friends. Different airline each day.",
    status: 'soon',
    emoji: '🎟️',
  },
];

const dayOrder: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function todayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

export default function GamesHubPage() {
  const today = todayName();
  const games = [...GAMES].sort((a, b) => {
    // Today's game first; then live; then by day order.
    if (a.day === today) return -1;
    if (b.day === today) return 1;
    if (a.status !== b.status) return a.status === 'live' ? -1 : 1;
    return dayOrder[a.day] - dayOrder[b.day];
  });

  return (
    <div className="rg-container py-10">
      <header className="mb-8 max-w-2xl">
        <p className="font-ui text-xs uppercase tracking-widest text-[color:var(--color-text-secondary)] mb-2">
          c4p Games
        </p>
        <h1 className="text-4xl font-display text-[color:var(--color-primary)] mb-3">
          A daily puzzle for travelers.
        </h1>
        <p className="text-[color:var(--color-text-secondary)]">
          Six small games on rotation, one per weekday. Anonymous, free, no login. New puzzle every day.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => {
          const isToday = g.day === today;
          const isLive = g.status === 'live';
          const card = (
            <div
              className={[
                'h-full p-5 rounded-[var(--radius-card)] border transition flex flex-col',
                isToday && isLive
                  ? 'bg-gradient-to-br from-amber-50 to-white border-amber-300 shadow-md'
                  : isLive
                  ? 'bg-white border-[color:var(--color-border-soft)] hover:shadow-md hover:border-[color:var(--color-primary)]/40'
                  : 'bg-[color:var(--color-background-soft)] border-[color:var(--color-border-soft)] opacity-75',
              ].join(' ')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-3xl" aria-hidden>
                  {g.emoji}
                </div>
                {isToday && isLive ? (
                  <span className="text-[10px] font-ui uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Today
                  </span>
                ) : isLive ? (
                  <span className="text-[10px] font-ui uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Live
                  </span>
                ) : (
                  <span className="text-[10px] font-ui uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                    Coming soon
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-display text-[color:var(--color-primary)] mb-1">
                {g.name}
              </h2>
              <p className="text-xs font-ui uppercase tracking-wide text-[color:var(--color-text-secondary)] mb-3">
                {g.day}s · {g.tagline}
              </p>
              <p className="text-sm text-[color:var(--color-text-primary)] flex-1 mb-4">
                {g.description}
              </p>
              {isLive ? (
                <span className="rg-btn-primary text-sm px-4 py-2 self-start">▶ Play today&apos;s puzzle</span>
              ) : (
                <span className="text-xs text-[color:var(--color-text-secondary)] font-ui italic">
                  In development
                </span>
              )}
            </div>
          );
          return isLive ? (
            <Link
              key={g.slug}
              href={`/games/${g.slug}`}
              className="block focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] rounded-[var(--radius-card)]"
            >
              {card}
            </Link>
          ) : (
            <div key={g.slug}>{card}</div>
          );
        })}
      </div>

      <footer className="mt-12 text-center text-xs text-[color:var(--color-text-secondary)] font-ui">
        Got an idea for a game? Email{' '}
        <a href="mailto:hello@crazy4points.com" className="underline">
          hello@crazy4points.com
        </a>
        .
      </footer>
    </div>
  );
}
