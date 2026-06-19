/**
 * Firecrawl Monitor webhook — receives monitor.page events for the welcome-bonus
 * monitor and writes card_bonus_signals (the same rows the daily scanCardBonuses
 * cron writes), routed into /admin/card-bonus-signals. Flag-for-review only;
 * never edits a bonus.
 *
 * The monitor runs JSON-mode changeTracking with a {bonus_amount,
 * spend_required_usd, currency} schema, so each changed page carries a
 * snapshot.json with the freshly-extracted current offer. We compare that to our
 * STORED value (not just Firecrawl's prior snapshot) — identical semantics to the
 * cron — and only flag genuine differences.
 *
 * Auth: Firecrawl is configured to send `Authorization: Bearer
 * ${FIRECRAWL_WEBHOOK_SECRET}`; we reject anything else.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import type { CardBonusSignal } from '@/utils/integrity/scanCardBonuses'
import { signalContentHash, persistCardBonusSignals, emailFreshSignals } from '@/utils/integrity/cardBonusSignals'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface MonitorPage {
  url: string
  status: 'same' | 'new' | 'changed' | 'removed' | 'error'
  isMeaningful?: boolean
  judgment?: { confidence?: 'high' | 'med' | 'low' }
  snapshot?: { json?: { bonus_amount?: number | null; spend_required_usd?: number | null; currency?: string | null } }
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

  // We only act on per-page events; check.completed is acknowledged and ignored.
  if (body.type !== 'monitor.page') return NextResponse.json({ ok: true, ignored: body.type })

  const pages = (body.data ?? []).filter((p) => p.status === 'changed' && p.snapshot?.json)
  if (!pages.length) return NextResponse.json({ ok: true, changed: 0 })

  const supabase = createAdminClient()
  const signals: CardBonusSignal[] = []

  for (const page of pages) {
    // Map the URL back to the one card that owns it (shared comparison-page URLs
    // are excluded from the monitor's target list, so this is 1:1).
    const { data: row } = await supabase
      .from('credit_card_welcome_bonuses')
      .select('card_id, bonus_amount, bonus_currency, spend_required_usd, source_url, credit_cards!inner(slug, name, is_active, status)')
      .eq('is_current', true)
      .eq('source_url', page.url)
      .maybeSingle()
    if (!row) continue
    const c = Array.isArray(row.credit_cards) ? row.credit_cards[0] : row.credit_cards
    if (!c || !c.is_active || c.status !== 'active') continue

    const detectedAmount = page.snapshot!.json!.bonus_amount ?? null
    const detectedSpend = page.snapshot!.json!.spend_required_usd ?? null
    if (detectedAmount == null) continue // need a number to flag; precision over recall

    const storedAmount = row.bonus_amount as number | null
    const storedSpend = row.spend_required_usd as number | null
    const amountChanged = storedAmount != null && detectedAmount !== storedAmount
    const spendChanged = detectedSpend != null && storedSpend != null && detectedSpend !== storedSpend
    if (!amountChanged && !spendChanged) continue

    const parts: string[] = []
    if (amountChanged) parts.push(`bonus ${storedAmount?.toLocaleString()} -> ${detectedAmount.toLocaleString()}`)
    if (spendChanged) parts.push(`spend $${storedSpend?.toLocaleString()} -> $${detectedSpend?.toLocaleString()}`)
    const conf = page.judgment?.confidence
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

  console.log(`[firecrawl-monitor] changed=${pages.length} flagged=${signals.length} new=${fresh.length}`)
  return NextResponse.json({ ok: true, changed: pages.length, flagged: signals.length, new: fresh.length })
}
