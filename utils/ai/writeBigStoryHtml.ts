/**
 * Focused Sonnet call that writes ONLY the Big Story HTML for a locked alert.
 *
 * Used by the newsletter editor's "Pick Big Story" flow (Phase NL1a): Jill
 * picks the lead alert, then this writes the ~150-word article body around it
 * without touching any other newsletter slot.
 */
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from './logUsage'
import { BRAND_VOICE, FACTUAL_TRAPS } from './editorialRules'
import type { NewsletterAlertInput } from './buildNewsletter'

const SYSTEM_PROMPT = `You are Jill, the sassy travel-rewards columnist behind Crazy4Points. Jill has already picked this week's lead story — your only job is to write its Big Story body.

${BRAND_VOICE}

${FACTUAL_TRAPS}

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (return ONLY this JSON, no prose, no fences)
═══════════════════════════════════════════════════════════

{
  "big_story_html": "<HTML body, ~150 words. <p> paragraphs and one <ul> bulleted list of 'What this means for you'. NO links, NO headings (h2 is added by the renderer). NO emojis. End with the punchiest sentence first.>"
}

Structure:
<p>Lead paragraph — what happened, in plain language, reader-payoff first.</p>
<p><strong>What this means for you:</strong></p>
<ul>
  <li><strong>Bullet 1.</strong> Concrete consequence.</li>
  <li><strong>Bullet 2.</strong> Concrete consequence.</li>
  <li><strong>Bullet 3.</strong> Concrete consequence.</li>
</ul>

═══════════════════════════════════════════════════════════
HARD RULES
═══════════════════════════════════════════════════════════

- The lead alert is LOCKED by the editor. Do not propose a different story.
- Don't editorialize beyond the data the alert gives you. If a number, deadline, or program detail isn't in the input, don't invent it.
- NEVER claim a story is "first/only/best/biggest" — comparative absolutes are off-limits.
- NEVER open with "Chase just dropped" or any "X just dropped/launched/announced" cliche.
- NEVER use "savvy", "insider", "hack", "game-changer", "must-know".
- NEVER assert recurring cadence ("daily", "every Tuesday") unless the input explicitly says so.
- NO links inside big_story_html — the reader stays in the email.
- Paraphrase the alert's why_this_matters in voice; don't quote it verbatim.
- **EVERY ACTIONABLE FACT from the source must appear in the article.** "Actionable" = something a reader needs to act on: event dates, on-sale times + time zones, multi-city listings (e.g. "SF July 2, NJ July 11" — list both), eligibility constraints ("Reserve cardmembers only"), durations, capacity limits, transfer ratios, percentage bonuses. Do not cherry-pick "the most important one" — readers need ALL of them to plan.
- **SKIP legal boilerplate from verified_terms.** Do NOT include: arbitration clauses, "void where prohibited," exclusion lists, "modifications without notice," forfeiture terms, generic disclaimers, eligibility fine print that's standard for the issuer. The article is a news brief, not a contract.
- If verified_terms is provided, treat it as ground truth for dates/times/eligibility — those facts MUST appear in the article even if they don't appear in the alert's summary.
- If chosen_subject is non-null, treat it as a steering signal: the article's tone and lead sentence should echo the angle of that headline (curiosity question → lead with the question; deadline-focused → put the date front and center; etc.). Do NOT restate the subject line verbatim inside the article.`

interface SonnetOutput {
  big_story_html?: string | null
}

function extractJson(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) return trimmed
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }
  return trimmed
}

export async function writeBigStoryHtml(
  alert: NewsletterAlertInput,
  chosenSubject?: string | null,
  verifiedTerms?: string | null,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[writeBigStoryHtml] ANTHROPIC_API_KEY missing')
    return null
  }

  const userContent = JSON.stringify(
    {
      locked_alert: {
        id: alert.id,
        title: alert.title,
        alert_type: alert.alert_type,
        summary: alert.summary,
        why_this_matters: alert.why_this_matters,
        end_date: alert.end_date,
        published_at: alert.published_at,
      },
      // verified_terms = the issuer's own T&Cs. Treated as the source of
      // truth for actionable facts (event dates, on-sale times, multi-city
      // listings, eligibility) — but per the writer rules below, the
      // article only surfaces actionable facts, not legal boilerplate.
      verified_terms: verifiedTerms?.trim() || null,
      // When the editor has already picked a subject line, pass it in so the
      // article's tone and lead sentence can echo the chosen headline's angle
      // (curiosity, deadline, jab, etc.). Sonnet still writes a full article;
      // the subject is a steering signal, not a constraint to repeat verbatim.
      chosen_subject: chosenSubject?.trim() || null,
    },
    null,
    2,
  )

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    await logUsage(message, 'writeBigStoryHtml')

    const block = message.content[0]
    if (block.type !== 'text') {
      console.error('[writeBigStoryHtml] Non-text block returned')
      return null
    }
    const parsed = JSON.parse(extractJson(block.text)) as SonnetOutput
    if (!parsed.big_story_html || typeof parsed.big_story_html !== 'string') {
      console.error('[writeBigStoryHtml] Missing big_story_html in output')
      return null
    }
    return parsed.big_story_html
  } catch (err) {
    console.error('[writeBigStoryHtml] Sonnet call failed:', err)
    return null
  }
}
