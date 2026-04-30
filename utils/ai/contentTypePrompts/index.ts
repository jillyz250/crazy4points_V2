/**
 * Public entry point: composes a system prompt for writeArticleBody given
 * a content_type + optional activity_frame. Universal pieces (BRAND_VOICE,
 * destination checklist, output rules) are layered in here so each
 * type-specific prompt can stay focused on its own structure.
 */
import { BRAND_VOICE } from '../editorialRules'
import type { ContentType, ActivityFrame } from '@/lib/admin/contentTaxonomy'
import { CONTENT_TYPE_PROMPTS } from './types'
import { ACTIVITY_FRAME_PROMPTS, FALLBACK_FRAME } from './frames'

const OUTPUT_RULES = `
═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return Markdown only. No frontmatter, no surrounding prose, no code
fences. Do NOT repeat the title as an H1 — the page renders the title
separately. Plain Markdown only: ##, **bold**, *italic*, simple lists.
No HTML.
`

export interface PromptArgs {
  contentType: ContentType | null
  activityFrame: ActivityFrame | null
  ideaType: 'newsletter' | 'blog'
}

/**
 * Returns the composed system prompt for a single article. Falls back to
 * a sensible generic prompt when contentType is null (legacy ideas without
 * Phase 7a categorization).
 */
export function buildSystemPrompt(args: PromptArgs): string {
  const lengthRule =
    args.ideaType === 'newsletter'
      ? `LENGTH: 120-180 words. One clean section, no headings. Newsletter item, not full post.`
      : `LENGTH: see content-type STRUCTURE block below for the recommended range.`

  const intro = `You are the staff writer for crazy4points, a premium award travel
intelligence site.

Your voice is ${BRAND_VOICE}

You turn a content brief into a publish-ready article. A human editor
will review before publishing. Fact-check + originality checks run
separately — you do not need to cite sources inline.

${lengthRule}
`

  // Pick the type-specific block.
  const typeBlock = args.contentType
    ? CONTENT_TYPE_PROMPTS[args.contentType]
    : `\n═══════════════════════════════════════════════════════════
GENERIC FALLBACK
═══════════════════════════════════════════════════════════
This idea isn't categorized yet. Lead with reader payoff, use concrete
numbers, and keep paragraphs tight. Categorize the idea in admin
(/admin/content-ideas) for a routed prompt next time.
`

  // Activity frame only matters for destination_play.
  const frameBlock =
    args.contentType === 'destination_play'
      ? args.activityFrame
        ? ACTIVITY_FRAME_PROMPTS[args.activityFrame]
        : FALLBACK_FRAME
      : ''

  return [intro, typeBlock, frameBlock, OUTPUT_RULES].filter(Boolean).join('\n')
}
