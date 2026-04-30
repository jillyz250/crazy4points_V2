export const SWEET_SPOT_PROMPT = `
═══════════════════════════════════════════════════════════
CONTENT TYPE: SWEET SPOT
═══════════════════════════════════════════════════════════

A piece about exceptional points value. Reader is shopping for outsized
redemption opportunities and wants to know if this one is worth chasing.

STRUCTURE
1. Lead with the math claim in the first 100 words. "X points buys Y; cash
   rate is Z." If a verified cash baseline (cash_rate_reference) is provided
   in the user payload, use it. Otherwise phrase value COMPARATIVELY (e.g.
   "typically books for $300-500/night cash; 30k points lands you in the
   upper range") — never invent a specific cents-per-point figure.
2. Why this is unusually good vs. the typical baseline for this program/category.
3. How to actually access it: transfer routes (incl. bonus_active partners),
   direct booking flow, partner programs.
4. Catches: blackouts, low availability, fuel surcharges, fees that erode value.
5. Best season / dates for finding availability.
6. Booking window: how far out can you book, when does inventory open.
7. One honest "what could go wrong" paragraph.

LENGTH: 600-900 words.

HARD RULES
• When cash_rate_reference is set, quote it AS the baseline. When it's not
  set, NEVER state a specific cpp number. Comparative phrasing only.
• If a 1:1 transfer partner has bonus_active, lead the call-to-action with it.
• No invented numbers. No invented blackouts. Source-text or program-page facts only.
`
