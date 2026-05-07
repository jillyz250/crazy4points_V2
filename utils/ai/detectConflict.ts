/**
 * Phase B conflict detector — checks whether a new intel_items row contains
 * claims that contradict existing program-page content.
 *
 * Server-side only. Called from build-brief cron after intel is ingested.
 *
 * Approach:
 *   1. For each program slug in intel_items.programs, fetch the program row's
 *      key fields (intro, quirks, transfer_partners, tier_benefits,
 *      award_chart, lounge_access, sweet_spots, how_to_spend).
 *   2. Send to Haiku 4.5 with a strict-JSON prompt asking "does the intel
 *      contradict any of these fields?"
 *   3. If YES, return the structured conflict (program_id, field, summary,
 *      quoted snippets). Caller writes back to intel_items.conflicts_*.
 *   4. If NO or UNCERTAIN, return null. Avoid false positives - we'd rather
 *      miss a real conflict than spam admin with noise.
 */

import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from './logUsage'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface IntelItemForDetection {
  id: string
  headline: string
  raw_text: string | null
  programs: string[] | null
}

export interface ConflictResult {
  conflicts_program_id: string
  conflict_field: 'intro' | 'quirks' | 'transfer_partners' | 'tier_benefits' | 'award_chart' | 'lounge_access' | 'sweet_spots' | 'how_to_spend'
  conflict_summary: string
  conflict_intel_claim: string
  conflict_program_text: string
}

const PROGRAM_FIELDS = [
  'id',
  'slug',
  'name',
  'intro',
  'quirks',
  'transfer_partners',
  'tier_benefits',
  'award_chart',
  'lounge_access',
  'sweet_spots',
  'how_to_spend',
] as const

type ProgramRow = {
  id: string
  slug: string
  name: string
  intro: string | null
  quirks: string | null
  transfer_partners: unknown
  tier_benefits: unknown
  award_chart: string | null
  lounge_access: string | null
  sweet_spots: string | null
  how_to_spend: string | null
}

function programFieldsToText(p: ProgramRow): string {
  const parts: string[] = [`# ${p.name} (slug: ${p.slug})`, '']
  if (p.intro) parts.push(`## intro\n${p.intro}\n`)
  if (p.transfer_partners) parts.push(`## transfer_partners\n${JSON.stringify(p.transfer_partners, null, 2)}\n`)
  if (p.tier_benefits) parts.push(`## tier_benefits\n${JSON.stringify(p.tier_benefits, null, 2)}\n`)
  if (p.award_chart) parts.push(`## award_chart\n${p.award_chart}\n`)
  if (p.sweet_spots) parts.push(`## sweet_spots\n${p.sweet_spots}\n`)
  if (p.how_to_spend) parts.push(`## how_to_spend\n${p.how_to_spend}\n`)
  if (p.lounge_access) parts.push(`## lounge_access\n${p.lounge_access}\n`)
  if (p.quirks) parts.push(`## quirks\n${p.quirks}\n`)
  return parts.join('\n')
}

