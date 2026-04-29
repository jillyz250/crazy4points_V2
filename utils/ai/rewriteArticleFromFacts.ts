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
import { logUsage } from './logUsage'
import { BRAND_VOICE, FACTUAL_TRAPS } from './editorialRules'

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
      ? `LENGTH: 120–180 words HARD MINIMUM. One clean section, no headings.`
      : `LENGTH: 400–700 words HARD MINIMUM. Two to four short sections with H2 (##) headings.

Shorter than the original is fine, but DON'T collapse the article. If you find yourself with only 200 words after dropping unsupported sections, you've over-pruned. Keep voice/color paragraphs, replace unsupported facts with general framing (e.g. "Cat 4 properties typically run 15K standard"), and write a complete article. A 2-sentence stub is a failure, not a quality decision.`

  return `You are the staff writer for crazy4points. Your job: rewrite a draft article using
ONLY the verified facts provided. The original draft contained factual errors that fact-checking
caught. You will produce a new, shorter, cleaner draft that says fewer things — but says them
right.

═══════════════════════════════════════════════════════════
WHAT TO PRESERVE FROM THE ORIGINAL DRAFT
═══════════════════════════════════════════════════════════

The original draft has flawed FACTS but probably has correct VOICE, COLOR,
and STRUCTURE. Don't strip those out trying to be safe. KEEP:

- **Voice and personality** — opening hooks, sentence rhythm, dry-warm tone,
  anchor phrases, wink lines, one-liner section closers. These aren't claims;
  they don't need fact-grounding.
- **Travel/destination color** — sensory language ("the lobby smells like
  money and quiet confidence", "fresh bread every morning"). KEEP. This is
  voice, not fact.
- **Mini-experience guides** — "what to do in Paris" lists, neighborhood
  recommendations, food pairings. These don't need a points-related fact
  to anchor them. KEEP, unless they name a specific Hyatt property at a
  specific category that's NOT in VERIFIED_FACTS.
- **Editorial picks (when grounded)** — if the original picked a specific
  property and that property→category is in VERIFIED_FACTS, KEEP the pick.
- **Structure** — section headings, sub-section labels, bullet lists. The
  rewrite should have similar shape; just with the wrong facts swapped.

═══════════════════════════════════════════════════════════
HARD CONSTRAINTS (must-pass; the fact-checker WILL recheck the output)
═══════════════════════════════════════════════════════════

1. **DO NOT introduce any new factual claims** beyond what's in VERIFIED_FACTS
   or PROGRAM_CONTEXT. No specific property names, point amounts, dates,
   partners, or rates that aren't grounded in those two sources. If a fact
   you'd like to use isn't there, leave it out.

2. **Replace unsupported facts with general framing — DON'T just delete
   the section.** If the original draft had a paragraph about "Hyatt Centric
   Athens at Cat 4" and that property isn't in VERIFIED_FACTS, don't drop
   the whole paragraph. Rewrite as "Cat 4 properties typically run 15K
   standard — search by city for what's available," and KEEP the surrounding
   voice and color. Only drop a section if it's 100% unsupported facts with
   no salvageable framing.

3. **Do NOT speculate.** No "may", "could", "likely", "is set to". Just say
   what you can stand behind, or don't say it.

4. **General program framing is fine.** Rules of the program (off-peak /
   standard / peak structure, transfer ratios, expiration policy, etc.)
   from PROGRAM_CONTEXT are fine without naming specific properties.

5. **Voice + color paragraphs do NOT need a verified fact.** A paragraph
   about Paris activities ("Golden hour along the Seine — the stretch
   from Pont des Arts to Île de la Cité is pure magic") is travel voice,
   not a factual claim. The fact-checker won't flag it; you don't need
   to remove it.

═══════════════════════════════════════════════════════════
VOICE — same rules as the original writer
═══════════════════════════════════════════════════════════

${BRAND_VOICE}

${FACTUAL_TRAPS}

Most-violated rules — re-read your output before returning:
- Lead with the reader payoff, not a news/program recap.
- Name the action with a date or threshold (no "worth confirming" / "check your issuer").
- Use contractions.
- Short, confident sentences. No "It's worth noting that…" / "In this post we'll…".
- Concrete numbers > adjectives.
- Off-limits words: "savvy travelers", "insider", "hack", "game-changer", "must-know",
  "worth noting", "act fast", "limited time", "don't miss".

═══════════════════════════════════════════════════════════
COMPARISON AUDITS — required for any comparative claim
═══════════════════════════════════════════════════════════

If your rewrite makes a comparative claim ("faster", "slower", "same rate",
"double", "equal to", "more than", "less than"), append an HTML comment
block at the END of the body listing every comparison:

<!-- comparison_audits:
[
  { "metric": "qualifying_nights_per_$",
    "lhs": { "label": "business", "value": 5, "per": 10000 },
    "rhs": { "label": "personal", "value": 2, "per": 5000 },
    "assertion": "faster" }
]
-->

Schema:
- "assertion": "equal" | "faster" | "slower" | "greater" | "less"
- "lhs"/"rhs": { label, value, per?, unit? } — use "per" for rates.
- A deterministic validator recomputes the math; mismatches block publish.

If your rewrite makes ZERO comparisons, omit the block entirely. Safest
move: drop the comparative wording and just state both atomic facts side
by side — that needs no audit.

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
      // Bumped from 2500 to give the rewriter room for full-length articles.
      // Sonnet 4.6 supports up to ~16K output; 6K is plenty for 400-700 words.
      max_tokens: input.type === 'blog' ? 6000 : 1200,
      system: systemPrompt(input.type),
      messages: [{ role: 'user', content: userContent }],
    })
    await logUsage(message, 'rewriteArticleFromFacts')
    // Pick the longest text block — guards against the model adding a short
    // confirmation/closing block after the actual rewrite, which we'd
    // otherwise accidentally pick if we used content[0] or "last block."
    let bestText: string | null = null
    let bestLen = 0
    for (const b of message.content) {
      if (b.type !== 'text') continue
      if (b.text.trim().length > bestLen) {
        bestText = b.text
        bestLen = b.text.trim().length
      }
    }
    if (!bestText) return null
    const body = bestText.trim()
    if (!body) return null
    // Sanity check: a rewrite that collapses below ~1200 chars (~200 words)
    // for a blog has dropped too much. The action's caller should treat this
    // as a recoverable failure and not overwrite the original draft.
    const minBlogChars = input.type === 'blog' ? 1200 : 300
    if (body.length < minBlogChars) {
      console.warn(
        `[rewriteArticleFromFacts] rewrite collapsed too far: ${body.length} chars (min expected ${minBlogChars}). Returning anyway but caller may want to reject. Verified facts count: ${input.verified_facts.length}.`
      )
    }
    return { body, written_by: MODEL }
  } catch (err) {
    console.error('[rewriteArticleFromFacts] Sonnet call failed:', err)
    return null
  }
}
