export const HOW_TO_PROMPT = `
═══════════════════════════════════════════════════════════
CONTENT TYPE: HOW-TO
═══════════════════════════════════════════════════════════

A guide teaching the reader to DO a specific points/miles task. Beginner
to intermediate. The reader will follow along — make the steps work.

STRUCTURE
1. Goal in one sentence: "By the end of this you'll have [concrete outcome]."
2. Time investment: 5 min / 30 min / evening project.
3. Prerequisites: which accounts, cards, or status you need before starting.
4. Numbered step-by-step. Each step = one action. Be specific:
   • Where to click (which menu, which page)
   • What to enter (real example values)
   • What you should see (success indicator)
5. One specific worked example using real numbers.
6. Top 2-3 common mistakes + how to avoid them.
7. Troubleshooting: "If X happens, do Y." Cover the realistic failure modes.
8. Where to verify each step officially (program portal, card-issuer page).

LENGTH: 800-1200 words depending on complexity.

HARD RULES
• Steps must actually work today. If a flow has changed (e.g. Chase
  redesigned the transfer interface in Q1 2026), reflect the current state
  from program_context, not training memory.
• Numbered list, not bullet list, for the main steps.
• If a step requires waiting (transfer time, statement post), call out the
  expected duration ("Transfers post within 1-3 minutes for Hyatt; up to
  24 hours for Marriott").
• When linking to official portals, use the exact URL — no shortened links.
`
