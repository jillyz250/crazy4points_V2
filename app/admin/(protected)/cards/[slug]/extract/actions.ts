'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { extractCardBenefits } from '@/utils/cards/extractCardBenefits'
import { saveExtractedBenefits } from '@/utils/cards/saveExtractedBenefits'
import { discoverCardSourceUrl } from '@/utils/cards/discoverCardSourceUrl'
import { draftGoodToKnow } from '@/utils/cards/draftGoodToKnow'
import { auditGoodToKnow, type GtkAuditIssue } from '@/utils/cards/auditGoodToKnow'
import { setManualOverride } from '@/utils/admin/manualOverride'
import { checkUrl, type UrlCheckResult } from '@/utils/admin/checkUrl'
import type { CardExtraction } from '@/utils/cards/cardExtractionSchema'

/**
 * Validate a single URL on demand — backs the inline "Test URL" button on the
 * extract page. Lets the editor confirm a URL resolves before clicking Run
 * Extraction, so we stop burning Sonnet calls on 404s.
 */
export async function validateUrlAction(formData: FormData): Promise<UrlCheckResult> {
  const url = String(formData.get('url') ?? '').trim()
  if (!url) {
    return { ok: false, status: 0, reason: 'unreachable' }
  }
  return checkUrl(url)
}

/**
 * The one-shot "run extraction" action used by auto-approve mode.
 * Firecrawl + Claude + write to DB in a single round-trip.
 *
 * Returns a result the page can render directly.
 */
export async function runExtractionAndSave(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  const sourceUrl = String(formData.get('source_url') ?? '').trim()
  const interactive = formData.get('interactive') === 'on'
  const manualMarkdown = String(formData.get('manual_markdown') ?? '').trim() || undefined
  // Editor opt-in: when checked, this extraction's source_url replaces the
  // saved official_url. Default OFF so one-off extractions from a secondary
  // URL (e.g. perks sub-page) don't silently corrupt the canonical source.
  const saveSourceUrlAsCanonical = formData.get('save_source_url_as_canonical') === 'on'

  if (!slug || !sourceUrl) {
    console.error('[card-extract] missing slug or source_url')
    return
  }

  const supabase = createAdminClient()
  const { data: card, error } = await supabase
    .from('credit_cards')
    .select('id, name, official_url, guide_to_benefits_url, pricing_terms_url, rotating_categories_url')
    .eq('slug', slug)
    .single()

  if (error || !card) {
    console.error(`[card-extract] card not found: ${slug}`)
    return
  }

  // Persist the URL on the card row only when:
  //   (a) the card has no official_url yet (first-time setup), OR
  //   (b) the editor explicitly opted in via the "save as canonical" checkbox.
  // Without this guard, every one-off extraction from a secondary URL silently
  // corrupts the canonical product page URL (the IHG Premier Business loop).
  const shouldPersistUrl =
    sourceUrl !== card.official_url && (!card.official_url || saveSourceUrlAsCanonical)
  if (shouldPersistUrl) {
    await supabase
      .from('credit_cards')
      .update({ official_url: sourceUrl })
      .eq('id', card.id)
  }

  // 1. Extract — scrape product + guide + pricing terms + rotating categories
  // (all that are populated) for full coverage. The rotating_categories_url
  // is critical for cards like Freedom Flex / Discover It / Cap One Savor One
  // where the current quarter's 5x bonuses live on a separate page.
  const secondaryUrls = [
    card.guide_to_benefits_url as string | null,
    card.pricing_terms_url as string | null,
    card.rotating_categories_url as string | null,
  ].filter((u): u is string => !!u && u.trim().length > 0)
  const finalSecondaryUrls = secondaryUrls.length > 0 ? secondaryUrls : undefined
  const extractionResult = await extractCardBenefits({
    cardId: card.id,
    cardName: card.name,
    sourceUrl,
    interactive,
    manualMarkdown,
    secondaryUrls: finalSecondaryUrls,
  })

  if (!extractionResult.ok) {
    console.error(`[card-extract] extraction failed: ${extractionResult.error}`)
    // Still revalidate so the failure row appears in the audit log on next render.
    revalidatePath(`/admin/cards/${slug}/extract`)
    return
  }

  // 2. Auto-approve: save immediately
  const saveResult = await saveExtractedBenefits({
    cardId: card.id,
    extractionId: extractionResult.extractionId,
    extraction: extractionResult.extraction,
    sourceUrl,
  })

  if (!saveResult.ok) {
    console.error(`[card-extract] save failed: ${saveResult.error}`)
    // Surface the error to the editor by marking the extraction failed.
    // Without this the row stays 'extracted' even though no data landed in
    // credit_card_benefits / earn_rates / welcome_bonuses — silent failure.
    await supabase
      .from('credit_card_extractions')
      .update({
        status: 'failed',
        error_message: `Save failed after extraction: ${saveResult.error}`,
      })
      .eq('id', extractionResult.extractionId)
  } else {
    console.log(`[card-extract] saved card=${slug} benefits=${saveResult.benefitsSaved} earn=${saveResult.earnRatesSaved} wb=${saveResult.welcomeBonusSaved} historical_high=${saveResult.newHistoricalHigh}`)
  }

  // 3. Revalidate the card's public page so the new data renders
  revalidatePath(`/cards/${slug}`)
  revalidatePath(`/admin/cards/${slug}/extract`)
}

