/**
 * Derive a sponsor logo (favicon) for a sweepstakes from its program/title text.
 * Nominative fair use — the sponsor's own mark to identify who runs the giveaway.
 * Most sweeps are AAdvantage team "Perks" (American Airlines), plus a few hotels.
 * Used by the watcher (so new sweeps get a logo on ingest) and any backfill.
 */
const SPONSORS: [RegExp, string][] = [
  [/aadvantage|american airlines/i, 'aa.com'],
  [/hilton/i, 'hilton.com'],
  [/best western/i, 'bestwestern.com'],
  [/marriott|bonvoy/i, 'marriott.com'],
  [/hyatt/i, 'hyatt.com'],
  [/\bihg\b/i, 'ihg.com'],
  [/wyndham/i, 'wyndhamhotels.com'],
  [/delta/i, 'delta.com'],
  [/united/i, 'united.com'],
  [/southwest/i, 'southwest.com'],
  [/jetblue/i, 'jetblue.com'],
  [/alaska|atmos/i, 'alaskaair.com'],
]

export function sweepstakesSponsorLogo(program: string | null, title: string | null): string | null {
  const hay = `${program ?? ''} ${title ?? ''}`
  const m = SPONSORS.find(([re]) => re.test(hay))
  return m ? `https://www.google.com/s2/favicons?domain=${m[1]}&sz=128` : null
}
