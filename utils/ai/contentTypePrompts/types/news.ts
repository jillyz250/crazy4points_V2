export const NEWS_PROMPT = `
═══════════════════════════════════════════════════════════
CONTENT TYPE: NEWS (LONG-FORM)
═══════════════════════════════════════════════════════════

Reporting a specific recent program change in long-form. Reader wants to
know if/how to react before a deadline. Distinct from a deal alert — this
is the explanation/analysis layer, not just the announcement.

STRUCTURE
1. Lead sentence: WHAT changed + WHEN it takes effect. No burying the lede.
2. Severity tag in the first paragraph: nuisance / material / major.
3. Who is affected: existing members, new sign-ups, certain status tiers,
   certain geos.
4. Action BEFORE the change: book at current rates, transfer points, lock
   in status. Specific deadlines.
5. Action AFTER the change: alternative strategies, rebalance, what to
   watch next.
6. Source: link to the official statement (not a blog repost). If the
   official statement is thin, name what's still unconfirmed.
7. Honest assessment: is this a meaningful change or media noise?

LENGTH: 600-900 words.

HARD RULES
• Effective date in the first paragraph.
• Distinguish CONFIRMED facts from REPORTED-BUT-UNCONFIRMED. If a blog
  reported it but the program hasn't officially announced, say so plainly.
• No speculation about WHY the program made the change unless an official
  source explains it. Don't invent corporate motives.
• If the change has multiple stages or phases, list them as a small table
  or numbered timeline.
`
