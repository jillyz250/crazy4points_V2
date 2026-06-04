import type { SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { fetchFirecrawl } from '@/utils/ai/firecrawl'
import type { TransferPartnerRow } from '@/utils/supabase/queries'

/**
 * Layer 3 of the data-accuracy plan: the weekly re-verification sweep.
 *
 * For each program we maintain transfer data on, scrape a known roster source,
 * compare it to our stored transfer_partners_outbound, and emit GHOST / MISSING
 * / WRONG_RATIO findings for human review.
 *
 * ARCHITECTURE (after the day-1 noise lesson): the model is bad at *comparing*
 * (it flags 1:0.8 vs 5:4 as a discrepancy, and naming differences as ghosts).
 * So the model ONLY extracts the source roster (name -> our-slug -> ratio); the
 * comparison is done in deterministic CODE - ratios normalized to miles-per-
 * point and compared numerically, ghosts suppressed when the scrape looks
 * incomplete. This kills the equal-ratio / naming / truncation false positives.
 *
 * Detection only. Findings are leads to verify against the issuer's own page,
 * never auto-applied (sources are aggregators; issuer pages are bot-blocked).
 */

export const VERIFICATION_SOURCES: Record<string, { label: string; url: string }> = {
  'capital-one': { label: 'Capital One (official)', url: 'https://www.capitalone.com/learn-grow/money-management/venture-miles-transfer-partnerships/' },
  amex: { label: 'Upgraded Points', url: 'https://upgradedpoints.com/credit-cards/amex-membership-rewards-transfer-partners/' },
  chase: { label: 'Upgraded Points', url: 'https://upgradedpoints.com/credit-cards/chase-ultimate-rewards-transfer-partners/' },
  citi: { label: 'Upgraded Points', url: 'https://upgradedpoints.com/credit-cards/citi-thankyou-points-transfer-partners/' },
  bilt: { label: 'AwardWallet', url: 'https://awardwallet.com/credit-cards/bilt-rewards/bilt-transfer-partners/' },
  'wells-fargo': { label: 'AwardWallet', url: 'https://awardwallet.com/credit-cards/wells-fargo-rewards/transfer-partners/' },
  'marriott-bonvoy': { label: 'point.me', url: 'https://www.point.me/insights/marriott-bonvoy-transfer-partners/' },
  hilton: { label: 'Upgraded Points', url: 'https://upgradedpoints.com/travel/hotels/hilton-honors-transfer-partners/' },
  accor: { label: 'Points Math', url: 'https://pointsmath.com/accor-airline-partners-everything-you-need-to-know/' },
}

export type VerificationFindingType = 'ghost' | 'missing' | 'wrong_ratio'

export interface VerificationFinding {
  contentHash: string
  programSlug: string
  partnerSlug: string | null
  partnerName: string | null
  findingType: VerificationFindingType
  ours: string | null
  theirs: string | null
  confidence: 'high' | 'med' | 'low'
  summary: string
  sourceLabel: string
  sourceUrl: string
}

function hash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/** Normalize a ratio string to miles-per-point (B/A from "A:B"), pulling the
 *  first numeric A:B token so annotated ratios ("3:1 with bonus") still parse.
 *  Returns null for descriptive/non-numeric ratios (e.g. dollar-denominated). */
function ratioValue(s: string | null | undefined): number | null {
  if (typeof s !== 'string') return null
  const m = s.match(/(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/)
  if (!m) return null
  const a = parseFloat(m[1])
  const b = parseFloat(m[2])
  if (!a || Number.isNaN(a) || Number.isNaN(b)) return null
  return b / a
}

function ratiosEqual(ours: string | null, theirs: string | null): boolean {
  const a = ratioValue(ours)
  const b = ratioValue(theirs)
  if (a == null || b == null) return true // can't compare numerically -> don't flag
  if (a === 0 && b === 0) return true
  return Math.abs(a - b) / Math.max(a, b) <= 0.03
}

interface SourcePartner {
  source_name: string
  matched_slug: string | null
  ratio: string | null
}

/** Model extracts ONLY - no comparison. Returns the source roster as a list of
 *  {source_name, matched_slug (from our slug list), ratio "A:B"}. */
async function extractSourceRoster(
  programName: string,
  slugList: string,
  sourceLabel: string,
  sourceMarkdown: string,
): Promise<SourcePartner[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return []
  const client = new Anthropic({ apiKey })
  const prompt = `Extract the airline/hotel transfer-partner roster for ${programName} from the scraped page below. DO NOT compare or judge anything - just extract what the page lists.

OUR PROGRAM SLUG LIST (slug = name) - map each source partner to the matching slug, or null if none fits. Note: "Avios" / "British Airways" / "British Airways Club" / "Executive Club" all map to ba-avios; "Singapore" / "KrisFlyer" -> krisflyer; "Air France" / "KLM" / "Flying Blue" -> flying-blue; "Air Canada" / "Aeroplan" -> aeroplan; "Atmos" / "Alaska" / "Hawaiian" -> atmos.
${slugList}

SCRAPED PAGE (${sourceLabel}, markdown):
"""
${sourceMarkdown.slice(0, 16000)}
"""

Return ONLY a JSON array. One item per transfer partner the page lists:
{"source_name": "<name on the page>", "matched_slug": "<our slug or null>", "ratio": "<the conversion as 'A:B', e.g. '3:1', '10:1', '1:0.8'; convert '25,000 = 6,500' to '25:6.5'; null if the page gives no numeric ratio>"}

Only include programs the page actually presents as transfer partners (ignore navigation, ads, related-article links). If the page roster looks partial/cut off, still return what you can - do not invent partners.`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = message.content.find((c) => c.type === 'text')?.text ?? '[]'
    const json = text.slice(text.indexOf('['), text.lastIndexOf(']') + 1)
    const parsed = JSON.parse(json) as Array<Record<string, unknown>>
    return parsed
      .filter((x) => x && typeof x.source_name === 'string')
      .map((x) => ({
        source_name: String(x.source_name),
        matched_slug: typeof x.matched_slug === 'string' && x.matched_slug ? x.matched_slug : null,
        ratio: typeof x.ratio === 'string' && x.ratio ? x.ratio : null,
      }))
  } catch (err) {
    console.error(`[reverifyTransfers] extract failed for ${programName}:`, err)
    return []
  }
}

async function reverifyProgram(
  supabase: SupabaseClient,
  slug: string,
  slugList: string,
  validSlugs: Set<string>,
): Promise<VerificationFinding[]> {
  const source = VERIFICATION_SOURCES[slug]
  if (!source) return []

  const { data: prog } = await supabase
    .from('programs')
    .select('name, transfer_partners_outbound')
    .eq('slug', slug)
    .single()
  if (!prog) return []

  const rows = ((prog.transfer_partners_outbound ?? []) as TransferPartnerRow[]).filter((r) => r.from_slug)
  if (rows.length === 0) return []
  const ourMap = new Map(rows.map((r) => [r.from_slug, r.ratio]))

  const res = await fetchFirecrawl(source.url, { maxChars: 18000 })
  if (!res.ok) {
    console.warn(`[reverifyTransfers] ${slug} source fetch failed: ${res.reason}`)
    return []
  }

  const roster = await extractSourceRoster(prog.name as string, slugList, source.label, res.markdown)
  // Map source -> slug (only slugs we actually recognize).
  const sourceBySlug = new Map<string, SourcePartner>()
  const unmatched: SourcePartner[] = []
  for (const sp of roster) {
    if (sp.matched_slug && validSlugs.has(sp.matched_slug)) sourceBySlug.set(sp.matched_slug, sp)
    else unmatched.push(sp)
  }

  // Coverage gate: if the source matched far fewer partners than we store, the
  // scrape was likely partial -> suppress GHOST/MISSING (avoid truncation noise).
  const coverage = sourceBySlug.size / Math.max(1, ourMap.size)
  const sourceLooksComplete = coverage >= 0.6 && sourceBySlug.size >= 3

  const out: { partnerSlug: string | null; partnerName: string | null; findingType: VerificationFindingType; ours: string | null; theirs: string | null; confidence: VerificationFinding['confidence']; summary: string }[] = []

  // WRONG_RATIO + MISSING (source-driven, deterministic).
  for (const [pSlug, sp] of sourceBySlug) {
    if (ourMap.has(pSlug)) {
      const ours = ourMap.get(pSlug) ?? null
      if (!ratiosEqual(ours, sp.ratio)) {
        out.push({ partnerSlug: pSlug, partnerName: sp.source_name, findingType: 'wrong_ratio', ours, theirs: sp.ratio, confidence: 'high', summary: `Ratio differs: we store ${ours}, ${source.label} shows ${sp.ratio}.` })
      }
    } else if (sourceLooksComplete) {
      out.push({ partnerSlug: pSlug, partnerName: sp.source_name, findingType: 'missing', ours: 'absent', theirs: sp.ratio, confidence: 'med', summary: `${source.label} lists ${sp.source_name} (${sp.ratio ?? 'ratio n/a'}); we don't have it.` })
    }
  }

  // GHOST (our slugs absent from a complete-looking source roster).
  if (sourceLooksComplete) {
    for (const [pSlug, ratio] of ourMap) {
      if (!sourceBySlug.has(pSlug)) {
        out.push({ partnerSlug: pSlug, partnerName: null, findingType: 'ghost', ours: ratio, theirs: 'absent', confidence: 'med', summary: `We list ${pSlug} but ${source.label}'s roster doesn't - possible removed partner (verify on the issuer page).` })
      }
    }
  }

  // MISSING with no slug match (potential genuinely-new partner we have no row
  // for). Low confidence - could be a name the model couldn't map. Only when the
  // source looks complete, capped to avoid noise.
  if (sourceLooksComplete) {
    for (const sp of unmatched.slice(0, 6)) {
      if (!sp.ratio) continue
      out.push({ partnerSlug: null, partnerName: sp.source_name, findingType: 'missing', ours: 'absent', theirs: sp.ratio, confidence: 'low', summary: `${source.label} lists "${sp.source_name}" (${sp.ratio}) - not in our roster or slug list. New partner?` })
    }
  }

  return out.map((f) => ({
    ...f,
    programSlug: slug,
    sourceLabel: source.label,
    sourceUrl: source.url,
    contentHash: hash(`${slug}|${f.partnerSlug ?? f.partnerName ?? ''}|${f.findingType}`),
  }))
}

/**
 * Re-verify up to `limit` programs, oldest-reverified first (rotation). Marks
 * reverified_at on each processed. Returns all findings produced this run.
 */
export async function reverifyDue(supabase: SupabaseClient, limit = 8): Promise<VerificationFinding[]> {
  const sourceSlugs = Object.keys(VERIFICATION_SOURCES)

  const { data: allProgs } = await supabase.from('programs').select('slug, name').eq('is_active', true)
  const validSlugs = new Set<string>()
  for (const p of (allProgs ?? []) as Array<{ slug: string }>) validSlugs.add(p.slug)
  const slugList = (allProgs ?? [])
    .map((p: { slug: string; name: string }) => `${p.slug} = ${p.name}`)
    .join('\n')

  const { data: due } = await supabase
    .from('programs')
    .select('slug, reverified_at')
    .in('slug', sourceSlugs)
    .order('reverified_at', { ascending: true, nullsFirst: true })
    .limit(limit)
  const slugs = (due ?? []).map((p: { slug: string }) => p.slug)

  const findings: VerificationFinding[] = []
  for (const slug of slugs) {
    const f = await reverifyProgram(supabase, slug, slugList, validSlugs)
    findings.push(...f)
    await supabase.from('programs').update({ reverified_at: new Date().toISOString() }).eq('slug', slug)
  }
  return findings
}
