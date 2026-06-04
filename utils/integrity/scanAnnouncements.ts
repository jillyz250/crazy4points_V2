import type { SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { fetchFirecrawl } from '@/utils/ai/firecrawl'

/**
 * Layer 1 of the data-accuracy plan: the external announcement monitor.
 *
 * Scrapes a curated set of issuer newsrooms + points-blog news pages, keyword-
 * prefilters for our programs + change verbs, then asks Haiku to classify any
 * hits into structured change signals (devaluation / partner added or removed /
 * ratio change). Output is written to change_signals for human review against
 * our stored data. Detection only - never edits program data.
 *
 * Every transfer change we found in the 2026-06-04 audit (Amex Etihad ending,
 * Cathay 5:4 deval, Citi Apr-2026 hotel devals, Aeromexico exit) was announced
 * on exactly these kinds of pages first - this is the early-warning net.
 */

// Curated, high-signal sources. Newsrooms publish in plain HTML; blog news/tag
// pages surface devaluations and partner changes fast. Keep this list tight -
// breadth is the daily change-detection diff's job (Phase 2b), not this.
export const ANNOUNCEMENT_SOURCES: { name: string; url: string }[] = [
  { name: 'Frequent Miler', url: 'https://frequentmiler.com/category/transfer-partners/' },
  { name: 'One Mile at a Time', url: 'https://onemileatatime.com/news/' },
  { name: 'The Points Guy — News', url: 'https://thepointsguy.com/news/' },
  { name: 'AwardWallet Blog', url: 'https://awardwallet.com/blog/' },
  { name: 'Upgraded Points — News', url: 'https://upgradedpoints.com/news/' },
  { name: 'View from the Wing', url: 'https://viewfromthewing.com/category/awards-and-points/' },
  { name: 'Wells Fargo Newsroom', url: 'https://newsroom.wf.com/' },
]

const CHANGE_KEYWORDS = [
  'transfer partner', 'transfer ratio', 'new partner', 'adds ', 'added ', 'removes ', 'removed ',
  'devalu', 'no longer', 'ending', 'ends ', 'leaves', 'leaving', 'joins', 'joining', 'drops ',
  'increase', 'decrease', 'transfer bonus', '1:1', 'points transfer', 'miles transfer',
]

export interface ChangeSignal {
  contentHash: string
  sourceName: string
  sourceUrl: string
  programSlug: string | null
  signalType: 'devaluation' | 'new_partner' | 'ended_partner' | 'ratio_change' | 'other'
  summary: string
  excerpt: string | null
  confidence: 'high' | 'med' | 'low'
}

// Tiny stable hash (no crypto import needed) for the dedup key.
function hash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

interface ClassifierProgram {
  slug: string
  name: string
}

const CLASSIFY_SCHEMA_HINT = `Return ONLY a JSON array (possibly empty). Each item:
{"program_slug": "<one of the provided slugs, or null>", "signal_type": "devaluation|new_partner|ended_partner|ratio_change|other", "summary": "<=160 chars describing the specific change", "confidence": "high|med|low"}
Only include items that announce an ACTUAL CHANGE to a points/miles TRANSFER relationship or award ratio for one of the listed programs. Ignore generic guides, deals, and credit-card sign-up offers.`

async function classifyWithHaiku(
  sourceName: string,
  markdown: string,
  programs: ClassifierProgram[],
): Promise<Omit<ChangeSignal, 'contentHash' | 'sourceName' | 'sourceUrl' | 'excerpt'>[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return []
  const client = new Anthropic({ apiKey })
  const programList = programs.map((p) => `${p.slug} = ${p.name}`).join('\n')
  const prompt = `You monitor points-and-miles news for changes to transfer partners and award ratios.

PROGRAMS WE TRACK (slug = name):
${programList}

SOURCE: ${sourceName}
PAGE CONTENT (markdown, truncated):
"""
${markdown.slice(0, 9000)}
"""

${CLASSIFY_SCHEMA_HINT}`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = message.content.find((c) => c.type === 'text')?.text ?? '[]'
    const json = text.slice(text.indexOf('['), text.lastIndexOf(']') + 1)
    const parsed = JSON.parse(json) as Array<{ program_slug: string | null; signal_type: string; summary: string; confidence: string }>
    const validSlugs = new Set(programs.map((p) => p.slug))
    const validTypes = new Set(['devaluation', 'new_partner', 'ended_partner', 'ratio_change', 'other'])
    return parsed
      .filter((x) => x && typeof x.summary === 'string' && x.summary.trim())
      .map((x) => ({
        programSlug: x.program_slug && validSlugs.has(x.program_slug) ? x.program_slug : null,
        signalType: (validTypes.has(x.signal_type) ? x.signal_type : 'other') as ChangeSignal['signalType'],
        summary: x.summary.trim().slice(0, 200),
        confidence: (['high', 'med', 'low'].includes(x.confidence) ? x.confidence : 'med') as ChangeSignal['confidence'],
      }))
  } catch (err) {
    console.error(`[scanAnnouncements] Haiku classify failed for ${sourceName}:`, err)
    return []
  }
}

