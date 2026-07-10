/**
 * Question Radar — enrichment (Claude Haiku).
 *
 * Takes raw candidate questions and, per question, returns: is it a genuine
 * points/miles/travel-rewards question our audience cares about, a topic tag, a
 * relevance score, the best-matching crazy4points page to link (from a fixed
 * catalog), and a one-line social-post angle in brand voice.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { RawQuestion } from '@/utils/social/fetchQuestions'

export type EnrichedQuestion = RawQuestion & {
  relevant: boolean
  topic: string
  relevance: number // 0-100
  matchedUrl: string | null
  matchedLabel: string | null
  postHook: string | null
}

// Pages we can link when a question maps to existing content.
const CONTENT_CATALOG = [
  { url: '/guides/hotel-best-rate-guarantees', label: 'Best Rate Guarantee guide', when: 'hotel price match / best rate guarantee / getting money back after booking' },
  { url: '/guides/how-to-win-a-best-rate-guarantee', label: 'How to Win a Best Rate Guarantee', when: 'how to actually win a hotel price-match claim' },
  { url: '/tools/sapphire-reserve-checklist', label: 'Sapphire Reserve benefits checklist', when: 'ONLY the Chase Sapphire Reserve specifically (its benefits/credits/whether it is worth its fee). Do NOT use for Amex or other cards.' },
  { url: '/cards', label: 'Credit Card Explorer', when: 'comparing or choosing a credit card, welcome bonuses, annual fees' },
  { url: '/hub', label: 'Points Hub', when: 'transfer bonuses, best way to book an award, where points can take you' },
  { url: '/programs', label: 'Programs directory', when: 'a specific airline/hotel loyalty program, transfer partners, award charts' },
  { url: '/tools/alliances', label: 'Alliance Explorer', when: 'airline alliances (oneworld/SkyTeam/Star), elite status, lounge access' },
  { url: '/decision-engine', label: 'Decision Engine', when: 'where should I go / trip ideas with points' },
]

const MODEL = 'claude-haiku-4-5-20251001'
const CHUNK = 35

// Safety net: the model occasionally ignores "no em-dashes". Strip em/en dashes
// (brand rule) and any stray emoji from the draft hook.
function cleanHook(s: string): string {
  return s
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim()
}

function buildPrompt(questions: RawQuestion[]): string {
  const catalog = CONTENT_CATALOG.map((c) => `  "${c.url}" (${c.label}) — use for: ${c.when}`).join('\n')
  const list = questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')
  return `You help a points-and-miles brand (crazy4points) find real user questions to answer on social media.

For EACH numbered question below, decide if it is a genuine question our audience cares about: credit card points/miles, award travel, hotel/airline loyalty, best rate guarantees, transfers, or maximizing travel rewards. Ignore off-topic, spam, meta, or non-question items.

Content we can link (pick the single best match, or null if none fits well):
${catalog}

Return ONLY a JSON array, one object per question in order, each:
{"n": <number>, "relevant": <bool>, "topic": "<2-4 word tag>", "relevance": <0-100>, "matchedUrl": <one catalog url or null>, "matchedLabel": <its label or null>, "postHook": "<one punchy sentence, in a sassy-helpful traveler-friend voice, teasing the answer — or null if not relevant>"}

Rules: relevance reflects how much our audience would engage. postHook must NOT use em-dashes or emojis, must NOT state specific dollar amounts, fees, points values, or other stats (keep it qualitative, since exact numbers have to be verified separately), and stays under 25 words. No prose outside the JSON array.

Questions:
${list}`
}

async function enrichChunk(client: Anthropic, questions: RawQuestion[]): Promise<EnrichedQuestion[]> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [{ role: 'user', content: buildPrompt(questions) }],
  })
  const text = message.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
  const jsonStr = text.slice(text.indexOf('['), text.lastIndexOf(']') + 1)
  let parsed: Array<Record<string, unknown>>
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    console.warn('[question-radar] enrich: could not parse Haiku JSON, skipping chunk')
    return []
  }
  const byN = new Map<number, Record<string, unknown>>()
  for (const row of parsed) if (typeof row.n === 'number') byN.set(row.n, row)

  return questions.map((q, i): EnrichedQuestion => {
    const r = byN.get(i + 1) ?? {}
    return {
      ...q,
      relevant: r.relevant === true,
      topic: typeof r.topic === 'string' ? r.topic : '',
      relevance: typeof r.relevance === 'number' ? Math.max(0, Math.min(100, r.relevance)) : 0,
      matchedUrl: typeof r.matchedUrl === 'string' ? r.matchedUrl : null,
      matchedLabel: typeof r.matchedLabel === 'string' ? r.matchedLabel : null,
      postHook: typeof r.postHook === 'string' && r.postHook.trim() ? cleanHook(r.postHook) : null,
    }
  })
}

export async function enrichQuestions(questions: RawQuestion[]): Promise<EnrichedQuestion[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[question-radar] ANTHROPIC_API_KEY not set — skipping enrichment')
    return []
  }
  const client = new Anthropic({ apiKey })
  const out: EnrichedQuestion[] = []
  for (let i = 0; i < questions.length; i += CHUNK) {
    out.push(...(await enrichChunk(client, questions.slice(i, i + CHUNK))))
  }
  return out
}
