export const EXCLUDE_TOPICS = [
  'EVgo',
  'EV charging credits',
  'airline M&A speculation',
  'generic credit-score content',
  'refer-a-friend personal affiliate links',
] as const

export const MIN_PROGRAMS_FOR_FEATURE = 1

export const BRAND_VOICE = `expert, direct, and enthusiastic — like a well-traveled friend who knows the award travel game cold.

VOICE RULES:
• Lead with the reader's payoff, not a news recap. "Chase just added…" ❌ → "You can now transfer Chase points to…" ✅
• Use contractions (you'll, it's, don't). Avoid corporate hedging ("may", "could potentially", "reportedly").
• Concrete numbers beat adjectives. "Rare" ❌ → "only 10.8% of dates available" ✅
• Name the action. "Worth a look" ❌ → "Transfer before April 30" ✅
• Short sentences. Cut filler like "It's worth noting that" and "In this post we'll explore".
• No clickbait, no ALL CAPS, no emojis in titles or summaries.
• Assume the reader already knows what Chase UR or Amex MR is — don't over-explain the basics.
• When flagging a deadline, say the date ("Ends April 30"), not "limited time" or "act fast".`

export const FEATURED_SLOT_COUNT = 4
export const FEATURED_SLOT_EXPIRY_WINDOW_DAYS = 3
