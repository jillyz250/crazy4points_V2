/**
 * Sonnet-drafts a "good to know before you apply" callout block for a
 * credit card in Jill's voice.
 *
 * Strategy:
 *   1. Pull the card's structured data (AF, SUB, top benefits, earn rates, intro)
 *   2. Pull 2-3 recent good_to_know examples from other cards as few-shot voice samples
 *   3. Prompt Sonnet with: voice samples + card facts + strict source-only rule
 *   4. Return draft as plain text with "- " bullets
 *
 * Editor reviews + edits before saving — Sonnet output is a starting point,
 * not a final commit. Cost: ~$0.02 per card.
 *
 * Voice anchors (from existing Jill good_to_know on Hyatt Personal/Business
 * and Marriott Brilliant): caps for emphasis, dry humor, parenthetical
 * asides, "vibes and risk models" register, scannable lead phrases.
 */

import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/utils/ai/logUsage'
import type { SupabaseClient } from '@supabase/supabase-js'

const MODEL = 'claude-sonnet-4-6'
const MAX_FEW_SHOT_EXAMPLES = 3

export type DraftResult =
  | { ok: true; draft: string; voiceSamplesUsed: number }
  | { ok: false; error: string }

/**
 * Pull recent good_to_know examples to use as few-shot voice anchors.
 * Orders by length (most-developed samples first) then by updated_at.
 */
async function loadVoiceSamples(
  supabase: SupabaseClient,
  excludeCardId: string,
): Promise<Array<{ card_name: string; good_to_know: string }>> {
  const { data } = await supabase
    .from('credit_cards')
    .select('id, name, good_to_know, updated_at')
    .not('good_to_know', 'is', null)
    .neq('id', excludeCardId)
    .order('updated_at', { ascending: false })
    .limit(20)

  // Filter to ones with substantial content (≥5 bullets, ≥400 chars), take top N
  const candidates = (data ?? []).filter((c) => {
    const gtk = c.good_to_know as string | null
    if (!gtk) return false
    const bulletCount = (gtk.match(/^\s*-\s/gm) ?? []).length
    return gtk.length >= 400 && bulletCount >= 5
  })

  return candidates.slice(0, MAX_FEW_SHOT_EXAMPLES).map((c) => ({
    card_name: c.name as string,
    good_to_know: c.good_to_know as string,
  }))
}

interface CardContext {
  name: string
  card_type: string | null
  card_tier: string | null
  annual_fee_usd: number | null
  foreign_transaction_fee_pct: number | null
  intro: string | null
  status: string | null
  closed_to_new_applicants: boolean
  issuer_name: string | null
  currency_program_name: string | null
}

interface BenefitContext {
  name: string
  category: string
  description: string | null
  value_amount: number | null
  value_unit: string | null
  frequency: string | null
}

interface EarnRateContext {
  category: string
  multiplier: number
  booking_channel: string
  cap_amount_usd: number | null
  cap_period: string | null
  notes: string | null
}

interface WelcomeBonusContext {
  bonus_amount: number | null
  bonus_currency: string | null
  spend_required_usd: number | null
  spend_window_months: number | null
  spend_window_days: number | null
  extras: string | null
}

