/**
 * Accuracy guardrail for a card's good_to_know callout. Fact-checks it against
 * the card's COMPLETE structured record and returns any genuine conflicts.
 *
 * This is the in-app twin of scripts/audit-card-good-to-know.mjs. It is wired
 * into saveGoodToKnowAction so every save is checked against the full data
 * before anyone trusts it — the QC can't be skipped or run against partial
 * data (which is what caused earlier false-flags / bad edits).
 *
 * Loads EVERYTHING: full benefit descriptions, earn-rate notes, the currency
 * program's transfer partners, issuer, and the card fee/AU fields. Whether a
 * cap is shared-vs-per-category lives in the descriptions, NOT the cap number.
 */
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/utils/ai/logUsage'
import type { SupabaseClient } from '@supabase/supabase-js'

const MODEL = 'claude-sonnet-4-6'

export interface GtkAuditIssue {
  claim: string
  problem: string
  severity: 'high' | 'med' | 'low'
}

async function buildRecord(supabase: SupabaseClient, cardId: string): Promise<string> {
  const { data: card } = await supabase
    .from('credit_cards')
    .select('name, annual_fee_usd, foreign_transaction_fee_pct, authorized_user_fee_usd, currency_program_id, issuer_id')
    .eq('id', cardId)
    .single()
  if (!card) return ''

  const [benRes, earnRes, wbRes, progRes, issRes] = await Promise.all([
    supabase.from('credit_card_benefits').select('name, benefit_type, description, value_amount, value_unit, frequency, spend_threshold_usd, coverage_amount').eq('card_id', cardId).order('sort_order'),
    supabase.from('credit_card_earn_rates').select('category, multiplier, booking_channel, cap_amount_usd, cap_period, notes').eq('card_id', cardId).order('multiplier', { ascending: false }),
    supabase.from('credit_card_welcome_bonuses').select('bonus_amount, bonus_currency, spend_required_usd, spend_window_months, spend_window_days, extras, tiered_bonuses').eq('card_id', cardId).eq('is_current', true).maybeSingle(),
    card.currency_program_id ? supabase.from('programs').select('name, transfer_partners_outbound').eq('id', card.currency_program_id).maybeSingle() : Promise.resolve({ data: null }),
    card.issuer_id ? supabase.from('issuers').select('name').eq('id', card.issuer_id).maybeSingle() : Promise.resolve({ data: null }),
  ])

  type Ben = { name: string; benefit_type: string | null; description: string | null; value_amount: number | null; value_unit: string | null; frequency: string | null; spend_threshold_usd: number | null; coverage_amount: number | null }
  type Earn = { category: string; multiplier: number; booking_channel: string | null; cap_amount_usd: number | null; cap_period: string | null; notes: string | null }
  type Tier = { spend_usd: number; bonus_amount: number; timeline_months: number | null }
  type Prog = { name: string; transfer_partners_outbound: Array<{ from_slug: string; ratio: string; tiers?: unknown }> | null }

  const benefits = ((benRes.data ?? []) as Ben[]).map((b) =>
    `- ${b.name} [type:${b.benefit_type}]${b.spend_threshold_usd ? ` [UNLOCKS after $${b.spend_threshold_usd.toLocaleString()} spend]` : ''}${b.coverage_amount ? ` [coverage up to $${b.coverage_amount.toLocaleString()}]` : ''}${b.value_amount ? ` ($${b.value_amount}${b.value_unit ? '/' + b.value_unit : ''}${b.frequency ? '/' + b.frequency : ''})` : ''}: ${b.description ?? ''}`).join('\n')
  const earn = ((earnRes.data ?? []) as Earn[]).map((e) =>
    `- ${e.multiplier}x ${e.category}${e.booking_channel ? ` (${e.booking_channel})` : ''}${e.cap_amount_usd ? ` [cap $${e.cap_amount_usd.toLocaleString()}/${e.cap_period}]` : ''}${e.notes ? ` :: ${e.notes}` : ''}`).join('\n')
  const w = wbRes.data as { bonus_amount: number; bonus_currency: string; spend_required_usd: number | null; spend_window_months: number | null; spend_window_days: number | null; extras: string | null; tiered_bonuses: Tier[] | null } | null
  const wb = w ? `${w.bonus_amount} ${w.bonus_currency} after $${w.spend_required_usd} in ${w.spend_window_days ? w.spend_window_days + ' days' : w.spend_window_months + ' months'}. ${w.extras ?? ''}${w.tiered_bonuses?.length ? ' Tiers: ' + JSON.stringify(w.tiered_bonuses) : ''}` : '(none)'
  const prog = progRes.data as Prog | null
  const transfers = prog?.transfer_partners_outbound?.length
    ? `Currency "${prog.name}" transfers to: ${prog.transfer_partners_outbound.map((p) => `${p.from_slug} ${p.ratio}${p.tiers ? ' (card-tiered)' : ''}`).join(', ')}`
    : '(no transfer partners / not a transferable-currency card)'
  const issuer = (issRes.data as { name: string } | null)?.name ?? '(not in data)'

  return `Name: ${card.name}
Issuer: ${issuer}
Annual fee: ${card.annual_fee_usd}
FX fee: ${card.foreign_transaction_fee_pct}%
Authorized user fee: ${card.authorized_user_fee_usd ?? '(not in data)'}
Welcome bonus: ${wb}
Earn rates:
${earn || '(none)'}
Transfer partners: ${transfers}
Benefits (full descriptions):
${benefits || '(none)'}`
}

