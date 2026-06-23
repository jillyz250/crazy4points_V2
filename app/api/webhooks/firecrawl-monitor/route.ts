/**
 * Firecrawl Monitor webhook — receives monitor.page events for the welcome-bonus
 * monitor and writes card_bonus_signals (the same rows the daily scanCardBonuses
 * cron writes), routed into /admin/card-bonus-signals. Flag-for-review only;
 * never edits a bonus.
 *
 * The monitor runs in cheap MARKDOWN mode (1 credit/scrape) with a goal, so each
 * check only detects "did this card's page change?". When the goal-judge flags a
 * MEANINGFUL change, this webhook re-extracts the CURRENT offer from that one
 * page (Firecrawl + Haiku, via extractCardBonusFromUrl) and compares it to our
 * STORED value — so the expensive extraction runs on the rare change, not daily
 * across the whole set. Same content_hash as the cron => no duplicate signals.
 *
 * Auth: Firecrawl is configured to send `Authorization: Bearer
 * ${FIRECRAWL_WEBHOOK_SECRET}`; we reject anything else.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import type { CardBonusSignal } from '@/utils/integrity/scanCardBonuses'
import { extractCardBonusFromUrl } from '@/utils/integrity/scanCardBonuses'
import { signalContentHash, persistCardBonusSignals, emailFreshSignals, welcomeBonusDisplayTotal } from '@/utils/integrity/cardBonusSignals'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface MonitorPage {
  url: string
  status: 'same' | 'new' | 'changed' | 'removed' | 'error'
  isMeaningful?: boolean
  judgment?: { confidence?: 'high' | 'med' | 'low' }
}

export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const secret = process.env.FIRECRAWL_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ ok: false, error: 'not configured' }, { status: 500 })
  const auth = request.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${secret}`) {
    console.warn('[firecrawl-monitor] rejected request with bad/missing bearer')
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let body: { type?: string; data?: MonitorPage[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 })
  }

  // Only act on per-page events; check.completed is acknowledged and ignored.
  if (body.type !== 'monitor.page') return NextResponse.json({ ok: true, ignored: body.type })

  // Re-extract only pages the goal-judge flagged as a MEANINGFUL change (skip
  // cosmetic churn). isMeaningful===false means the judge ruled it noise.
  const pages = (body.data ?? []).filter((p) => p.status === 'changed' && p.isMeaningful !== false)
  if (!pages.length) return NextResponse.json({ ok: true, changed: 0 })

  const supabase = createAdminClient()
  const signals: CardBonusSignal[] = []
  let reextracted = 0

  for (const page of pages) {
    // Map the URL back to the one card that owns it (shared comparison-page URLs
    // are excluded from the monitor's target list, so this is 1:1).
    const { data: row } = await supabase
      .from('credit_card_welcome_bonuses')
      .select('card_id, bonus_amount, bonus_currency, spend_required_usd, tiered_bonuses, source_url, credit_cards!inner(slug, name, is_active, status)')
      .eq('is_current', true)
      .eq('source_url', page.url)
      .maybeSingle()
    if (!row) continue
    const c = Array.isArray(row.credit_cards) ? row.credit_cards[0] : row.credit_cards
    if (!c || !c.is_active || c.status !== 'active') continue

    // Re-extract the current offer from this one changed page.
    const extracted = await extractCardBonusFromUrl(page.url, c.name)
    reextracted++
    if (!extracted || !extracted.found || extracted.bonus_amount == null) continue

    const detectedAmount = extracted.bonus_amount
    const detectedSpend = extracted.spend_required_usd
    const storedAmount = row.bonus_amount as number | null
    const storedSpend = row.spend_required_usd as number | null
    // Tiered cards store bonus_amount = first tier, but the page headline (and
    // the extractor) read the "Up to X" total. Treat a detected value as a real
    // change only if it matches NEITHER the first tier NOR the headline total.
    const tiers = row.tiered_bonuses as Array<{ bonus_amount?: unknown; spend_usd?: unknown }> | null
    const hasTiers = Array.isArray(tiers) && tiers.length > 0
    const storedTotal = storedAmount != null ? welcomeBonusDisplayTotal(storedAmount, tiers, storedSpend) : null
    const amountChanged = storedAmount != null && detectedAmount !== storedAmount && detectedAmount !== storedTotal
    // Spend threshold is ambiguous on tiered cards (the extractor may read the
    // first-tier minimum or the combined spend), so only trust it on flat cards.
    const spendChanged = !hasTiers && detectedSpend != null && storedSpend != null && detectedSpend !== storedSpend
    if (!amountChanged && !spendChanged) continue

    const parts: string[] = []
    if (amountChanged) parts.push(`bonus ${storedAmount?.toLocaleString()} -> ${detectedAmount.toLocaleString()}`)
    if (spendChanged) parts.push(`spend $${storedSpend?.toLocaleString()} -> $${detectedSpend?.toLocaleString()}`)
    const conf = extracted.confidence ?? page.judgment?.confidence
    signals.push({
      contentHash: signalContentHash(row.card_id as string, detectedAmount, detectedSpend),
      cardId: row.card_id as string,
      cardSlug: c.slug,
      cardName: c.name,
      sourceUrl: page.url,
      bonusCurrency: (row.bonus_currency as string | null) ?? null,
      storedAmount,
      storedSpend,
      detectedAmount,
      detectedSpend,
      summary: `${c.name}: ${parts.join(', ')}`.slice(0, 200),
      confidence: (['high', 'med', 'low'].includes(conf ?? '') ? conf : 'med') as CardBonusSignal['confidence'],
    })
  }

  const fresh = await persistCardBonusSignals(supabase, signals)
  await emailFreshSignals(fresh, 'Firecrawl Monitor')

  console.log(`[firecrawl-monitor] changed=${pages.length} reextracted=${reextracted} flagged=${signals.length} new=${fresh.length}`)
  return NextResponse.json({ ok: true, changed: pages.length, reextracted, flagged: signals.length, new: fresh.length })
}
