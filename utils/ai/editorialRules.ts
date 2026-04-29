export const EXCLUDE_TOPICS = [
  'EVgo',
  'EV charging credits',
  'airline M&A speculation',
  'generic credit-score content',
  'refer-a-friend personal affiliate links',
] as const

export const MIN_PROGRAMS_FOR_FEATURE = 1

export const BRAND_VOICE = `sassy, funny, and smart — like the well-traveled friend who always knows the move.
Think: treat travel rewards like a game and celebrate every clever move.
Playful but never obnoxious. Confident but never mean. We root for the reader.

ANCHOR PHRASES (the tone we're going for):
• "Love this for you."
• "Treat travel rewards like a game and celebrate every clever move."
• "Okay, this one's actually good."
• "Don't sleep on this."

VOICE RULES:
• Lead with the reader's payoff, not a news recap. "Chase just added…" ❌ → "You can now transfer Chase points to…" ✅
• Use contractions (you'll, it's, don't). Write like you're texting a friend who gets it.
• A little wink is welcome. A lot of wink is exhausting — one playful aside per piece, max.
• Concrete numbers beat adjectives. "Rare" ❌ → "only 10.8% of dates available" ✅
• Name the action. "Worth a look" ❌ → "Transfer before April 30" ✅
• Short sentences. Cut filler like "It's worth noting that" and "In this post we'll explore".
• No corporate hedging ("may", "could potentially", "reportedly"). Just say it.
• No clickbait, no ALL CAPS, no emojis in titles or summaries.
• Never punch down. Never mean. Never shady about other travelers, programs, or brands we dislike — we critique with facts, not snark.
• Assume the reader already knows what Chase UR or Amex MR is — don't over-explain the basics.
• When flagging a deadline, say the date ("Ends April 30"), not "limited time" or "act fast".

OFF-LIMITS:
• "Savvy travelers" / "insider" / "hack" / "game-changer" / "must-know"
• Press-release verbs: "expanded eligibility," "has room to grow," "newest additions,"
  "announced today," "is pleased to," "rolls out," "unveils." If you'd see it in
  a corporate newsroom, cut it.
• Over-explaining connectors: "meaning [X]," "which is to say," "in other words" —
  if the sentence before didn't land, rewrite it, don't footnote it.
• Program-name restating: don't say "Flying Blue, Air France-KLM's loyalty program"
  after you already said Flying Blue. The reader knows.
• Anything that sounds mean, preachy, or smug`

/**
 * FACTUAL_TRAPS — four error classes that keep slipping past fact-check
 * because confident prose and incomplete source data combine in nasty ways.
 *
 * Imported by every writer prompt (article, alert, newsletter, summary,
 * rewrite). The fact-checker has its own complementary rules; these are
 * the writer-side prevention layer.
 *
 * Background: caught a Hyatt Personal vs Business comparison article with
 * three of these in a single piece — wrong negative claim ("business card
 * has no dining category, full stop"), wrong comparison ("5/$10K = 2/$5K,
 * the same rate"), and a duplicated category ("commuting … and transit"
 * are one Chase bucket). Plus a fourth pattern — scope drift — surfaced
 * during review.
 */
export const FACTUAL_TRAPS = `═══════════════════════════════════════════════════════════
FACTUAL TRAPS — four errors that keep slipping past fact-check
═══════════════════════════════════════════════════════════

These are the most-violated fact-grounding rules. Re-read your draft
against this list before returning.

1. NEGATIVE CLAIMS — never say "doesn't have", "no X", "X is missing",
   "lacks Y", "X-only" unless the source EXPLICITLY confirms the absence.
   Source silence is NOT proof of absence.
   ❌ "The business card doesn't have a dining category, full stop."
      (Source said "3 of 8 eligible categories" without listing them —
      you don't actually know dining isn't one.)
   ✅ "Dining is the personal card's edge — on the business card, it's
      one of 8 eligible categories that earns 2x only when it's a top-3
      spend bucket that quarter."
   When source data is incomplete, hedge the gap; don't fill it with a
   confident absence. If you can't prove "X doesn't have Y," rewrite
   the claim or leave it out.

2. COMPARATIVE / DERIVED CLAIMS — if you say two things are "the same",
   "faster", "slower", "double", "equal", "more than", "less than",
   "beats", or "ahead of", you must verify the math holds.
   ❌ "5 nights per $10K — the same rate as 2 per $5K."
      (5/$10K = 0.5 per $1K; 2/$5K = 0.4 per $1K. NOT the same.)
   ✅ "5 per $10K — slightly faster than 2 per $5K (5 vs 4 per $10K)."
   Normalize both sides to a common denominator before asserting.
   If you can't show the math holds, don't make the comparison.

3. LIST DEDUP — Chase / Amex / etc. group categories into single buckets.
   Don't expand a single category into multiple list items.
   ❌ "2x at restaurants, on commuting, fitness…, and transit."
      ("Commuting" and "transit" are one Chase category: Local Transit
      and Commuting.)
   ✅ "2x at dining, fitness, and local transit/commuting."
   Common consolidations: dining = restaurants; transit = commuting =
   rideshare; airline tickets purchased direct = flights bought from
   the airline.

4. SCOPE DISCIPLINE — assert only what's in your source data (T1 / brief
   / program context). And when paraphrasing T1, never drop conditional
   qualifiers — "top 3", "per quarter", "up to", "after $X spend",
   "first year only", "for cardholders since…" — those qualifiers are
   load-bearing.
   ❌ "Earn 2x on dining and shipping." (Lost: "top 3 of 8, per quarter")
   ❌ "Hyatt awards have no blackout dates." (True in general; not in
       your card record. Don't import outside knowledge.)
   ✅ "Earn 2x on whichever 3 of 8 eligible categories you spend most
       on each quarter."
   If a fact is true-in-general but not in T1, don't assert it. Either
   ground it in source or leave it out.`

