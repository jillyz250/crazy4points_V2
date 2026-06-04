import type { SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { fetchFirecrawl } from '@/utils/ai/firecrawl'
import type { TransferPartnerRow } from '@/utils/supabase/queries'

/**
 * Layer 3 of the data-accuracy plan: the weekly re-verification sweep.
 *
 * For each program we maintain transfer data on, scrape a known roster source,
 * have the model compare it to our stored transfer_partners_outbound, and emit
 * GHOST / MISSING / WRONG_RATIO findings. This is the productized form of the
 * 2026-06-04 manual currency + hotel audits - it closes the "silent factual
 * drift" gap that structure checks (P1) and announcement scans (P2) can't.
 *
 * Detection only. Findings go to verification_findings for human review against
 * the issuer's own page before anything is applied. Sources here are reliable
 * aggregators (issuer pages are mostly bot-blocked) - good enough to FLAG a
 * discrepancy, never to auto-apply one.
 */

// program slug -> roster source to scrape. Edit/extend this as programs are
// added. Issuer pages are 403-blocked, so these are the aggregator pages that
// reliably render a full partner+ratio roster via Firecrawl.
export const VERIFICATION_SOURCES: Record<string, { label: string; url: string }> = {
  'capital-one': { label: 'Capital One (official)', url: 'https://www.capitalone.com/learn-grow/money-management/venture-miles-transfer-partnerships/' },
  amex: { label: 'Upgraded Points', url: 'https://upgradedpoints.com/credit-cards/amex-membership-rewards-transfer-partners/' },
  chase: { label: 'Upgraded Points', url: 'https://upgradedpoints.com/credit-cards/chase-ultimate-rewards-transfer-partners/' },
  citi: { label: 'Upgraded Points', url: 'https://upgradedpoints.com/credit-cards/citi-thankyou-points-transfer-partners/' },
  bilt: { label: 'AwardWallet', url: 'https://awardwallet.com/credit-cards/bilt-rewards/bilt-transfer-partners/' },
  'wells-fargo': { label: 'AwardWallet', url: 'https://awardwallet.com/credit-cards/wells-fargo-rewards/transfer-partners/' },
  'marriott-bonvoy': { label: 'point.me', url: 'https://www.point.me/insights/marriott-bonvoy-transfer-partners/' },
  hilton: { label: 'Upgraded Points', url: 'https://upgradedpoints.com/travel/hotels/hilton-honors-transfer-partners/' },
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

const FINDING_SCHEMA = `Return ONLY a JSON array (possibly empty). Each item:
{"partner_slug": "<our slug, or null if the source partner isn't in our slug list>", "partner_name": "<partner name from the source>", "finding_type": "ghost|missing|wrong_ratio", "ours": "<our stored ratio or 'listed'>", "theirs": "<source ratio or 'absent'>", "confidence": "high|med|low", "summary": "<=160 chars"}

DEFINITIONS:
- ghost: WE list this partner but the SOURCE roster does not (possible removed partner).
- missing: the SOURCE lists this partner but WE do not (possible new partner). Map to our slug if one fits; else partner_slug=null.
- wrong_ratio: BOTH list the partner but the conversion DIFFERS in real value (not just wording/format).

RULES: Ignore pure format/wording differences - "5:4" == "1:0.8", "3:1 with bonus" == "3:1". Only flag a wrong_ratio when the actual conversion rate differs. Be conservative: if the source roster looks partial or you're unsure a partner is truly absent, lower the confidence or omit. Precision over recall.`

async function compareWithModel(
  programName: string,
  ourRoster: string,
  slugList: string,
  sourceLabel: string,
  sourceMarkdown: string,
): Promise<Omit<VerificationFinding, 'contentHash' | 'programSlug' | 'sourceLabel' | 'sourceUrl'>[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return []
  const client = new Anthropic({ apiKey })
  const prompt = `You verify a points-and-miles site's stored transfer-partner data against a freshly-scraped roster.

PROGRAM: ${programName}

OUR STORED ROSTER (our_partner_slug = ratio):
${ourRoster}

OUR FULL PROGRAM SLUG LIST (slug = name), for mapping source partner names to slugs:
${slugList}

FRESHLY SCRAPED ROSTER from ${sourceLabel} (markdown, truncated):
"""
${sourceMarkdown.slice(0, 12000)}
"""

${FINDING_SCHEMA}`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = message.content.find((c) => c.type === 'text')?.text ?? '[]'
    const json = text.slice(text.indexOf('['), text.lastIndexOf(']') + 1)
    const parsed = JSON.parse(json) as Array<Record<string, unknown>>
    const validTypes = new Set(['ghost', 'missing', 'wrong_ratio'])
    return parsed
      .filter((x) => x && validTypes.has(String(x.finding_type)) && typeof x.summary === 'string' && (x.summary as string).trim())
      .map((x) => ({
        partnerSlug: typeof x.partner_slug === 'string' && x.partner_slug ? x.partner_slug : null,
        partnerName: typeof x.partner_name === 'string' ? x.partner_name : null,
        findingType: x.finding_type as VerificationFindingType,
        ours: x.ours != null ? String(x.ours) : null,
        theirs: x.theirs != null ? String(x.theirs) : null,
        confidence: (['high', 'med', 'low'].includes(String(x.confidence)) ? x.confidence : 'med') as VerificationFinding['confidence'],
        summary: String(x.summary).trim().slice(0, 200),
      }))
  } catch (err) {
    console.error(`[reverifyTransfers] model compare failed for ${programName}:`, err)
    return []
  }
}

async function reverifyProgram(
  supabase: SupabaseClient,
  slug: string,
  slugList: string,
  nameBySlug: Map<string, string>,
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
  const ourRoster = rows
    .map((r) => `${r.from_slug} (${nameBySlug.get(r.from_slug) ?? r.from_slug}) = ${r.ratio}`)
    .join('\n')

  const res = await fetchFirecrawl(source.url, { maxChars: 14000 })
  if (!res.ok) {
    console.warn(`[reverifyTransfers] ${slug} source fetch failed: ${res.reason}`)
    return []
  }

  const raw = await compareWithModel(prog.name as string, ourRoster, slugList, source.label, res.markdown)
  return raw.map((f) => ({
    ...f,
    programSlug: slug,
    sourceLabel: source.label,
    sourceUrl: source.url,
    contentHash: hash(`${slug}|${f.partnerSlug ?? f.partnerName ?? ''}|${f.findingType}`),
  }))
}

/**
 * Re-verify up to `limit` programs, oldest-reverified first (rotation). Marks
 * reverified_at on each one processed. Returns all findings produced this run.
 */
export async function reverifyDue(supabase: SupabaseClient, limit = 8): Promise<VerificationFinding[]> {
  const sourceSlugs = Object.keys(VERIFICATION_SOURCES)

  // All programs (for slug->name mapping the model uses to resolve partners).
  const { data: allProgs } = await supabase.from('programs').select('slug, name').eq('is_active', true)
  const nameBySlug = new Map<string, string>()
  for (const p of (allProgs ?? []) as Array<{ slug: string; name: string }>) nameBySlug.set(p.slug, p.name)
  const slugList = (allProgs ?? [])
    .map((p: { slug: string; name: string }) => `${p.slug} = ${p.name}`)
    .join('\n')

  // Pick the oldest-reverified programs in the source map.
  const { data: due } = await supabase
    .from('programs')
    .select('slug, reverified_at')
    .in('slug', sourceSlugs)
    .order('reverified_at', { ascending: true, nullsFirst: true })
    .limit(limit)
  const slugs = (due ?? []).map((p: { slug: string }) => p.slug)

  const findings: VerificationFinding[] = []
  for (const slug of slugs) {
    const f = await reverifyProgram(supabase, slug, slugList, nameBySlug)
    findings.push(...f)
    await supabase.from('programs').update({ reverified_at: new Date().toISOString() }).eq('slug', slug)
  }
  return findings
}
