/**
 * Turns a free-form prompt (3-4 sentences from the user) into a structured
 * blog-idea row: title, pitch, excerpt, category, primary program slug.
 *
 * Used by the "draft from prompt" admin flow. Output feeds into the existing
 * writer + fact-check + voice + originality pipeline.
 *
 * Uses Haiku for speed and cost — this is a constrained extraction task,
 * not creative writing. Sonnet would be overspec.
 */
import Anthropic from '@anthropic-ai/sdk'
import { BLOG_CATEGORIES, isBlogCategorySlug, type BlogCategorySlug } from '@/lib/blog/categories'

const MODEL = 'claude-haiku-4-5-20251001'

export interface GeneratedIdeaMetadata {
  title: string
  pitch: string
  excerpt: string
  category: BlogCategorySlug
  /** Single most-relevant program — used for filtering and as the lead
      tag. Null if the article isn't about any specific program. */
  primary_program_slug: string | null
  /**
   * Other programs the article meaningfully covers. Empty for single-program
   * articles. Useful for comparison or stacking pieces (e.g. "Chase Hyatt
   * Personal vs Business" → primary='chase', secondary=['hyatt']).
   * Excludes whatever was chosen as primary.
   */
  secondary_program_slugs: string[]
  /** Short note from the AI to the writer step about angle, caveats, gaps. */
  writer_notes: string
}

const CATEGORY_LIST = BLOG_CATEGORIES.map((c) => `- ${c.slug}: ${c.label}`).join('\n')

function systemPrompt(programSlugs: string[]): string {
  const programList = programSlugs.length > 0
    ? programSlugs.slice(0, 100).join(', ')
    : '(none — pass null for primary_program_slug)'

  return `You convert a user's rough article idea into a structured content_ideas row.
The user wrote 3-4 sentences. You return JSON with: title, pitch, excerpt, category,
primary_program_slug, writer_notes. The downstream writer agent uses pitch + writer_notes
as the brief. The category and primary_program are public-facing and used for filtering.

═══════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════

title: Sassy, specific, ≤80 chars. Match the brand voice — confident, direct,
       a little dry. NO clickbait, no "Top 10", no ALL CAPS, no emoji.
       ❌ "Top 10 Hawaii Tips Every Traveler Must Know"
       ✅ "Hawaii on points: the oneworld options worth booking now"

pitch: Internal "why we should write this" — 2-3 short sentences for the
       writer agent. Hook them with the actual angle, not a summary.
       ≤300 chars.

excerpt: Reader-facing dek that appears under the headline on /blog/[slug].
         1-2 sentences, ≤200 chars. Reader voice, not internal voice.
         ❌ (pitch-style): "We should cover this — Waldorf Maldives is the
                            most-requested redemption in our Slack."
         ✅ (excerpt-style): "Waldorf Astoria Maldives runs ~140k Hilton
                              points a night and never seems to have award
                              space. Here's how to actually find it."

category: MUST be one of these slugs:
${CATEGORY_LIST}

primary_program_slug: The SINGLE most-relevant known program slug, or null if
                     the article isn't about a specific program. NEVER invent.
KNOWN PROGRAM SLUGS: ${programList}

secondary_program_slugs: An array of OTHER program slugs the article
                        meaningfully covers. Use this for comparison or
                        stacking pieces.
                        Examples:
                          • "Chase Hyatt personal vs business" →
                            primary='chase', secondary=['hyatt']
                          • "Stack Amex transfer bonus + Aeroplan award" →
                            primary='aeroplan', secondary=['amex']
                          • "Hyatt 80K in Europe" →
                            primary='hyatt', secondary=[]
                        Each slug must be in KNOWN PROGRAM SLUGS. Don't list
                        the same slug as primary AND secondary. Empty array
                        is fine for single-program articles.

writer_notes: 1-2 sentences. Surface caveats, structural hints, or gaps the
              user mentioned. ≤300 chars. Empty string OK if nothing to add.

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return a single JSON object. No prose outside the JSON, no markdown fences.

{
  "title": "<≤80 chars>",
  "pitch": "<≤300 chars, internal voice>",
  "excerpt": "<≤200 chars, reader voice>",
  "category": "<one of the 6 slugs>",
  "primary_program_slug": "<a known slug or null>",
  "secondary_program_slugs": ["<known slug>", "<known slug>"],
  "writer_notes": "<≤300 chars, may be empty>"
}`
}