/**
 * Re-save a previously cached extraction WITHOUT re-running Firecrawl/Claude.
 * Useful when the editor edited the extraction JSON manually and wants to
 * re-persist, or when the save step failed and we want to retry.
 */
export async function resaveExtraction(formData: FormData): Promise<void> {
  const extractionId = String(formData.get('extraction_id') ?? '').trim()
  if (!extractionId) return

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('credit_card_extractions')
    .select('id, card_id, source_url, extraction, credit_cards!inner(slug)')
    .eq('id', extractionId)
    .single()

  if (error || !data) {
    console.error('[card-extract] resave: extraction row not found')
    return
  }

  const result = await saveExtractedBenefits({
    cardId: data.card_id,
    extractionId: data.id,
    extraction: data.extraction as CardExtraction,
    sourceUrl: data.source_url,
  })

  if (!result.ok) {
    console.error(`[card-extract] resave failed: ${result.error}`)
    await supabase
      .from('credit_card_extractions')
      .update({
        status: 'failed',
        error_message: `Re-save failed: ${result.error}`,
      })
      .eq('id', extractionId)
  } else {
    // Clear any stale error_message from a prior failed attempt — otherwise
    // the review UI shows the old red banner alongside the saved status.
    await supabase
      .from('credit_card_extractions')
      .update({
        status: 'saved',
        saved_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', extractionId)
  }

  const slug = (data as unknown as { credit_cards: { slug: string } }).credit_cards?.slug
  if (slug) {
    revalidatePath(`/cards/${slug}`)
    revalidatePath(`/admin/cards/${slug}/extract`)
  }
}

/**
 * Mark an extraction as rejected (will not be applied to the card).
 */
export async function rejectExtraction(formData: FormData): Promise<void> {
  const extractionId = String(formData.get('extraction_id') ?? '').trim()
  if (!extractionId) return

  const supabase = createAdminClient()
  await supabase
    .from('credit_card_extractions')
    .update({ status: 'rejected' })
    .eq('id', extractionId)
}

/**
 * Manual welcome bonus entry — used when extraction returns null bonus_amount
 * (issuer page hides the points behind the apply flow, common with Citi).
 *
 * Editor fills the inline form on the extract page. We save the manual entry
 * to credit_card_welcome_bonuses (same shape as extracted welcome bonuses)
 * and stamp metadata so future audits know it was editorial entry.
 */
export async function saveManualWelcomeBonus(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  const bonusAmount = parseInt(String(formData.get('bonus_amount') ?? ''), 10)
  const bonusCurrency = String(formData.get('bonus_currency') ?? '').trim()
  const spendRequired = parseInt(String(formData.get('spend_required_usd') ?? ''), 10)
  const spendWindowMonths = parseInt(String(formData.get('spend_window_months') ?? ''), 10)
  const spendWindowDays = parseInt(String(formData.get('spend_window_days') ?? ''), 10)
  const baselineRaw = String(formData.get('baseline_bonus_amount') ?? '').trim()
  const baseline = baselineRaw ? parseInt(baselineRaw, 10) : null
  const sourceUrl = String(formData.get('source_url') ?? '').trim()
  const notes = String(formData.get('notes') ?? '').trim() || null

  if (!slug || !Number.isFinite(bonusAmount) || !bonusCurrency || !Number.isFinite(spendRequired) || (!Number.isFinite(spendWindowMonths) && !Number.isFinite(spendWindowDays))) {
    console.error('[card-extract] manual welcome bonus — missing required fields (need a spend window in months or days)')
    return
  }

  const supabase = createAdminClient()
  const { data: card } = await supabase.from('credit_cards').select('id').eq('slug', slug).single()
  if (!card) {
    console.error(`[card-extract] manual welcome bonus — card not found: ${slug}`)
    return
  }

  // Demote any current offer
  await supabase
    .from('credit_card_welcome_bonuses')
    .update({ is_current: false })
    .eq('card_id', card.id)
    .eq('is_current', true)

  // Determine elevation vs. baseline
  const effectiveBaseline = baseline ?? bonusAmount
  const isElevated = bonusAmount > effectiveBaseline

  // Historical-high check
  const { data: maxRow } = await supabase
    .from('credit_card_welcome_bonuses')
    .select('bonus_amount')
    .eq('card_id', card.id)
    .order('bonus_amount', { ascending: false })
    .limit(1)
    .maybeSingle()
  const previousMax = (maxRow?.bonus_amount as number | undefined) ?? 0
  const isHistoricalHigh = bonusAmount >= previousMax && previousMax > 0

  const now = new Date().toISOString()
  await supabase.from('credit_card_welcome_bonuses').insert({
    card_id: card.id,
    bonus_amount: bonusAmount,
    bonus_currency: bonusCurrency,
    spend_required_usd: spendRequired,
    spend_window_months: Number.isFinite(spendWindowMonths) ? spendWindowMonths : null,
    spend_window_days: Number.isFinite(spendWindowDays) ? spendWindowDays : null,
    baseline_bonus_amount: effectiveBaseline,
    is_elevated: isElevated,
    is_current: true,
    is_historical_high: isHistoricalHigh,
    tiered_bonuses: [],
    extras: notes,
    source_url: sourceUrl || null,
    verified_at: now,
  })

  revalidatePath(`/cards/${slug}`)
  revalidatePath(`/admin/cards/${slug}/extract`)
}

/**
 * Discover the issuer URLs for a card via Firecrawl /map + Sonnet.
 * Persists suggestions to credit_cards.suggested_field_urls so the
 * extract page UI can show them with an "Apply" button.
 */
export async function discoverCardUrlsAction(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  const startingUrl = String(formData.get('starting_url') ?? '').trim()

  if (!slug || !startingUrl) {
    console.error('[card-discover] missing slug or starting URL')
    return
  }

  const supabase = createAdminClient()
  const { data: card } = await supabase
    .from('credit_cards')
    .select('id, name, issuer:issuers(name)')
    .eq('slug', slug)
    .single()

  if (!card) {
    console.error(`[card-discover] card not found: ${slug}`)
    return
  }

  const issuerName = Array.isArray(card.issuer)
    ? (card.issuer[0] as { name?: string } | undefined)?.name ?? ''
    : (card.issuer as { name?: string } | null)?.name ?? ''

  const result = await discoverCardSourceUrl({
    cardId: card.id,
    cardName: card.name,
    issuerName,
    startingUrl,
  })

  if (!result.ok) {
    console.error(`[card-discover] failed: ${result.error}`)
  }

  revalidatePath(`/admin/cards/${slug}/extract`)
}

/**
 * Apply Sonnet's discovered source_url to credit_cards.official_url so the
 * extract form pre-fills it. Plus auto-register any promo / newsroom
 * suggestions to the sources table for the alerts pipeline.
 */
export async function applyDiscoveredCardUrls(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  if (!slug) return

  const supabase = createAdminClient()
  const { data: card } = await supabase
    .from('credit_cards')
    .select('id, name, suggested_field_urls')
    .eq('slug', slug)
    .single()

  if (!card) return

  const suggestions = (card.suggested_field_urls as Record<string, { url?: string } | null>) ?? {}

  // Look up the issuer's primary domain so we can validate that discovery's
  // proposed URLs actually live on the issuer's site. Catches the case where
  // discovery returns a third-party aggregator URL (e.g.
  // traveler.marriott.com/credit-cards/bold-boundless-credit-card for a Chase
  // Marriott card) — those should NOT auto-set as the card's source_url.
  const { data: cardForIssuer } = await supabase
    .from('credit_cards')
    .select('issuer_id')
    .eq('id', card.id)
    .single()
  const { data: issuer } = cardForIssuer?.issuer_id
    ? await supabase.from('issuers').select('slug').eq('id', cardForIssuer.issuer_id).single()
    : { data: null }

  // Per-issuer allowed product-page domain patterns. Any suggestion URL
  // outside this list is treated as "discovery got confused" and SKIPPED
  // for auto-set (editor can still set manually).
  const ISSUER_DOMAINS: Record<string, string[]> = {
    chase: ['creditcards.chase.com', 'chase.com'],
    amex: ['americanexpress.com'],
    citi: ['citi.com', 'citicards.com'],
    'capital-one': ['capitalone.com'],
    barclays: ['cards.barclaycardus.com', 'barclaycardus.com'],
    'bank-of-america': ['bankofamerica.com'],
    'wells-fargo': ['wellsfargo.com'],
    'us-bank': ['usbank.com'],
    fnbo: ['fnbo.com'],
    bilt: ['biltrewards.com'],
  }
  const allowedDomains = issuer?.slug ? (ISSUER_DOMAINS[issuer.slug] ?? []) : []
  function isOnIssuerDomain(url: string): boolean {
    if (allowedDomains.length === 0) return true  // No allowlist → permissive
    try {
      const host = new URL(url).hostname.toLowerCase()
      return allowedDomains.some((d) => host === d || host.endsWith('.' + d))
    } catch {
      return false
    }
  }

  // Apply source_url to credit_cards.official_url
  // AND guide_to_benefits_url so the next extraction scrapes both.
  // Skip any URL that's NOT on the issuer's allowed domains — those need
  // editor review.
  const cardUpdate: Record<string, string | null> = {}
  const skipped: string[] = []
  for (const [field, target] of [
    ['source_url', 'official_url'],
    ['guide_to_benefits_url', 'guide_to_benefits_url'],
    ['pricing_terms_url', 'pricing_terms_url'],
  ] as const) {
    const url = suggestions[field]?.url
    if (!url) continue
    if (isOnIssuerDomain(url)) {
      cardUpdate[target] = url
    } else {
      skipped.push(`${field}=${url} (not on ${issuer?.slug ?? 'issuer'} domain)`)
    }
  }
  if (skipped.length > 0) {
    console.warn(`[apply-card-urls] skipped non-issuer URLs for ${slug}: ${skipped.join('; ')}`)
  }
  if (Object.keys(cardUpdate).length > 0) {
    await supabase.from('credit_cards').update(cardUpdate).eq('id', card.id)
  }

  // Auto-register Scout sources for promo + newsroom
  for (const kind of ['promo_source', 'newsroom_source'] as const) {
    const url = suggestions[kind]?.url
    if (!url) continue
    const name = kind === 'promo_source'
      ? `${card.name} — Current Offers`
      : `${card.name} — Newsroom`
    const notes = kind === 'promo_source'
      ? `Auto-registered from /admin/cards/${slug}/extract discovery. Time-sensitive issuer promos.`
      : `Auto-registered from /admin/cards/${slug}/extract discovery. Press releases / announcements.`
    // Idempotent select-then-insert/update
    const { data: existing } = await supabase
      .from('sources')
      .select('id')
      .eq('url', url)
      .maybeSingle()
    if (existing) {
      await supabase
        .from('sources')
        .update({ name, is_active: true, scrape_frequency: 'daily', notes })
        .eq('id', existing.id)
    } else {
      await supabase.from('sources').insert({
        name,
        url,
        type: 'official_partner',
        tier: 1,
        is_active: true,
        use_firecrawl: true,
        scrape_frequency: 'daily',
        notes,
      })
    }
  }

  revalidatePath(`/admin/cards/${slug}/extract`)
  revalidatePath('/admin/sources')
}

/**
 * Manually set any of the four URL columns on the card row. Used when
 * Discover URLs missed a URL (e.g., the shared Chase Freedom benefits guide
 * for Freedom Unlimited — Sonnet's classifier filtered it out as not
 * card-specific). Editor pastes the URL directly; no Sonnet involved.
 */
export async function setCardUrlField(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  const field = String(formData.get('field') ?? '').trim()
  const url = String(formData.get('url') ?? '').trim()

  if (!slug || !field) return
  const ALLOWED = new Set(['official_url', 'guide_to_benefits_url', 'pricing_terms_url', 'rotating_categories_url'])
  if (!ALLOWED.has(field)) {
    console.error(`[card-url-edit] disallowed field: ${field}`)
    return
  }

  const supabase = createAdminClient()
  // Empty string clears the field (set to null)
  const value = url.length > 0 ? url : null
  const { error: updateErr } = await supabase
    .from('credit_cards')
    .update({ [field]: value })
    .eq('slug', slug)
  if (updateErr) {
    console.error(`[card-url-edit] update failed: ${updateErr.message}`)
  }

  revalidatePath(`/admin/cards/${slug}/extract`)
}

/**
 * Set a manually-overridden field on the card (e.g., foreign_transaction_fee_pct
 * for cards where the issuer doesn't publish a public Schumer-box).
 * Updates both the column value AND credit_cards.manual_overrides jsonb so the
 * /admin/manual-overrides stale-values report can surface it for periodic
 * re-verification.
 */
export async function setCardManualOverride(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  const field = String(formData.get('field') ?? '').trim()
  const rawValue = String(formData.get('value') ?? '').trim()
  const note = String(formData.get('note') ?? '').trim()

  if (!slug || !field || !rawValue) {
    console.error('[manual-override] missing slug/field/value')
    return
  }

  // Coerce value type based on field name. Keep this list tight — only fields
  // the editor is actually expected to manually override get accepted.
  const NUMERIC_FIELDS = new Set([
    'foreign_transaction_fee_pct',
    'annual_fee_usd',
    'authorized_user_fee_usd',
    'authorized_user_bonus_points',
    'referral_bonus_amount',
    'referral_cap_per_year',
  ])
  const ENUM_FIELDS = new Set(['credit_score_recommended'])

  let value: unknown = rawValue
  if (NUMERIC_FIELDS.has(field)) {
    const n = parseFloat(rawValue)
    if (!Number.isFinite(n)) {
      console.error(`[manual-override] invalid numeric value for ${field}: ${rawValue}`)
      return
    }
    value = n
  } else if (ENUM_FIELDS.has(field)) {
    if (!['fair', 'good', 'excellent'].includes(rawValue)) {
      console.error(`[manual-override] invalid enum value for ${field}: ${rawValue}`)
      return
    }
  }

  const result = await setManualOverride({
    table: 'credit_cards',
    slug,
    field,
    value,
    note,
  })

  if (!result.ok) {
    console.error(`[manual-override] failed: ${result.error}`)
  }

  revalidatePath(`/admin/cards/${slug}/extract`)
  revalidatePath(`/cards/${slug}`)
  revalidatePath('/admin/manual-overrides')
}

/**
 * Sonnet-draft a good_to_know block for this card in Jill's voice, using
 * existing good_to_know on other cards as few-shot voice samples.
 *
 * Returns the draft text (does NOT auto-save) so the editor can review and
 * edit in the textarea before committing via Save. Returning a result also
 * lets the UI surface errors instead of failing silently.
 *
 * Editor's responsibility: review before publishing. Sonnet is a writing
 * assistant, not a final authority. ~$0.02 per call.
 */
export async function draftGoodToKnowAction(
  formData: FormData,
): Promise<{ ok: true; draft: string } | { ok: false; error: string }> {
  const slug = String(formData.get('slug') ?? '').trim()
  if (!slug) return { ok: false, error: 'Missing card slug.' }

  const supabase = createAdminClient()
  const { data: card } = await supabase
    .from('credit_cards')
    .select('id')
    .eq('slug', slug)
    .single()
  if (!card) {
    console.error(`[good-to-know] card not found: ${slug}`)
    return { ok: false, error: `Card not found: ${slug}` }
  }

  const result = await draftGoodToKnow({ supabase, cardId: card.id as string })
  if (!result.ok) {
    console.error(`[good-to-know] draft failed: ${result.error}`)
    return { ok: false, error: result.error }
  }

  console.log(`[good-to-know] drafted for ${slug} (${result.voiceSamplesUsed} voice samples, ${result.draft.length} chars)`)
  return { ok: true, draft: result.draft }
}

/**
 * Save good_to_know directly from the textarea on the extract page, then run
 * the accuracy guardrail: the saved text is fact-checked against the card's
 * COMPLETE record and any conflicts are returned so the editor sees them
 * inline. This makes the QC un-skippable - every save is audited against full
 * data (the gap that let unreviewed/inaccurate callouts ship before).
 */
export async function saveGoodToKnowAction(
  formData: FormData,
): Promise<{ ok: boolean; issues: GtkAuditIssue[] }> {
  const slug = String(formData.get('slug') ?? '').trim()
  const value = String(formData.get('good_to_know') ?? '')
  if (!slug) return { ok: false, issues: [] }

  const supabase = createAdminClient()
  const { data: card } = await supabase
    .from('credit_cards')
    .update({
      good_to_know: value.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('slug', slug)
    .select('id')
    .single()

  revalidatePath(`/admin/cards/${slug}/extract`)
  revalidatePath(`/cards/${slug}`)

  // Guardrail: audit the freshly-saved text against the complete card record.
  const issues = card && value.trim()
    ? await auditGoodToKnow(supabase, card.id as string, value.trim())
    : []
  return { ok: true, issues }
}
