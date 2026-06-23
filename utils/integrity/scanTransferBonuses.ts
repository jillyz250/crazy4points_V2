import type { SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { fetchFirecrawl } from '@/utils/ai/firecrawl'
import { isBonusActive } from '@/utils/programs/transferBonus'

/**
 * Transfer-bonus detection monitor (the missing half of the self-expiring bonus
 * system). We built bonus EXPIRY but had no DETECTION — every bonus was caught
 * by hand. This scrapes the dedicated "current transfer bonuses" aggregator
 * pages, extracts the full live list, and diffs it against our bonus_active
 * flags to surface bonuses we're MISSING. Writes change_signals for review
 * (signal_type='transfer_bonus') — detection only, never auto-flags.
 *
 * These aggregator pages list every active credit-card transfer bonus in one
 * table, so one scrape is comprehensive (unlike the announcement monitor, which
 * catches news mentions). Run every few days via /api/cron/transfer-bonus-monitor.
 */
export const TRANSFER_BONUS_SOURCES: { name: string; url: string }[] = [
  { name: 'Frequent Miler — Current Transfer Bonuses', url: 'https://frequentmiler.com/current-point-transfer-bonuses/' },
  { name: 'The Points Guy — Current Transfer Bonuses', url: 'https://thepointsguy.com/loyalty-programs/current-transfer-bonuses/' },
]

export interface TransferBonusSignal {
  contentHash: string
  sourceName: string
  sourceUrl: string
  programSlug: string | null   // the CURRENCY slug (from_slug on the partner row)
  signalType: 'transfer_bonus'
  summary: string
  excerpt: string | null
  confidence: 'high' | 'med' | 'low'
}

function hash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

interface ExtractedBonus {
  currency_slug: string
  partner_slug: string
  bonus_pct: number | null
  end_date: string | null
}

async function extractBonuses(
  markdown: string,
  currencies: { slug: string; name: string }[],
  partners: { slug: string; name: string }[],
): Promise<ExtractedBonus[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return []
  const client = new Anthropic({ apiKey })
  const prompt = `You read a "current transfer bonuses" page and extract every ACTIVE credit-card points transfer bonus.

OUR CURRENCY PROGRAMS (slug = name) — the points being transferred FROM:
${currencies.map((c) => `${c.slug} = ${c.name}`).join('\n')}

OUR PARTNER PROGRAMS (slug = name) — the airline/hotel transferred TO:
${partners.map((p) => `${p.slug} = ${p.name}`).join('\n')}

PAGE CONTENT (markdown, truncated):
"""
${markdown.slice(0, 12000)}
"""

Return ONLY a JSON array (possibly empty). One item per active bonus:
{"currency_slug":"<one of our currency slugs>","partner_slug":"<one of our partner slugs>","bonus_pct":<number or null>,"end_date":"<YYYY-MM-DD or null>"}

RULES:
- currency_slug MUST be one of our currency slugs; partner_slug MUST be one of our partner slugs. If you can't confidently map BOTH ends to our slugs, OMIT that bonus.
- Only ACTIVE bonuses (not expired, not "ended", not historical). If the page lists an end date in the past, omit it.
- bonus_pct is the bonus percentage (e.g. 30 for a 30% bonus). null if not stated.
- Precision over recall — omit anything ambiguous.`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = message.content.find((c) => c.type === 'text')?.text ?? '[]'
    const json = text.slice(text.indexOf('['), text.lastIndexOf(']') + 1)
    const parsed = JSON.parse(json) as ExtractedBonus[]
    const curSet = new Set(currencies.map((c) => c.slug))
    const partSet = new Set(partners.map((p) => p.slug))
    return parsed.filter((b) => b && curSet.has(b.currency_slug) && partSet.has(b.partner_slug))
  } catch (err) {
    console.error('[scanTransferBonuses] Haiku extract failed:', err)
    return []
  }
}

export async function scanTransferBonuses(supabase: SupabaseClient): Promise<TransferBonusSignal[]> {
  const { data: progRows } = await supabase
    .from('programs')
    .select('slug, name, is_active, is_transferable_currency, transfer_partners_outbound')
    .eq('is_active', true)
  const all = (progRows ?? []) as Array<{
    slug: string
    name: string
    is_transferable_currency: boolean | null
    transfer_partners_outbound: Array<{ from_slug: string; bonus_active?: boolean; bonus_end_date?: string | null }> | null
  }>

  const currencies = all.filter((p) => p.is_transferable_currency).map((p) => ({ slug: p.slug, name: p.name }))
  const nameBySlug = new Map(all.map((p) => [p.slug, p.name]))
  // Partner universe = every program that appears as an outbound target.
  const partnerSlugs = new Set<string>()
  for (const p of all) if (p.is_transferable_currency) for (const r of p.transfer_partners_outbound ?? []) partnerSlugs.add(r.from_slug)
  const partners = [...partnerSlugs].map((slug) => ({ slug, name: nameBySlug.get(slug) ?? slug }))

  // Current state: which currency->partner edges are ALREADY flagged active.
  const activeEdge = new Set<string>()
  const outboundByCurrency = new Map<string, Array<{ from_slug: string; bonus_active?: boolean; bonus_end_date?: string | null }>>()
  for (const p of all) {
    if (!p.is_transferable_currency) continue
    outboundByCurrency.set(p.slug, p.transfer_partners_outbound ?? [])
    for (const r of p.transfer_partners_outbound ?? []) {
      if (isBonusActive(r)) activeEdge.add(`${p.slug}|${r.from_slug}`)
    }
  }

  const signals: TransferBonusSignal[] = []
  const emitted = new Set<string>()

  for (const source of TRANSFER_BONUS_SOURCES) {
    const res = await fetchFirecrawl(source.url, { maxChars: 16000 })
    if (!res.ok) {
      console.warn(`[scanTransferBonuses] ${source.name} fetch failed: ${res.reason}`)
      continue
    }
    const bonuses = await extractBonuses(res.markdown, currencies, partners)
    for (const b of bonuses) {
      const edge = `${b.currency_slug}|${b.partner_slug}`
      // Already flagged active in our data → nothing to do.
      if (activeEdge.has(edge)) continue
      if (emitted.has(edge)) continue
      emitted.add(edge)

      const curName = nameBySlug.get(b.currency_slug) ?? b.currency_slug
      const partName = nameBySlug.get(b.partner_slug) ?? b.partner_slug
      const pct = b.bonus_pct != null ? `${b.bonus_pct}% ` : ''
      const ends = b.end_date ? ` (ends ${b.end_date})` : ''
      signals.push({
        contentHash: hash(`tbonus|${edge}|${b.bonus_pct ?? ''}`),
        sourceName: source.name,
        sourceUrl: source.url,
        programSlug: b.currency_slug,
        signalType: 'transfer_bonus',
        summary: `${pct}transfer bonus ${curName} -> ${partName}${ends} is live but NOT flagged in our data.`.slice(0, 200),
        excerpt: b.end_date ? `Set bonus_active=true with bonus_end_date=${b.end_date} if confirmed.` : null,
        confidence: b.end_date && b.bonus_pct != null ? 'high' : 'med',
      })
    }
  }

  return signals
}
