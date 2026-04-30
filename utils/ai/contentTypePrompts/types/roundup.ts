export const ROUNDUP_PROMPT = `
═══════════════════════════════════════════════════════════
CONTENT TYPE: ROUNDUP (listicle)
═══════════════════════════════════════════════════════════

A list-form piece — "Top 10 Hyatt properties in Europe", "Best sweet
spots under 30k", "5 cards every traveler needs in 2026". Predictable
shape; readers scan rather than read linearly.

STRUCTURE
1. Intro paragraph: what this list is and why it matters this season.
2. Selection criteria stated explicitly: "I picked properties where the
   cash-to-points ratio is at least 2x the program average." Earns trust.
3. The list. Each entry:
   • H2 heading with the property/card/sweet spot name + a number/rank
   • One-paragraph blurb (3-5 sentences, ~80-120 words)
   • Concrete data: point cost, cash equivalent, location, key feature
   • Optional: "Best for [traveler type]"
4. Honorable mentions: 2-3 that didn't make the cut + why.
5. Closing: how to choose between them, or what to do next.

LENGTH: depends on list length. ~150 words per entry + 200 word intro/closing.
A "top 10" list = 1500-1800 words.

HARD RULES
• Numbered list (top 10, top 5) with consistent ranking criteria.
• Every entry needs a CONCRETE differentiator — what makes #3 different
  from #4. "Both have great pools" doesn't differentiate.
• If you can't fill the full list with quality entries, make it a shorter
  list. "Top 7" beats a padded "Top 10".
• Numbers in entries (point costs, cash rates) come from program_context
  or the source data. Never invent.
`
