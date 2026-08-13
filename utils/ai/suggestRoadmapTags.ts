import Anthropic from '@anthropic-ai/sdk'
import { PILLARS } from '@/lib/contentRoadmap'

/**
 * AI triage: classify content ideas into a roadmap pillar (or null = not
 * evergreen guide material) + a few free-form tags. Batched — one Haiku call
 * classifies many ideas. The result is a SUGGESTION; a human approves it before
 * it becomes the final roadmap tag ([[feedback_no_unsourced_claims]] spirit:
 * AI proposes, human confirms).
 */
export interface IdeaToClassify {
  id: string
  title: string
  pitch: string | null
}
export interface RoadmapSuggestion {
  id: string
  pillar: string | null
  tags: string[]
}

const PILLAR_GUIDE = `- foundations: beginner basics (what points are, how to earn, first card, credit score)
- skills: how-to task guides (find award seats, book a partner award, avoid fuel surcharges)
- programs: "how to use X" for one specific currency, airline, or hotel program
- sweet-spots: high-value redemption plays or best-uses roundups for a program
- trips: planning a specific trip on points (Europe, Hawaii, honeymoon, a city)
- tricks: benefit chains, perk stacks, status matches, timing plays
- null: NOT evergreen guide material (a dated deal, a time-sensitive promo, or one-off news) — belongs in the newsletter/blog instead, not the roadmap`

export async function suggestRoadmapTags(ideas: IdeaToClassify[]): Promise<RoadmapSuggestion[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || ideas.length === 0) return []
  const client = new Anthropic({ apiKey })

  const list = ideas
    .map((i) => `- [id:${i.id}] ${i.title}${i.pitch ? ' — ' + i.pitch.slice(0, 220) : ''}`)
    .join('\n')

  const prompt = `You are triaging content ideas for a points-and-miles website into an evergreen content roadmap.

Pillars:
${PILLAR_GUIDE}

For EACH idea, pick the single best pillar key, or null if it is a dated deal / timely news rather than an evergreen guide. Also give 2 to 4 short lowercase tags (program names, themes) for grouping.

DEAL/NEWS TEST — default to null (NOT roadmap) when the idea reads like a dated promotion or one-off news, even if the topic is otherwise evergreen. Strong signals of null:
- a specific date or window ("through Sept 14", "ends Aug 31", "this month", "book by")
- a bonus percentage or amount ("30% transfer bonus", "80,000-point offer", "5x")
- promo/registration language ("limited time", "register by", "promo code", "flash sale", "now booking", "just added", "increased offer")
An evergreen guide teaches a durable how-to or sweet spot with no expiry. When in doubt between a pillar and null, choose null.

Ideas:
${list}

Reply with ONLY a JSON array, one object per idea:
[{"id":"<the id>","pillar":"<pillar-key-or-null>","tags":["tag1","tag2"]}]
Valid pillar keys: foundations, skills, programs, sweet-spots, trips, tricks — or null.`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: Math.min(4096, 300 + ideas.length * 40),
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const validKeys = new Set(PILLARS.map((p) => p.key as string))
  return parsed
    .filter((p): p is { id: string; pillar?: unknown; tags?: unknown } => !!p && typeof (p as { id?: unknown }).id === 'string')
    .map((p) => ({
      id: p.id,
      pillar: typeof p.pillar === 'string' && validKeys.has(p.pillar) ? p.pillar : null,
      tags: Array.isArray(p.tags)
        ? p.tags
            .filter((t): t is string => typeof t === 'string')
            .map((t) => t.trim().toLowerCase().slice(0, 40))
            .filter(Boolean)
            .slice(0, 4)
        : [],
    }))
}