export async function scanAnnouncements(supabase: SupabaseClient): Promise<ChangeSignal[]> {
  // Programs we actually maintain transfer data for: the canonical currencies +
  // every program that appears as one of their outbound targets.
  const { data: progRows } = await supabase
    .from('programs')
    .select('slug, name, is_active, is_transferable_currency, transfer_partners_outbound')
    .eq('is_active', true)

  const all = (progRows ?? []) as Array<{ slug: string; name: string; is_transferable_currency: boolean | null; transfer_partners_outbound: Array<{ from_slug: string }> | null }>
  const tracked = new Set<string>()
  for (const p of all) {
    if (p.is_transferable_currency) {
      tracked.add(p.slug)
      for (const r of p.transfer_partners_outbound ?? []) tracked.add(r.from_slug)
    }
  }
  const classifierPrograms: ClassifierProgram[] = all
    .filter((p) => tracked.has(p.slug))
    .map((p) => ({ slug: p.slug, name: p.name }))
  const nameNeedles = classifierPrograms.map((p) => ({ slug: p.slug, needle: p.name.toLowerCase() }))

  const signals: ChangeSignal[] = []

  for (const source of ANNOUNCEMENT_SOURCES) {
    const res = await fetchFirecrawl(source.url, { maxChars: 12000 })
    if (!res.ok) {
      console.warn(`[scanAnnouncements] ${source.name} fetch failed: ${res.reason}`)
      continue
    }
    const md = res.markdown
    const lower = md.toLowerCase()

    // Cheap prefilter: must contain a change keyword AND mention a tracked program.
    const hasChangeWord = CHANGE_KEYWORDS.some((k) => lower.includes(k))
    const mentionsProgram = nameNeedles.some((n) => n.needle.length > 3 && lower.includes(n.needle))
    if (!hasChangeWord || !mentionsProgram) continue

    const classified = await classifyWithHaiku(source.name, md, classifierPrograms)
    for (const c of classified) {
      const contentHash = hash(`${source.url}|${c.programSlug ?? ''}|${c.signalType}|${c.summary.slice(0, 60)}`)
      // Pull a short excerpt around the first program mention for context.
      let excerpt: string | null = null
      const needle = c.programSlug ? nameNeedles.find((n) => n.slug === c.programSlug)?.needle : undefined
      if (needle) {
        const idx = lower.indexOf(needle)
        if (idx >= 0) excerpt = md.slice(Math.max(0, idx - 80), idx + 200).replace(/\s+/g, ' ').trim()
      }
      signals.push({
        contentHash,
        sourceName: source.name,
        sourceUrl: source.url,
        programSlug: c.programSlug,
        signalType: c.signalType,
        summary: c.summary,
        excerpt,
        confidence: c.confidence,
      })
    }
  }

  return signals
}
