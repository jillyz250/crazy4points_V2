/**
 * Rewrites an article body using ONLY a list of verified facts as constraints.
 *
 * Used after fact-check + web verification to produce a "clean" draft that
 * drops every claim the verifier couldn't ground. The result keeps the
 * article's voice and structure where possible but says fewer things —
 * just the things we can stand behind.
 *
 * Returns the new Markdown body.
 */
import Anthropic from '@anthropic-ai/sdk'
import { BRAND_VOICE } from './editorialRules'

const MODEL = 'claude-sonnet-4-6'

export interface VerifiedFact {
  /** Concise statement of the fact (e.g. "Park Hyatt Paris is Category 8"). */
  claim: string
  /** Optional supporting evidence (source quote or web search snippet). */
  evidence?: string | null
}

export interface RewriteFromFactsInput {
  type: 'newsletter' | 'blog'
  title: string
  pitch: string
  /** The current draft, used as a structural reference (NOT a source of facts). */
  current_body: string
  /** The only facts the rewrite is allowed to assert. */
  verified_facts: VerifiedFact[]
  /**
   * Authoritative program-page content (same format as the writer uses).
   * Provides additional grounded data the rewrite can pull from.
   */
  program_context?: string | null
}

export interface RewriteFromFactsResult {
  body: string
  written_by: string
}

function systemPrompt(type: 'newsletter' | 'blog'): string {
  const lengthRule =
    type === 'newsletter'
      ? `LENGTH: 120–180 words. One clean section, no headings.`
      : `LENGTH: 400–700 words. Two to four short sections with H2 (##) headings. Shorter than the original is FINE — quality > quantity.`

  return `You are the staff writer for crazy4points. Your job: rewrite a draft article using
ONLY the verified facts provided. The original draft contained factual errors that fact-checking
caught. You will produce a new, shorter, cleaner draft that says fewer things — but says them
right.

═══════════════════════════════════════════════════════════
WHAT TO PRESERVE FROM THE ORIGINAL DRAFT
═══════════════════════════════════════════════════════════

The original draft has flawed FACTS but probably has correct VOICE, COLOR, and STRUCTURE.
Don't strip those out trying to be safe. Specifically:

- **Voice and personality:** opening hooks, sentence rhythm, dry-warm tone, anchor phrases
  ("love this for you", "here's the move"), wink lines — KEEP these. They aren't claims;
  they don't need fact-grounding.
- **Travel/destination color:** sensory language about a city or experience ("a balcony at
  the Vendôme, two blocks from the square") — KEEP. This is voice, not fact.
- **Editorial picks (when grounded):** if the original picked a specific property and that
  property→category claim IS in VERIFIED_FACTS, KEEP the pick.
- **Structure:** if the original had three good sections, your rewrite should still have
  three good sections — just with the wrong facts swapped for general framing.

═══════════════════════════════════════════════════════════
HARD CONSTRAINTS (must-pass; the fact-checker WILL recheck the output)
═══════════════════════════════════════════════════════════

1. **DO NOT introduce any new factual claims** beyond what's in VERIFIED_FACTS or PROGRAM_CONTEXT.
   No specific property names, point amounts, dates, partners, or rates that aren't grounded
   in those two sources. If a fact you'd like to use isn't there, leave it out.

2. **Replace unsupported facts with general framing — DON'T just delete the section.**
   If the original draft had a paragraph about "Hyatt Centric Athens at Cat 4" and that
   specific property isn't in VERIFIED_FACTS, don't drop the whole paragraph. Rewrite it as
   "Cat 4 properties typically run 15K standard — search by city for what's available," and
   keep the surrounding voice/color intact. ONLY drop a section if it's 100% unsupported
   facts with no salvageable framing.

3. **Do NOT speculate.** No "may", "could", "likely", "is set to". Just say what you can stand
   behind, or don't say it.

4. **Keep general framing OK.** Rules of the program (categories, off-peak/standard/peak
   structure, etc.) from PROGRAM_CONTEXT are fine to use generically without naming specific
   properties.

5. **Voice + color paragraphs do NOT need a verified fact.** A paragraph that sets the scene
   ("first morning in Paris on espresso and almond croissants") is VOICE, not a factual claim.
   Don't try to fact-check it; the verifier doesn't either. Keep it.

═══════════════════════════════════════════════════════════
VOICE — same rules as the original writer
═══════════════════════════════════════════════════════════

${BRAND_VOICE}

Most-violated rules — re-read your output before returning:
- Lead with the reader payoff, not a news/program recap.
- Name the action with a date or threshold (no "worth confirming" / "check your issuer").
- Use contractions.
- Short, confident sentences. No "It's worth noting that…" / "In this post we'll…".
- Concrete numbers > adjectives.
- Off-limits words: "savvy travelers", "insider", "hack", "game-changer", "must-know",
  "worth noting", "act fast", "limited time", "don't miss".

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return Markdown only. No frontmatter, no surrounding prose, no code fences.
Do NOT repeat the title as an H1.
${lengthRule}

The result should be publishable as-is. If the verified facts are too thin to support a
publishable article (fewer than 3-4 distinct facts), produce a single tight paragraph
acknowledging what's true and what we can't yet confirm — don't pad with filler.`
}

export async function rewriteArticleFromFacts(
  input: RewriteFromFactsInput
): Promise<RewriteFromFactsResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[rewriteArticleFromFacts] ANTHROPIC_API_KEY missing — skipping')
    return null
  }

  const userContent = JSON.stringify(
    {
      brief: { type: input.type, title: input.title, pitch: input.pitch },
      current_body: input.current_body,
      verified_facts: input.verified_facts.map((f) => ({
        claim: f.claim,
        evidence: f.evidence ?? null,
      })),
      program_context: input.program_context ?? null,
    },
    null,
    2
  )

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: input.type === 'blog' ? 2500 : 800,
      system: systemPrompt(input.type),
      messages: [{ role: 'user', content: userContent }],
    })
    const block = message.content[0]
    if (!block || block.type !== 'text') return null
    const body = block.text.trim()
    if (!body) return null
    return { body, written_by: MODEL }
  } catch (err) {
    console.error('[rewriteArticleFromFacts] Sonnet call failed:', err)
    return null
  }
}
