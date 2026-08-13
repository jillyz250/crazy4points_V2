import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ROADMAP, isLive } from '@/lib/contentRoadmap'

/**
 * Proactive coverage: for every planned roadmap slot that has nothing behind it
 * (no live guide, no existing content idea), create a real, writable content
 * idea — pre-tagged to its pillar (roadmap_reviewed so it doesn't clutter the
 * open triage queue). Turns the roadmap plan into a fully-backed pipeline.
 *
 * Idempotent: an item whose title already exists as a content idea is skipped,
 * so re-running never duplicates.
 */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

async function generatePitches(titles: string[]): Promise<Record<string, string>> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || titles.length === 0) return {}
  const client = new Anthropic({ apiKey })
  const list = titles.map((t, i) => `${i + 1}. ${t}`).join('\n')
  const prompt = `For each evergreen points-and-miles guide title below, write ONE short, concrete angle sentence (max ~22 words) a writer could open from. Sassy, useful, plain. No hype, no em dashes.

Titles:
${list}

Reply with ONLY a JSON array of strings, one per title, in the same order.`
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: Math.min(4096, 200 + titles.length * 45),
    messages: [{ role: 'user', content: prompt }],
  })
  const text = message.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
  const m = text.match(/\[[\s\S]*\]/)
  if (!m) return {}
  let arr: unknown
  try {
    arr = JSON.parse(m[0])
  } catch {
    return {}
  }
  if (!Array.isArray(arr)) return {}
  const out: Record<string, string> = {}
  titles.forEach((t, i) => {
    const p = arr[i]
    if (typeof p === 'string' && p.trim()) out[t] = p.trim()
  })
  return out
}

export interface FillGapsResult {
  created: number
  skipped: number
  createdTitles: string[]
}

export async function fillRoadmapGaps(sb: SupabaseClient): Promise<FillGapsResult> {
  const notLive = ROADMAP.filter((i) => !isLive(i))

  // Dedup against existing idea titles.
  const { data: existing } = await sb.from('content_ideas').select('title')
  const existingTitles = new Set((existing ?? []).map((e) => norm(e.title as string)))
  const gaps = notLive.filter((i) => !existingTitles.has(norm(i.title)))
  if (gaps.length === 0) return { created: 0, skipped: notLive.length, createdTitles: [] }

  const pitches = await generatePitches(gaps.map((g) => g.title))

  const rows = gaps.map((g) => ({
    title: g.title,
    pitch: pitches[g.title] ?? `Evergreen guide covering ${g.title}.`,
    type: 'blog' as const,
    status: 'new' as const,
    source: 'editorial_plan',
    roadmap_pillar: g.pillar,
    roadmap_reviewed: true,
    tags: [] as string[],
  }))

  const { error } = await sb.from('content_ideas').insert(rows)
  if (error) throw error

  return { created: rows.length, skipped: notLive.length - gaps.length, createdTitles: rows.map((r) => r.title) }
}
