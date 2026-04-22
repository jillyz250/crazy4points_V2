/**
 * Originality check for a drafted article body. Uses Sonnet + web_search to
 * look for near-duplicate passages published elsewhere. Returns pass/fail +
 * short editor-facing notes (e.g. "Sentence 2 near-duplicates onemileatatime
 * article from April 17").
 */
import Anthropic from '@anthropic-ai/sdk'

export interface OriginalityResult {
  pass: boolean
  notes: string
  checked_at: string
}

const SYSTEM_PROMPT = `You are an originality checker for crazy4points. You receive an article
body and must use web_search to decide whether any passage is a near-duplicate of content
already published elsewhere.

═══════════════════════════════════════════════════════════
HOW TO JUDGE
═══════════════════════════════════════════════════════════

Pick 2–4 distinctive sentences from the body (avoid generic travel truisms, avoid brand-voice
flourishes, avoid direct quotes from source articles that could legitimately match). Search
short phrases from those sentences. You have a small web_search budget — spend it well.

pass = true when:
• No near-verbatim matches found
• Only matches are to generic shared facts (numbers, program names, dates) that every
  publication would report the same way
• The body may share FACTS with source reporting but expresses them in clearly different prose

pass = false when:
• Two or more sentences are near-verbatim copies of another publication
• A distinctive paragraph reads as a copy-paste of prior published work
• The article body's structure and sentence rhythm clearly mirror a known source

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return a single JSON object. No prose, no markdown fences.

{
  "pass": true | false,
  "notes": "<under 300 chars — if pass, say what you searched and that nothing matched; if fail, the specific overlap + URL>"
}`

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

function findLastTextBlock(content: Anthropic.ContentBlock[]): string | null {
  for (let i = content.length - 1; i >= 0; i--) {
    const b = content[i]
    if (b.type === 'text' && b.text.trim()) return b.text
  }
  return null
}

export async function originalityCheck(args: {
  title: string
  article_body: string
}): Promise<OriginalityResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[originalityCheck] ANTHROPIC_API_KEY missing — skipping')
    return null
  }

  const userContent = JSON.stringify({ title: args.title, article_body: args.article_body }, null, 2)

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 6 }],
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    const text = findLastTextBlock(response.content)
    if (!text) return null
    const parsed = JSON.parse(extractJson(text)) as { pass?: unknown; notes?: unknown }
    return {
      pass: parsed.pass === true,
      notes: typeof parsed.notes === 'string' ? parsed.notes.slice(0, 400) : '',
      checked_at: new Date().toISOString(),
    }
  } catch (err) {
    console.error('[originalityCheck] call failed:', err)
    return null
  }
}
