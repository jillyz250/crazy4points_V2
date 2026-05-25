/**
 * Scan editorial text columns for hardcoded counts that probably should
 * be tokens.
 *
 * Looks at programs.intro, sweet_spots, quirks, and marquee_pitch for
 * patterns like "18 airline transfer partners" or "3 hotel partners"
 * — drift-prone numbers we'd rather have resolved at render time via
 * expandIntroTokens.ts.
 *
 * Pure detection — does not modify anything. Used by /admin/tokens to
 * surface migration candidates and by the dashboard stat card to nudge
 * about untokenized copy.
 *
 * False positives are fine: editor reviews the list and decides which
 * are real candidates. We err on the side of flagging too much rather
 * than too little.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

const HARDCODED_COUNT_RE =
  /(\d{1,3})\s+(airline|hotel|transfer\s+partner|partner|sweet[\s-]?spot|propert(?:y|ies)|card|tier|alliance|loyalty\s+program|member)s?\b/gi

export type HardcodedHit = {
  slug: string
  name: string
  field: 'intro' | 'sweet_spots' | 'quirks' | 'marquee_pitch'
  /** The matched fragment, e.g. "18 airline" */
  match: string
  /** The full sentence containing the hit, for editorial context. */
  context: string
}

type Row = {
  slug: string
  name: string
  intro: string | null
  sweet_spots: string | null
  quirks: string | null
  marquee_pitch: string | null
}

function extractSentence(text: string, matchStart: number, matchLen: number): string {
  // Find sentence boundaries — nearest `.`, `!`, `?`, or paragraph break
  // before and after the match.
  const sentenceEnders = /[.!?\n]/g
  let before = 0
  let after = text.length
  let m: RegExpExecArray | null
  sentenceEnders.lastIndex = 0
  while ((m = sentenceEnders.exec(text)) !== null) {
    if (m.index < matchStart) before = m.index + 1
    else if (m.index >= matchStart + matchLen) {
      after = m.index + 1
      break
    }
  }
  return text.slice(before, after).trim()
}

function scanField(
  slug: string,
  name: string,
  field: HardcodedHit['field'],
  text: string | null,
): HardcodedHit[] {
  if (!text) return []
  const hits: HardcodedHit[] = []
  HARDCODED_COUNT_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = HARDCODED_COUNT_RE.exec(text)) !== null) {
    hits.push({
      slug,
      name,
      field,
      match: m[0],
      context: extractSentence(text, m.index, m[0].length),
    })
  }
  return hits
}

export async function auditHardcodedCounts(supabase: SupabaseClient): Promise<HardcodedHit[]> {
  const { data } = await supabase
    .from('programs')
    .select('slug, name, intro, sweet_spots, quirks, marquee_pitch')
    .eq('is_active', true)
    .order('name', { ascending: true })

  const allHits: HardcodedHit[] = []
  for (const row of (data ?? []) as Row[]) {
    allHits.push(...scanField(row.slug, row.name, 'intro', row.intro))
    allHits.push(...scanField(row.slug, row.name, 'sweet_spots', row.sweet_spots))
    allHits.push(...scanField(row.slug, row.name, 'quirks', row.quirks))
    allHits.push(...scanField(row.slug, row.name, 'marquee_pitch', row.marquee_pitch))
  }
  return allHits
}

/**
 * Just the count — used by the dashboard stat card to avoid pulling
 * the full hit list when we only need a number.
 */
export async function countHardcodedHits(supabase: SupabaseClient): Promise<number> {
  const hits = await auditHardcodedCounts(supabase)
  return hits.length
}

/**
 * Resolve current token values for a given slug, mirroring the logic
 * inside expandIntroTokens.ts but exposed as a structured object for
 * the admin preview UI.
 */
export type ResolvedTokens = {
  airline_count: number
  hotel_count: number
  partner_count: number
}

export async function resolveTokensForSlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<ResolvedTokens | null> {
  const { data: prog } = await supabase
    .from('programs')
    .select('slug, transfer_partners_outbound')
    .eq('slug', slug)
    .maybeSingle()
  if (!prog) return null

  const partners = ((prog.transfer_partners_outbound ?? []) as Array<{ from_slug: string }>).map(
    (p) => p.from_slug,
  )
  if (partners.length === 0) {
    return { airline_count: 0, hotel_count: 0, partner_count: 0 }
  }

  const { data: typeRows } = await supabase
    .from('programs')
    .select('slug, type')
    .in('slug', partners)

  let airline = 0
  let hotel = 0
  for (const r of (typeRows ?? []) as Array<{ slug: string; type: string }>) {
    if (r.type === 'airline' || r.type === 'loyalty_program') airline += 1
    else if (r.type === 'hotel') hotel += 1
  }
  return { airline_count: airline, hotel_count: hotel, partner_count: partners.length }
}

/**
 * Find every program intro / sweet_spots / quirks / marquee_pitch that
 * already uses a token. Used by /admin/tokens to show "live examples"
 * — i.e., where tokens are working today.
 */
export type TokenUsage = {
  slug: string
  name: string
  field: 'intro' | 'sweet_spots' | 'quirks' | 'marquee_pitch'
  tokens: string[]
}

const TOKEN_RE = /\{([a-z0-9_-]+)_(airline|hotel|partner)_count\}/gi

export async function findTokenUsages(supabase: SupabaseClient): Promise<TokenUsage[]> {
  const { data } = await supabase
    .from('programs')
    .select('slug, name, intro, sweet_spots, quirks, marquee_pitch')
    .eq('is_active', true)

  const usages: TokenUsage[] = []
  for (const row of (data ?? []) as Row[]) {
    for (const field of ['intro', 'sweet_spots', 'quirks', 'marquee_pitch'] as const) {
      const text = row[field]
      if (!text) continue
      const matches = [...text.matchAll(TOKEN_RE)].map((m) => m[0])
      if (matches.length > 0) {
        usages.push({ slug: row.slug, name: row.name, field, tokens: [...new Set(matches)] })
      }
    }
  }
  return usages
}