function buildPrompt(
  card: CardContext,
  benefits: BenefitContext[],
  earnRates: EarnRateContext[],
  welcomeBonus: WelcomeBonusContext | null,
  voiceSamples: Array<{ card_name: string; good_to_know: string }>,
): string {
  const samplesBlock =
    voiceSamples.length > 0
      ? voiceSamples
          .map(
            (s) =>
              `=== VOICE SAMPLE: ${s.card_name} ===\n${s.good_to_know}\n=== END SAMPLE ===`,
          )
          .join('\n\n')
      : '(No prior good_to_know examples available; match the cheeky-but-grounded voice described below.)'

  const benefitsBlock = benefits.length
    ? benefits
        .slice(0, 25)
        .map((b) => {
          const val = b.value_amount
            ? ` ($${b.value_amount}${b.value_unit ? '/' + b.value_unit : ''}${b.frequency ? '/' + b.frequency : ''})`
            : ''
          return `- ${b.name}${val}${b.description ? ': ' + b.description.slice(0, 200) : ''}`
        })
        .join('\n')
    : '(none)'

  const earnRatesBlock = earnRates.length
    ? earnRates
        .map((r) => {
          const cap = r.cap_amount_usd
            ? ` (capped $${r.cap_amount_usd.toLocaleString()}${r.cap_period ? '/' + r.cap_period : ''})`
            : ''
          return `- ${r.multiplier}x on ${r.category}${cap}${r.notes ? ' — ' + r.notes.slice(0, 150) : ''}`
        })
        .join('\n')
    : '(none)'

  const wbWindow = welcomeBonus?.spend_window_days
    ? `${welcomeBonus.spend_window_days} days`
    : `${welcomeBonus?.spend_window_months ?? '?'} months`
  const wbBlock = welcomeBonus
    ? `${welcomeBonus.bonus_amount?.toLocaleString() ?? '?'} ${welcomeBonus.bonus_currency ?? 'points'} after $${welcomeBonus.spend_required_usd?.toLocaleString() ?? '?'} in ${wbWindow}${welcomeBonus.extras ? ` (extras: ${welcomeBonus.extras})` : ''}`
    : '(none / not currently disclosed)'

  return `You are drafting a "Good to know before you apply" callout for a credit card on crazy4points.com. This block is the editor's voice layer — what she'd tell a friend who's about to apply. Match the voice of the samples below EXACTLY.

VOICE SAMPLES (study these carefully — match the tone, structure, energy):

${samplesBlock}

VOICE FINGERPRINT:
- Caps for emphasis (USE, NO, ONE, PAID, MONTH, etc.)
- Dry humor, occasional cheeky asides
- Parenthetical commentary ("(the math only works if...)", "(Everything else is vibes and risk models.)")
- Lead phrase + dash/period split for scannability ("$650/year is steep - the math only works if...")
- Snarky but never mean
- Reader-friend energy: warning them about the gotchas without lecturing
- Em-dashes ("—") are OK in DRAFTS but will be converted to hyphens before save

STRUCTURAL RULES:
- 5-7 bullets, no more
- Each bullet starts with "- "
- First sentence of each bullet is the LEAD PHRASE (gets bolded by renderer)
- For warning bullets (gotchas, exclusions, NO-something rules), start with "NO " — the renderer gives those a gold dot
- Plain ASCII preferred (the SQL pipeline strips smart quotes anyway)

FACT RULES (CRITICAL):
1. ONLY claim facts present in the card data below. Do not invent new benefits, rules, or comparisons.
2. If you don't have a specific number from the data, don't make one up. Generalize ("steep annual fee" is OK; "$695/year" without source is NOT OK).
3. Common claims to AVOID unless explicitly in the data: card-vs-card comparisons (only OK if both data points are below), 5/24 rule, Chase velocity rules, Amex velocity rules ("2/90"), "lifetime" language unless verbatim from issuer.
4. Insurance descriptions should be DESCRIPTIVE not INSTRUCTIONAL. Never tell readers to "decline coverage" or "ditch" anything at a rental counter — that's insurance advice we can't give.

CARD DATA:

Name: ${card.name}
Issuer: ${card.issuer_name ?? 'unknown'}
Type/Tier: ${card.card_type ?? '?'} / ${card.card_tier ?? '?'}
Currency program: ${card.currency_program_name ?? '?'}
Annual fee: ${card.annual_fee_usd != null ? '$' + card.annual_fee_usd : 'unknown'}
FX fee: ${card.foreign_transaction_fee_pct != null ? card.foreign_transaction_fee_pct + '%' : 'unknown'}
Status: ${card.status ?? '?'}${card.closed_to_new_applicants ? ' (CLOSED to new applicants — grandfathered card)' : ''}

Welcome bonus: ${wbBlock}

Earn rates:
${earnRatesBlock}

Top benefits:
${benefitsBlock}

Existing intro (for tone reference only — do NOT repeat verbatim):
${card.intro ?? '(none)'}

OUTPUT FORMAT:
Return ONLY the bullets, one per line, each starting with "- ". No preamble, no explanation, no markdown fences. 5-7 bullets total.

Now write the good_to_know:`
}

