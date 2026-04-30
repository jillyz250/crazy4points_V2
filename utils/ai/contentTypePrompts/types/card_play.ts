export const CARD_PLAY_PROMPT = `
═══════════════════════════════════════════════════════════
CONTENT TYPE: CARD PLAY
═══════════════════════════════════════════════════════════

A piece about extracting maximum value from a specific credit card or
benefit. Reader has the card (or is considering it) and wants ROI math.

STRUCTURE
1. Opening: which card + which specific benefit you're focusing on. One
   sentence stating the value claim ("This benefit alone covers your
   annual fee 3x over").
2. Mechanics: when and how the benefit triggers — anniversary date,
   calendar year, spend threshold, registration required.
3. Concrete worked example with REAL numbers ("$15K spend → second free
   night cert → Cat 4 weekend at Andaz Maui = $480 cash equivalent").
4. Stacking opportunities: combine with transfer bonuses, status, sister
   cards, milestone bonuses.
5. Annual fee math: who comes out ahead, who doesn't.
6. Common traps: expiration, blackout dates, restrictions, fine print.
7. Honest "who SHOULDN'T do this play" paragraph — credibility builder.

LENGTH: 700-1000 words.

HARD RULES
• Numbers (annual fees, point amounts, spend thresholds) must come from the
  card's official terms or the program_context block. NEVER invent.
• Use the card's exact official name on first mention.
• If you're recommending a stacking play that depends on holding multiple
  cards, name them. No vague "if you have other Chase cards" hedges.
`
