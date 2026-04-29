/**
 * Phase 3 — structured earning-rules schema for credit_cards.
 *
 * Replaces (well, supplements) the prose-only earning info that lived in
 * intro / good_to_know with machine-checkable structure. The fact-checker
 * grounds claims like "card earns 4x at dining" against these rules
 * directly instead of pattern-matching prose.
 *
 * Schema is intentionally narrow at first: just enough to express the
 * common card patterns we actually have (flat multipliers, specific
 * categories, top-N quarterly rotators). Conditional logic that doesn't
 * fit cleanly stays in `conditions` as free text — mark those for
 * structuring later as patterns emerge.
 *
 * Stored as JSONB on credit_cards.earning_rules. Writer + fact-checker
 * both consume this through cardSourceText.ts → it renders the rules
 * into clean human-readable T1 source text.
 */

/** How a rule's multiplier applies — distinguishes flat vs rotator. */
export type EarningRuleAppliesTo =
  /** Earns the multiplier on every purchase regardless of category. */
  | 'all_purchases'
  /** Earns the multiplier on specific named categories at all times. */
  | 'specific_categories'
  /**
   * Earns the multiplier on the top N spending categories within a
   * recurring period (e.g. "top 3 of 8 each quarter"). Requires `top_n`,
   * `period`, and `category_keys` (the eligible pool).
   */
  | 'top_n_categories_periodic'

export type EarningPeriod = 'monthly' | 'quarterly' | 'annual'

export interface EarningRule {
  /** Human-readable label rendered in source text and admin. */
  label: string
  /** Multiplier in points-per-dollar. Use 1 for base earn. */
  multiplier: number
  applies_to: EarningRuleAppliesTo
  /**
   * For `specific_categories` and `top_n_categories_periodic` — the
   * categories the rule applies to. Should match keys from the card's
   * `eligible_categories` list when relevant.
   */
  category_keys?: string[]
  /** For `top_n_categories_periodic` — how many top categories earn the bonus. */
  top_n?: number
  /** For `top_n_categories_periodic` — the rotation period. */
  period?: EarningPeriod
  /**
   * Free-text qualifiers that don't fit cleanly into structure today —
   * caps, exclusions, posting timelines. Surfaced verbatim in source
   * text so the writer + fact-checker see them. Mark for structuring
   * once a pattern repeats across 3+ cards.
   */
  conditions?: string
}

/** Type guard for runtime parsing of credit_cards.earning_rules JSONB. */
export function parseEarningRules(raw: unknown): EarningRule[] {
  if (!Array.isArray(raw)) return []
  const out: EarningRule[] = []
  for (const entry of raw) {
    const e = entry as Partial<EarningRule>
    if (typeof e?.label !== 'string' || typeof e.multiplier !== 'number') continue
    if (
      e.applies_to !== 'all_purchases' &&
      e.applies_to !== 'specific_categories' &&
      e.applies_to !== 'top_n_categories_periodic'
    ) continue
    out.push({
      label: e.label,
      multiplier: e.multiplier,
      applies_to: e.applies_to,
      category_keys: Array.isArray(e.category_keys)
        ? e.category_keys.filter((k): k is string => typeof k === 'string')
        : undefined,
      top_n: typeof e.top_n === 'number' ? e.top_n : undefined,
      period:
        e.period === 'monthly' || e.period === 'quarterly' || e.period === 'annual'
          ? e.period
          : undefined,
      conditions: typeof e.conditions === 'string' ? e.conditions : undefined,
    })
  }
  return out
}

/**
 * Render a list of earning rules into a clean human-readable block for
 * source text. Designed to be unambiguous for the LLM fact-checker —
 * preserves all qualifiers (top_n, period, conditions) that are easy
 * for paraphrase passes to lose.
 */
export function earningRulesToSourceText(rules: EarningRule[]): string {
  if (rules.length === 0) return ''
  const lines: string[] = ['Earning rules:']
  for (const r of rules) {
    let line = `- ${r.multiplier}x — ${r.label}`
    switch (r.applies_to) {
      case 'all_purchases':
        line += ' (all purchases, no category restriction)'
        break
      case 'specific_categories':
        if (r.category_keys && r.category_keys.length > 0) {
          line += ` (categories: ${r.category_keys.join(', ')})`
        }
        break
      case 'top_n_categories_periodic':
        if (r.top_n && r.period && r.category_keys && r.category_keys.length > 0) {
          line += ` (top ${r.top_n} of ${r.category_keys.length} ${r.period} categories: ${r.category_keys.join(', ')})`
        }
        break
    }
    if (r.conditions) line += ` — ${r.conditions}`
    lines.push(line)
  }
  return lines.join('\n')
}

/** Render the eligible-categories list with the exhaustive flag clearly stated. */
export function eligibleCategoriesToSourceText(
  categories: string[] | null,
  exhaustive: boolean | null
): string {
  if (!categories || categories.length === 0) return ''
  const header = exhaustive
    ? `Eligible categories (COMPLETE list — these are ALL the categories this card can earn bonus on; any category NOT in this list earns base 1x ONLY):`
    : `Eligible categories (PARTIAL list — additional categories may exist; do NOT assert absence of categories not listed):`
  return `${header}\n- ${categories.join('\n- ')}`
}
