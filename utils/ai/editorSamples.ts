/**
 * Curated voice samples for the Editor pass. Hand-picked published alerts
 * where the brand voice really lands — used to calibrate editAlertDraft
 * output. Keep this list small (3-5) and only add samples with voice you'd
 * want replicated. Do NOT include samples whose facts may be stale; the
 * Editor can pattern-match on numbers and propose invented claims.
 */

export interface EditorVoiceSample {
  title: string
  summary: string
  description: string
}

export const EDITOR_VOICE_SAMPLES: EditorVoiceSample[] = [
  {
    title: 'British Airways Avios: 40% Bonus — Ends April 27',
    summary:
      "Buying miles usually ranks somewhere between \"bad\" and \"regrettable.\" But when you're staring at an award you've already priced out and you're a handful of Avios short? A 40% bonus is how you close the gap without paying cash for the whole ticket.",
    description:
      'British Airways is selling Avios with 40% bonus through April 27. No transfer gymnastics, no partner-availability roulette — buy, book, done.\n\nBuying "just in case"? Don\'t. That\'s how you end up with a balance and no plan.',
  },
]
