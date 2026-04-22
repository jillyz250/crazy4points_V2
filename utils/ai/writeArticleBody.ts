/**
 * Drafts a publish-ready article body (newsletter blurb or blog post) from a
 * content_ideas row. Server-side only. Returns the article body as Markdown,
 * plus the model identifier used (stamped as written_by).
 */
import Anthropic from '@anthropic-ai/sdk'
import { BRAND_VOICE } from './editorialRules'

export type ArticleIdeaType = 'newsletter' | 'blog'

export interface WriteArticleInput {
  type: ArticleIdeaType
  title: string
  pitch: string
  source_alert?: {
    title: string
    summary: string | null
    description: string | null
    end_date: string | null
  } | null
}

export interface ArticleDraft {
  body: string
  written_by: string
}

const MODEL = 'claude-sonnet-4-6'

function systemPrompt(type: ArticleIdeaType): string {
  const lengthRule =
    type === 'newsletter'
      ? `LENGTH: 120–180 words. One clean section, no headings. This is a newsletter item, not a full post.`
      : `LENGTH: 500–800 words. Three to five short sections with H2 (##) headings. This is a blog post.`

  return `You are the staff writer for crazy4points, a premium award travel intelligence site.
Your voice is ${BRAND_VOICE}

You turn a content brief (title + one-line pitch, optional source alert context) into a
publish-ready ${type === 'newsletter' ? 'newsletter item' : 'blog post'} body. A human editor
will review before publishing. Fact-check and originality checks run separately — you do
not need to cite sources inline.

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return Markdown only. No frontmatter, no surrounding prose, no code fences.
Do NOT repeat the title as an H1 — the page renders the title separately.
${lengthRule}

═══════════════════════════════════════════════════════════
CONTENT RULES
═══════════════════════════════════════════════════════════

- Lead with the payoff. First sentence should be something the reader can act on.
- Use concrete numbers (percentages, point counts, dates) from the source alert whenever available.
- Never fabricate facts, dates, partners, or offer amounts. If the source is thin, lean on general
  award-travel context rather than inventing specifics.
- Name the action when applicable — "Transfer before May 16" beats "act soon."
- No clickbait, no ALL CAPS, no emoji in headings.
- Plain Markdown only: ##, **bold**, *italic*, simple lists. No HTML.`
}

function buildUserContent(input: WriteArticleInput): string {
  return JSON.stringify(
    {
      brief: {
        type: input.type,
        title: input.title,
        pitch: input.pitch,
      },
      source_alert: input.source_alert ?? null,
    },
    null,
    2,
  )
}

export async function writeArticleBody(input: WriteArticleInput): Promise<ArticleDraft | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[writeArticleBody] ANTHROPIC_API_KEY missing — skipping')
    return null
  }

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: input.type === 'blog' ? 2500 : 800,
      system: systemPrompt(input.type),
      messages: [{ role: 'user', content: buildUserContent(input) }],
    })

    const block = message.content[0]
    if (!block || block.type !== 'text') return null
    const body = block.text.trim()
    if (!body) return null
    return { body, written_by: MODEL }
  } catch (err) {
    console.error('[writeArticleBody] Sonnet call failed:', err)
    return null
  }
}