const PROMPT = (record: string, gtk: string) => `Fact-check a credit-card "Good to know" callout against the card's COMPLETE structured record below (the only source of truth). The record includes full benefit descriptions, earn-rate notes, transfer partners, issuer, and fee fields - so if a claim is supported anywhere in it, it is NOT an error.

Flag a bullet ONLY when it genuinely CONFLICTS with the record: a wrong number/fee/ratio, an invented restriction the record contradicts, or a benefit the record shows the card does NOT have. Do NOT flag style/voice, reasonable context, or anything supported anywhere in the record. If a fact simply isn't in the record but isn't contradicted by it, do NOT flag it.

CAPS: whether an earn-rate cap is per-category or shared/combined across categories is determined ONLY by the benefit/earn-rate DESCRIPTIONS ("combined with", "shared", "across X and Y") - NOT by the bare cap number. Do not flag a "combined cap" claim unless a description explicitly says the categories have separate per-category caps, and vice versa.

CARD RECORD:
${record}

GOOD_TO_KNOW:
${gtk}

Return ONLY compact JSON: {"issues":[{"claim":"<short quote>","problem":"<the specific conflict>","severity":"high|med|low"}]}. Empty array if everything checks out.`

/**
 * Audit a good_to_know string against a card's complete record.
 * Never throws — returns an empty issues array on any failure (the save
 * itself should not be blocked by an audit hiccup).
 */
export async function auditGoodToKnow(
  supabase: SupabaseClient,
  cardId: string,
  goodToKnow: string,
): Promise<GtkAuditIssue[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || !goodToKnow.trim()) return []
  try {
    const record = await buildRecord(supabase, cardId)
    if (!record) return []
    const client = new Anthropic({ apiKey })
    const resp = await client.messages.create({ model: MODEL, max_tokens: 1500, messages: [{ role: 'user', content: PROMPT(record, goodToKnow) }] })
    await logUsage(resp, 'audit_good_to_know', { card_id: cardId })
    const tb = resp.content.find((c) => c.type === 'text')
    if (!tb || tb.type !== 'text') return []
    const txt = tb.text
    const json = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)) as { issues?: GtkAuditIssue[] }
    return (json.issues ?? []).filter((i) => i && i.problem)
  } catch {
    return []
  }
}
