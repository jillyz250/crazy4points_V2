#!/usr/bin/env node
/**
 * Audit a card's good_to_know callout for accuracy against the card's COMPLETE
 * structured record. Flags only genuine factual conflicts with the data.
 *
 * WHY THIS EXISTS / WHY IT LOADS EVERYTHING:
 * An earlier throwaway audit fed the model only a slice of the data (benefits +
 * earn + SUB, descriptions truncated, NO transfer partners / earn-rate notes /
 * fee fields). It then flagged real facts as "fabrications" because they
 * weren't in the slice it saw (e.g. Citi -> AAdvantage 1:1, Citi Nights hours).
 * It nearly deleted accurate content. To prevent that recurring, this tool
 * ALWAYS assembles the full record: every benefit field incl. full notes,
 * every earn-rate note, the card's currency-program transfer partners, and the
 * card's fee/AU fields. Never audit card content against partial data.
 *
 * Usage:
 *   node scripts/audit-card-good-to-know.mjs                 # all authored cards
 *   node scripts/audit-card-good-to-know.mjs --slug=<slug>   # one card
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
 * in the environment (the `npm run dev` script strips ANTHROPIC_API_KEY, so run
 * this with the key present, e.g. `set -a; . ./.env.local; set +a; node ...`).
 */
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const onlySlug = (process.argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1] || null

async function fullRecord(card) {
  const [benRes, earnRes, wbRes, progRes] = await Promise.all([
    sb.from('credit_card_benefits').select('name, benefit_type, category, description, value_amount, value_unit, frequency, spend_threshold_usd, coverage_amount').eq('card_id', card.id).order('sort_order'),
    sb.from('credit_card_earn_rates').select('category, multiplier, booking_channel, cap_amount_usd, cap_period, notes').eq('card_id', card.id).order('multiplier', { ascending: false }),
    sb.from('credit_card_welcome_bonuses').select('bonus_amount, bonus_currency, spend_required_usd, spend_window_months, spend_window_days, extras, tiered_bonuses').eq('card_id', card.id).eq('is_current', true).maybeSingle(),
    card.currency_program_id ? sb.from('programs').select('name, transfer_partners_outbound').eq('id', card.currency_program_id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  const benefits = (benRes.data ?? []).map((b) =>
    `- ${b.name} [type:${b.benefit_type}]${b.spend_threshold_usd ? ` [UNLOCKS after $${b.spend_threshold_usd.toLocaleString()} spend]` : ''}${b.coverage_amount ? ` [coverage up to $${b.coverage_amount.toLocaleString()}]` : ''}${b.value_amount ? ` ($${b.value_amount}${b.value_unit ? '/' + b.value_unit : ''}${b.frequency ? '/' + b.frequency : ''})` : ''}: ${b.description ?? ''}`).join('\n')
  const earn = (earnRes.data ?? []).map((e) =>
    `- ${e.multiplier}x ${e.category}${e.booking_channel ? ` (${e.booking_channel})` : ''}${e.cap_amount_usd ? ` [cap $${e.cap_amount_usd.toLocaleString()}/${e.cap_period} - THIS CATEGORY ONLY]` : ''}${e.notes ? ` :: ${e.notes}` : ''}`).join('\n')
  const w = wbRes.data
  const wb = w ? `${w.bonus_amount} ${w.bonus_currency} after $${w.spend_required_usd} in ${w.spend_window_days ? w.spend_window_days + ' days' : w.spend_window_months + ' months'}. ${w.extras ?? ''}${(w.tiered_bonuses && w.tiered_bonuses.length) ? ' Tiers: ' + JSON.stringify(w.tiered_bonuses) : ''}` : '(none)'
  const prog = progRes.data
  const transfers = prog && prog.transfer_partners_outbound?.length
    ? `Currency "${prog.name}" transfers to: ${prog.transfer_partners_outbound.map((p) => `${p.from_slug} ${p.ratio}${p.tiers ? ' (card-tiered)' : ''}`).join(', ')}`
    : '(no transfer partners / not a transferable-currency card)'
  return `Name: ${card.name}
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

const PROMPT = (data, gtk) => `Fact-check a credit-card "Good to know" callout against the card's COMPLETE structured record below (the only source of truth). The record includes full benefit descriptions, earn-rate notes, transfer partners, and fee fields - so if a claim is supported anywhere in it, it is NOT an error.

Flag a bullet ONLY when it genuinely CONFLICTS with the record: a wrong number/fee/ratio, an invented restriction the record contradicts, a benefit the record shows the card does NOT have, or two earn categories described as sharing one cap when the record shows separate per-category caps ("THIS CATEGORY ONLY"). Do NOT flag: style/voice, reasonable context, or anything supported anywhere in the record (including notes, transfer partners, and the fee fields). If a fact simply isn't in the record but isn't contradicted by it, do NOT flag it.

CARD RECORD:
${data}

GOOD_TO_KNOW:
${gtk}

Return ONLY compact JSON: {"issues":[{"claim":"<short quote>","problem":"<the specific conflict with the record>","severity":"high|med|low"}]}. Empty array if everything checks out.`

let q = sb.from('credit_cards').select('id, slug, name, annual_fee_usd, foreign_transaction_fee_pct, authorized_user_fee_usd, currency_program_id, good_to_know').eq('status', 'active').not('good_to_know', 'is', null).order('slug')
if (onlySlug) q = sb.from('credit_cards').select('id, slug, name, annual_fee_usd, foreign_transaction_fee_pct, authorized_user_fee_usd, currency_program_id, good_to_know').eq('slug', onlySlug)
const { data: cards } = await q

const flagged = []
let done = 0
for (const card of cards ?? []) {
  if (!card.good_to_know) continue
  try {
    const record = await fullRecord(card)
    const resp = await anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: PROMPT(record, card.good_to_know) }] })
    const txt = resp.content.find((x) => x.type === 'text')?.text ?? '{}'
    const json = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1))
    if (json.issues?.length) flagged.push({ slug: card.slug, issues: json.issues })
  } catch (e) {
    flagged.push({ slug: card.slug, issues: [{ claim: '(audit error)', problem: String(e.message).slice(0, 100), severity: 'low' }] })
  }
  done++
  await new Promise((r) => setTimeout(r, 400))
}
console.log(`Audited ${done} cards against COMPLETE records. ${flagged.length} have genuine flags.\n`)
for (const f of flagged) {
  console.log(`\n### ${f.slug}`)
  for (const i of f.issues) console.log(`  [${i.severity}] "${(i.claim || '').slice(0, 70)}" -> ${i.problem}`)
}
