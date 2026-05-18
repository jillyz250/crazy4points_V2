/**
 * Blog variant generator. Long-form SEO content for /blog/<slug>.
 * 1,500-2,500 words. One H1 + 2-5 H2s + internal links.
 */
import {
  buildSystemPreamble,
  callSonnetForVariant,
  type GeneratedVariant,
  type VariantGenInput,
} from './shared'

export const FORMAT_NAME = 'blog' as const
export const FORMAT_PROMPT_VERSION = 'v1-2026-05-18'

const FORMAT_RULES = `
FORMAT: BLOG (renders at crazy4points.com/blog/<slug>)

LENGTH: 1,500-2,500 words. This is long-form ranking content; don't pad,
but DO go deep on stacking math, sweet-spot framing, and concrete examples.

STRUCTURE:
  1. Lede paragraph — hook + summary. The first 155 chars become the meta
     description, so make them count.
  2. One H1 (markdown \`# Title\`) containing the primary keyword.
  3. 2-5 H2 sections (markdown \`## Heading\`), each targeting a related
     search query (e.g. "How does Chase Paze work?", "Which merchants
     accept Paze?", "How to stack with Sapphire Preferred").
  4. H3 subsections (markdown \`### Heading\`) only where deeper detail
     needs it.
  5. Internal-link suggestions: include 3-5 markdown links to
     /programs/<slug> and/or /cards/<slug> using the programs + cards
     attached to this topic.
  6. Conclusion + CTA.

WRITING STYLE:
  - Short paragraphs (2-3 sentences). Mobile readability.
  - Concrete dollar amounts whenever possible (from the ledger).
  - No emoji in headings. No hashtags.
  - Image alt text: include one suggested alt-text line in metadata.

SEO ESSENTIALS:
  - Meta description: 155-160 chars (desktop sweet spot). Editable later.
  - One H1 only.
  - Internal links use markdown anchors to /programs/<slug> and /cards/<slug>.

METADATA TO RETURN:
  - meta_description: 155-160 chars
  - internal_link_suggestions: array of { anchor: string, href: string }
  - hero_image_alt: short alt text describing a suggested hero image
  - primary_keyword: the H1's primary keyword phrase
`

export async function generateBlog(
  input: VariantGenInput,
): Promise<GeneratedVariant> {
  const systemPrompt = buildSystemPreamble(input) + FORMAT_RULES
  const userPrompt = `Write the blog variant. Title is required.`
  return callSonnetForVariant({
    systemPrompt,
    userPrompt,
    caller: 'variant_blog',
    topicId: input.topic.id,
    format: FORMAT_NAME,
    maxTokens: 4096,
  })
}
