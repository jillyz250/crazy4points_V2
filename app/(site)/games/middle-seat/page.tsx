import type { Metadata } from 'next';
import MiddleSeatGame from '@/components/games/middle-seat/MiddleSeatGame';
import { fallbackPuzzleForDate, todayDateString, PUZZLE_ROTATION } from '@/lib/games/middle-seat/seed';
import { createAdminClient } from '@/utils/supabase/server';
import type { Puzzle } from '@/lib/games/middle-seat/types';

export const metadata: Metadata = {
  title: 'Middle Seat — crazy4points',
  description:
    "Daily seat-puzzle game. Place every passenger so all constraints are met — the faster you finish, the better your tier. Caviar to broken-TV last row, depending on you.",
};

export const dynamic = 'force-dynamic';

async function loadPuzzle(date: string): Promise<Puzzle> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('game_middleseat_puzzles')
      .select('date, layout_json, passengers_json')
      .eq('date', date)
      .maybeSingle();
    if (data && data.layout_json && data.passengers_json) {
      return {
        id: `db-${date}`,
        date,
        difficulty: 'medium',
        clues: [],
        layout: data.layout_json as Puzzle['layout'],
        passengers: data.passengers_json as Puzzle['passengers'],
      };
    }
  } catch {
    /* fall through to fallback rotation */
  }
  return fallbackPuzzleForDate(date);
}

export default async function MiddleSeatPage() {
  const date = todayDateString();
  const puzzle = await loadPuzzle(date);
  const allPuzzles = PUZZLE_ROTATION.map((p) => ({ ...p, date }));
  return <MiddleSeatGame puzzle={puzzle} allPuzzles={allPuzzles} />;
}
