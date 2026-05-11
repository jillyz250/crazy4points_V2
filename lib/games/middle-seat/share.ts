import type { Tier } from './types';

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function buildShareString(date: string, tier: Tier, seconds: number): string {
  const monthDay = date
    .split('-')
    .slice(1)
    .map((n) => Number(n))
    .join('/');
  return `c4p Middle Seat ${monthDay}\n${tier.emoji} ${tier.name} — ${formatTime(seconds)}\nhttps://crazy4points.com/games/middle-seat`;
}
