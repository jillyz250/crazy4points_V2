import type { SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { fetchFirecrawl } from '@/utils/ai/firecrawl'
import { welcomeBonusDisplayTotal, welcomeBonusAmountChanged, isCashCurrency } from './cardBonusSignals'

/**
 * Welcome-bonus monitor. For each active card that has a current welcome bonus
 * and a source_url, scrape that page, ask Haiku to read off the CURRENT sign-up
 * bonus (amount + spend), and flag any card whose live offer differs from what
 * we have stored. Detection only - writes to card_bonus_signals for review at
 * /admin/card-bonus-signals; never edits the bonus.
 *
 * The monitored set is computed at runtime, so any newly-authored card (which
 * always gets a source_url on its welcome bonus) auto-joins on the next run.
 */

export interface CardBonusSignal {
  contentHash: string
  cardId: string
  cardSlug: string
  cardName: string
  sourceUrl: string
  bonusCurrency: string | null
  storedAmount: number | null
  storedSpend: number | null
  detectedAmount: number | null
  detectedSpend: number | null
  summary: string
  confidence: 'high' | 'med' | 'low'
}

interface MonitoredCard {
  card_id: string
  card_slug: string
  card_name: string
  source_url: string
  bonus_currency: string | null
  stored_amount: number | null
  stored_spend: number | null
  stored_tiers: Array<{ bonus_amount?: unknown; spend_usd?: unknown }> | null
}

// Tiny stable hash (matches scanAnnouncements) for the dedup key.
function hash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

interface ExtractedBonus {
  bonus_amount: number | null
  spend_required_usd: number | null
  found: boolean
  confidence: 'high' | 'med' | 'low'
}

async function extractBonusWithHaiku(
  client: Anthropic,
  cardName: string,
  markdown: string,
  bonusCurrency?: string | null,
): Promise<ExtractedBonus | null> {
  // Cash-back cards store their bonus in DOLLARS (Freedom Flex = $200), but the
  // issuer page often headlines the same offer in points (20,000 = $200 at
  // 1pt=1¢). Tell the extractor to report in the card's OWN unit so detected is
  // directly comparable to stored — otherwise every such card false-flags.
  const unitRule = isCashCurrency(bonusCurrency)
    ? `- bonus_amount = the sign-up bonus as a US DOLLAR figure (e.g. a "$200 bonus" → 200). This is a CASH-BACK card; if the page states the bonus only in points/miles, convert at 1 point = 1 cent (20,000 points → 200). Prefer an explicit dollar figure when the page shows one.`
    : `- bonus_amount = the headline sign-up bonus in points or miles (e.g. 60000). If the offer is "up to X" or elevated/limited-time, use the highest current headline number.`
  const prompt = `You read a credit-card marketing page and report its CURRENT primary welcome / sign-up bonus.

CARD: ${cardName}
PAGE CONTENT (markdown, truncated):
"""
${markdown.slice(0, 9000)}
"""

Return ONLY a JSON object:
{"found": true|false, "bonus_amount": <integer, no commas>, "spend_required_usd": <integer minimum spend in USD>, "confidence": "high|med|low"}

Rules:
${unitRule}
- spend_required_usd = the minimum spend to earn it (e.g. 3500). If no minimum spend, use 0.
- found=false if the page does not clearly state a current welcome bonus (paywalled, JS-only, expired, or absent). When found=false, set the numbers to null.
- Do NOT guess. If you cannot read a clear number, found=false. Precision over recall.`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = message.content.find((c) => c.type === 'text')?.text ?? ''
    const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
    if (!json) return null
    const parsed = JSON.parse(json) as ExtractedBonus
    return parsed
  } catch (err) {
    console.error(`[scanCardBonuses] Haiku extract failed for ${cardName}:`, err)
    return null
  }
}

/**
 * Extract the current welcome bonus for ONE card's source URL (Firecrawl scrape
 * + Haiku read). Used by the Firecrawl Monitor webhook to re-extract only the
 * page the monitor flagged as changed — so the expensive extraction runs on the
 * rare change, not daily across the whole set. Returns null if unconfigured,
 * the scrape failed, or no clear bonus was found.
 */
export async function extractCardBonusFromUrl(
  url: string,
  cardName: string,
  bonusCurrency?: string | null,
): Promise<ExtractedBonus | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  const client = new Anthropic({ apiKey })
  const res = await fetchFirecrawl(url, { maxChars: 12000 })
  if (!res.ok) {
    console.warn(`[extractCardBonusFromUrl] ${url} fetch failed: ${res.reason}`)
    return null
  }
  return extractBonusWithHaiku(client, cardName, res.markdown, bonusCurrency)
}

