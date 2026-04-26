/**
 * Reading-time estimate from an article body. Stored on the row at write time
 * so the public detail page doesn't recompute on every render.
 *
 * 225 wpm is the standard "leisurely reading" rate used by most CMS systems.
 * For a 1500-word post that's ~7 minutes — feels right for our voice.
 */
const WORDS_PER_MINUTE = 225;

export function computeReadingTimeMinutes(body: string | null | undefined): number {
  if (!body) return 1;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 1;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