const SYSTEM_PROMPT = `You are a fact-checker comparing a single news intel item against a loyalty-program reference page on crazy4points.com.

Your ONE job: detect whether the intel CONTRADICTS something specific in the program page.

A conflict means the intel says X but the program page says NOT-X (or some other concrete value Y). Examples:
- Intel: "Aer Lingus AerClub now accepts Capital One transfers" - Program page lists Cap One as NOT a direct partner. CONFLICT.
- Intel: "Cathay Pacific charges 75K for biz class to Asia" - Program page award_chart says 85K. CONFLICT.
- Intel: "Marriott Bonvoy now transfers to Korean Air" - Program page says Marriott partnership ENDED 2025. CONFLICT.
- Intel: "ITA Airways joined Star Alliance" - Program page already says this. NO CONFLICT (consistent).
- Intel: "Lufthansa expanded to a new city" - Program page doesn't claim anything about this city. NO CONFLICT (silence != contradiction).

CRITICAL RULES:
1. Silence is NOT a conflict. Only flag when both sources make claims that disagree on a SPECIFIC fact.
2. Vague intel + specific page = no conflict. The intel must be making a clear concrete claim.
3. If you're uncertain, say NO. Better to miss a real conflict than to flag false positives.
4. Confirmations are NOT conflicts. If intel restates what the page says, return NO.
5. Date drift: if program page says "as of May 2026" and intel adds new May 2026 details that don't contradict - NO CONFLICT.

Output STRICT JSON ONLY. No prose, no markdown:
{
  "conflict": true | false,
  "field": "intro" | "quirks" | "transfer_partners" | "tier_benefits" | "award_chart" | "lounge_access" | "sweet_spots" | "how_to_spend" | null,
  "summary": "one-line plain-English description of the disagreement, or null",
  "intel_claim": "quoted-or-paraphrased snippet from the intel (under 200 chars), or null",
  "program_text": "quoted-or-paraphrased snippet from the program field that disagrees (under 200 chars), or null"
}

If conflict=false, all other fields must be null.`

async function callHaiku(
  client: Anthropic,
  intel: IntelItemForDetection,
  program: ProgramRow
): Promise<ConflictResult | null> {
  const userMessage = `INTEL ITEM:
Headline: ${intel.headline}
Raw text: ${intel.raw_text ?? '(no raw text)'}

PROGRAM PAGE CONTENT:
${programFieldsToText(program)}

Does the intel contradict any specific claim in the program page? Output the strict JSON.`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  await logUsage(response, 'detect_conflict', {
    intel_id: intel.id,
    program_slug: program.slug,
  })

  const content = response.content[0]
  if (content.type !== 'text') return null
  const raw = content.text.trim()

  // Strip markdown fences if Haiku added them despite instructions
  const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let parsed: {
    conflict: boolean
    field: ConflictResult['conflict_field'] | null
    summary: string | null
    intel_claim: string | null
    program_text: string | null
  }
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    console.warn('[detectConflict] non-JSON response:', raw.slice(0, 200))
    return null
  }

  if (!parsed.conflict || !parsed.field || !parsed.summary) return null

  return {
    conflicts_program_id: program.id,
    conflict_field: parsed.field,
    conflict_summary: parsed.summary,
    conflict_intel_claim: parsed.intel_claim ?? '',
    conflict_program_text: parsed.program_text ?? '',
  }
}

/**
 * Detect conflicts for a single intel item against all linked programs.
 * Returns the FIRST conflict found (one item -> one flag for now). Future
 * version could return multiple if intel touches multiple programs.
 */
export async function detectConflict(
  supabase: SupabaseClient,
  intel: IntelItemForDetection
): Promise<ConflictResult | null> {
  if (!intel.programs || intel.programs.length === 0) return null

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[detectConflict] ANTHROPIC_API_KEY not set; skipping')
    return null
  }

  // Fetch program rows for the linked slugs. Filter to authored programs
  // only (intro length > 500) - we can't detect conflicts against empty
  // pages. is_reference_stub=true rows also skipped (load-bearing FK
  // targets, not authored content).
  const { data: programs, error } = await supabase
    .from('programs')
    .select(PROGRAM_FIELDS.join(','))
    .in('slug', intel.programs)
    .eq('is_active', true)
    .eq('is_reference_stub', false)

  if (error || !programs) {
    console.warn('[detectConflict] program fetch failed:', error?.message)
    return null
  }

  const candidates = (programs as unknown as ProgramRow[]).filter(
    (p) => (p.intro?.length ?? 0) > 500
  )

  if (candidates.length === 0) return null

  const client = new Anthropic({ apiKey })

  for (const program of candidates) {
    try {
      const result = await callHaiku(client, intel, program)
      if (result) return result
    } catch (err) {
      console.warn(`[detectConflict] Haiku call failed for ${program.slug}:`, err)
    }
  }

  return null
}