export async function scanCardBonuses(supabase: SupabaseClient): Promise<CardBonusSignal[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return []
  const client = new Anthropic({ apiKey })

  // Monitored set: active cards with a current welcome bonus + a source_url.
  const { data: rows } = await supabase
    .from('credit_card_welcome_bonuses')
    .select('card_id, bonus_amount, bonus_currency, spend_required_usd, tiered_bonuses, source_url, credit_cards!inner(slug, name, is_active, status)')
    .eq('is_current', true)
    .not('source_url', 'is', null)

  // A source_url shared by 2+ current cards is a multi-card COMPARISON page: the
  // extractor can't reliably tell which card's offer is which (it once read
  // JetBlue Plus's 60k off the comparison page and flagged it against the basic
  // JetBlue Card's 10k). Skip those cards entirely -- they need per-card source
  // URLs (preferred) or manual review. This also future-proofs against any new
  // card that lands on a comparison page (e.g. Bilt, Best Western).
  const urlCounts = new Map<string, number>()
  for (const r of (rows ?? []) as Array<{ source_url: string }>) {
    urlCounts.set(r.source_url, (urlCounts.get(r.source_url) ?? 0) + 1)
  }

  const cards: MonitoredCard[] = []
  for (const r of (rows ?? []) as Array<{
    card_id: string
    bonus_amount: number | null
    bonus_currency: string | null
    spend_required_usd: number | null
    tiered_bonuses: Array<{ bonus_amount?: unknown }> | null
    source_url: string
    credit_cards: { slug: string; name: string; is_active: boolean; status: string } | { slug: string; name: string; is_active: boolean; status: string }[]
  }>) {
    const c = Array.isArray(r.credit_cards) ? r.credit_cards[0] : r.credit_cards
    if (!c || !c.is_active || c.status !== 'active') continue
    if ((urlCounts.get(r.source_url) ?? 0) > 1) {
      console.warn(`[scanCardBonuses] skipping ${c.slug}: source_url shared by ${urlCounts.get(r.source_url)} cards (comparison page)`)
      continue
    }
    cards.push({
      card_id: r.card_id,
      card_slug: c.slug,
      card_name: c.name,
      source_url: r.source_url,
      bonus_currency: r.bonus_currency,
      stored_amount: r.bonus_amount,
      stored_spend: r.spend_required_usd,
      stored_tiers: r.tiered_bonuses,
    })
  }

  // Bound Firecrawl/Haiku spend per run. The monitored set grows with the card
  // catalog, so scanning every card daily is unbounded cost. Cap to
  // MAX_CARDS_PER_RUN and rotate the window by day (deterministic) so every card
  // is still covered over a few days. 40/run = a ~2-day full sweep across the
  // ~80 monitored cards (chosen 2026-06-29 when the real-time Firecrawl Monitor
  // was retired — see plans/monitoring-consolidation.md).
  const MAX_CARDS_PER_RUN = 40
  cards.sort((a, b) => a.card_slug.localeCompare(b.card_slug))
  let selectedCards = cards
  if (cards.length > MAX_CARDS_PER_RUN) {
    const dayIndex = Math.floor(Date.now() / 86_400_000)
    const start = (dayIndex * MAX_CARDS_PER_RUN) % cards.length
    selectedCards = Array.from(
      { length: MAX_CARDS_PER_RUN },
      (_, i) => cards[(start + i) % cards.length]
    )
    console.warn(
      `[scanCardBonuses] ${cards.length} monitored cards; scanning ${MAX_CARDS_PER_RUN} this run ` +
        `(rotating window start=${start}), skipping ${cards.length - MAX_CARDS_PER_RUN}`
    )
  }

  const signals: CardBonusSignal[] = []

  for (const card of selectedCards) {
    const res = await fetchFirecrawl(card.source_url, { maxChars: 12000 })
    if (!res.ok) {
      console.warn(`[scanCardBonuses] ${card.card_slug} fetch failed: ${res.reason}`)
      continue
    }
    const extracted = await extractBonusWithHaiku(client, card.card_name, res.markdown, card.bonus_currency)
    if (!extracted || !extracted.found || !extracted.bonus_amount) continue

    // Tiered cards store stored_amount = first tier; the page headline (and the
    // extractor) read the "Up to X" total. Real change only if detected matches
    // NEITHER the first tier NOR the headline total — and isn't a cash card's
    // bonus re-expressed in points (the points-as-cents false positive).
    const storedTotal =
      card.stored_amount != null ? welcomeBonusDisplayTotal(card.stored_amount, card.stored_tiers, card.stored_spend) : null
    const amountChanged = welcomeBonusAmountChanged(
      card.stored_amount,
      storedTotal,
      extracted.bonus_amount,
      card.bonus_currency,
    )
    // Spend threshold is ambiguous on tiered cards (the extractor may read the
    // first-tier minimum or the combined spend), so only trust it on flat cards.
    const hasTiers = Array.isArray(card.stored_tiers) && card.stored_tiers.length > 0
    const spendChanged =
      !hasTiers &&
      extracted.spend_required_usd != null &&
      card.stored_spend != null &&
      extracted.spend_required_usd !== card.stored_spend
    if (!amountChanged && !spendChanged) continue

    const parts: string[] = []
    if (amountChanged) {
      parts.push(`bonus ${card.stored_amount?.toLocaleString()} -> ${extracted.bonus_amount.toLocaleString()}`)
    }
    if (spendChanged) {
      parts.push(`spend $${card.stored_spend?.toLocaleString()} -> $${extracted.spend_required_usd?.toLocaleString()}`)
    }
    const summary = `${card.card_name}: ${parts.join(', ')}`

    signals.push({
      contentHash: hash(`${card.card_id}|${extracted.bonus_amount}|${extracted.spend_required_usd ?? ''}`),
      cardId: card.card_id,
      cardSlug: card.card_slug,
      cardName: card.card_name,
      sourceUrl: card.source_url,
      bonusCurrency: card.bonus_currency,
      storedAmount: card.stored_amount,
      storedSpend: card.stored_spend,
      detectedAmount: extracted.bonus_amount,
      detectedSpend: extracted.spend_required_usd,
      summary: summary.slice(0, 200),
      confidence: (['high', 'med', 'low'].includes(extracted.confidence) ? extracted.confidence : 'med') as CardBonusSignal['confidence'],
    })
  }

  return signals
}