export async function draftGoodToKnow({
  supabase,
  cardId,
}: {
  supabase: SupabaseClient
  cardId: string
}): Promise<DraftResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'ANTHROPIC_API_KEY not set' }

  // 1. Pull card row
  const { data: cardRow, error: cardErr } = await supabase
    .from('credit_cards')
    .select(
      `id, name, card_type, card_tier, annual_fee_usd, foreign_transaction_fee_pct,
       intro, status, closed_to_new_applicants,
       issuer:issuers(name),
       currency_program:programs!credit_cards_currency_program_id_fkey(name)`,
    )
    .eq('id', cardId)
    .single()
  if (cardErr || !cardRow) {
    return { ok: false, error: `Card not found: ${cardErr?.message ?? 'no row'}` }
  }

  const issuerName = Array.isArray(cardRow.issuer)
    ? (cardRow.issuer[0] as { name?: string } | undefined)?.name ?? null
    : (cardRow.issuer as { name?: string } | null)?.name ?? null
  const currencyName = Array.isArray(cardRow.currency_program)
    ? (cardRow.currency_program[0] as { name?: string } | undefined)?.name ?? null
    : (cardRow.currency_program as { name?: string } | null)?.name ?? null

  const card: CardContext = {
    name: cardRow.name as string,
    card_type: cardRow.card_type as string | null,
    card_tier: cardRow.card_tier as string | null,
    annual_fee_usd: cardRow.annual_fee_usd as number | null,
    foreign_transaction_fee_pct: cardRow.foreign_transaction_fee_pct as number | null,
    intro: cardRow.intro as string | null,
    status: cardRow.status as string | null,
    closed_to_new_applicants: cardRow.closed_to_new_applicants as boolean,
    issuer_name: issuerName,
    currency_program_name: currencyName,
  }

  // 2. Pull benefits + earn rates + current welcome bonus
  const [benefitsRes, earnRatesRes, wbRes] = await Promise.all([
    supabase
      .from('credit_card_benefits')
      .select('name, category, description, value_amount, value_unit, frequency')
      .eq('card_id', cardId)
      .order('sort_order'),
    supabase
      .from('credit_card_earn_rates')
      .select('category, multiplier, booking_channel, cap_amount_usd, cap_period, notes')
      .eq('card_id', cardId)
      .order('multiplier', { ascending: false }),
    supabase
      .from('credit_card_welcome_bonuses')
      .select('bonus_amount, bonus_currency, spend_required_usd, spend_window_months, spend_window_days, extras')
      .eq('card_id', cardId)
      .eq('is_current', true)
      .maybeSingle(),
  ])

  const benefits = (benefitsRes.data ?? []) as BenefitContext[]
  const earnRates = (earnRatesRes.data ?? []) as EarnRateContext[]
  const welcomeBonus = (wbRes.data as WelcomeBonusContext | null) ?? null

  // 3. Pull voice samples
  const voiceSamples = await loadVoiceSamples(supabase, cardId)

  // 4. Build prompt + call Sonnet
  const prompt = buildPrompt(card, benefits, earnRates, welcomeBonus, voiceSamples)

  const client = new Anthropic({ apiKey })
  let response
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })
  } catch (err) {
    return { ok: false, error: `Sonnet call failed: ${err instanceof Error ? err.message : String(err)}` }
  }

  await logUsage(response, 'draft_good_to_know', { card_id: cardId, card_name: card.name })

  const textBlock = response.content.find((c) => c.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return { ok: false, error: 'Sonnet returned no text' }
  }

  // 5. Clean output: strip any preamble, ensure starts with "- ", normalize line endings
  let draft = textBlock.text.trim()
  // Drop anything before the first "- " bullet
  const firstBullet = draft.indexOf('- ')
  if (firstBullet > 0) draft = draft.slice(firstBullet)
  // Convert em-dashes to plain hyphens for SQL safety (per ASCII-only memory rule)
  draft = draft.replace(/—/g, '-').replace(/–/g, '-')
  // Convert smart quotes to ASCII
  draft = draft.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')

  return { ok: true, draft, voiceSamplesUsed: voiceSamples.length }
}