const RETRY_PROMPT_SUFFIX = `

⚠️ Your previous response was invalid: it either wasn't valid JSON, used a
category not in the allowed list, or used a primary_program_slug not in the
known list. Return ONLY valid JSON matching the schema. Use a category from
the 6 slugs and a program slug from the known list (or null).`

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

function clamp(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 1).trimEnd() + '…'
}

function validateAndCoerce(
  parsed: unknown,
  programSlugs: string[]
): GeneratedIdeaMetadata {
  const obj = parsed as Partial<GeneratedIdeaMetadata>
  if (!obj || typeof obj !== 'object') {
    throw new Error('Response was not an object')
  }
  if (typeof obj.title !== 'string' || !obj.title.trim()) {
    throw new Error('Missing required field: title')
  }
  const title = clamp(obj.title.trim(), 80)
  const pitch = clamp(typeof obj.pitch === 'string' ? obj.pitch.trim() : '', 300)
  const excerpt = clamp(typeof obj.excerpt === 'string' ? obj.excerpt.trim() : '', 200)

  // Coerce invalid category to 'how-to' rather than throw — easy to fix in admin.
  let category: BlogCategorySlug
  if (isBlogCategorySlug(obj.category)) {
    category = obj.category
  } else {
    console.warn(`[generateBlogIdeaFromPrompt] invalid category "${obj.category}" coerced to 'how-to'`)
    category = 'how-to'
  }

  // Coerce unknown program slug to null.
  let primary_program_slug: string | null = null
  if (typeof obj.primary_program_slug === 'string' && obj.primary_program_slug) {
    if (programSlugs.includes(obj.primary_program_slug)) {
      primary_program_slug = obj.primary_program_slug
    } else {
      console.warn(`[generateBlogIdeaFromPrompt] unknown program slug "${obj.primary_program_slug}" coerced to null`)
    }
  }

  // Secondary slugs: keep only entries that are (a) strings, (b) in the
  // known list, (c) not equal to the primary, and (d) not duplicated.
  const rawSecondary = Array.isArray(obj.secondary_program_slugs)
    ? obj.secondary_program_slugs
    : []
  const secondary_program_slugs = Array.from(
    new Set(
      rawSecondary
        .filter((s): s is string => typeof s === 'string' && s.length > 0)
        .filter((s) => programSlugs.includes(s))
        .filter((s) => s !== primary_program_slug)
    )
  )
  if (rawSecondary.length !== secondary_program_slugs.length) {
    console.warn(
      `[generateBlogIdeaFromPrompt] dropped ${rawSecondary.length - secondary_program_slugs.length} invalid/duplicate secondary slug(s)`
    )
  }

  const writer_notes = clamp(
    typeof obj.writer_notes === 'string' ? obj.writer_notes.trim() : '',
    300
  )

  return {
    title,
    pitch,
    excerpt,
    category,
    primary_program_slug,
    secondary_program_slugs,
    writer_notes,
  }
}

/**
 * Calls Haiku to generate metadata. One automatic retry on parse/validation
 * failure with a stricter prompt suffix. Throws if both attempts fail.
 */
export async function generateBlogIdeaFromPrompt(
  userPrompt: string,
  programSlugs: string[]
): Promise<GeneratedIdeaMetadata> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY missing')
  }

  const trimmed = userPrompt.trim()
  if (trimmed.length < 30) {
    throw new Error('Prompt is too short — please write 3-4 sentences (30+ chars).')
  }
  if (trimmed.length > 1000) {
    throw new Error('Prompt is too long — keep it under 1000 chars.')
  }

  const client = new Anthropic({ apiKey })
  const baseSystem = systemPrompt(programSlugs)
  let lastError: Error | null = null

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 1000,
        system: attempt === 0 ? baseSystem : baseSystem + RETRY_PROMPT_SUFFIX,
        messages: [{ role: 'user', content: trimmed }],
      })
      const block = message.content[0]
      if (!block || block.type !== 'text') {
        throw new Error('Non-text response from Haiku')
      }
      const parsed = JSON.parse(extractJson(block.text))
      return validateAndCoerce(parsed, programSlugs)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn(
        `[generateBlogIdeaFromPrompt] attempt ${attempt + 1} failed:`,
        lastError.message
      )
    }
  }

  throw new Error(
    `generateBlogIdeaFromPrompt failed after retry: ${lastError?.message ?? 'unknown'}`
  )
}
