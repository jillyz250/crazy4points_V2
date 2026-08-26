/**
 * verifyClaim — the Fact-Checker (Accuracy Agent, Phase 1).
 *
 * Server-side only. Given a factual claim (especially a CORRECTION or a NEGATIVE
 * the assistant is about to assert), this checks it against (1) our own database
 * and (2) — when needed — the official source, and returns a structured verdict.
 *
 * The rule it enforces: never assert a correction/negative from memory. Call this
 * first. See memory: feedback_verify_before_correcting +
 * feedback_factcheck_reconcile_page_vs_official.
 *
 * v1 scope: entity extraction -> fetch OUR data -> LLM comparison -> structured
 * verdict, with a reconciliation slot for the official source (Phase 2 wires the
 * source-canonicalization layer that makes the official half automatic). Every
 * call is logged to the claim_verifications ledger when that table exists.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logUsage } from './logUsage'
import { fetchFirecrawl, fetchFirecrawlInteractive } from './firecrawl'

// Cheap model for entity extraction; the accuracy-critical judgment (compare +
// reconcile) uses Sonnet, matching the existing verifyAlertDraft verifier.
const MODEL_EXTRACT = 'claude-haiku-4-5-20251001'
const MODEL_VERIFY = 'claude-sonnet-4-6'

export type Verdict = 'supported' | 'refuted' | 'unverified'
export type Confidence = 'high' | 'medium' | 'low'

export interface VerifyClaimResult {
  claim: string
  verdict: Verdict
  confidence: Confidence
  /** What our own page/DB actually says (the evidence behind the verdict). */
  our_page: string
  /** What the official source says, when we checked it. */
  official: string | null
  /** The official URL we checked against, if any. */
  official_source_url: string | null
  /**
   * Reconciliation of our page vs the official source (guarantee G-6, G-3):
   * match | conflict | gap | unchecked (official attempted, couldn't confirm) |
   * skipped (official check not run — e.g. no source URL, or checkOfficial:false).
   */
  reconciliation: 'match' | 'conflict' | 'gap' | 'unchecked' | 'skipped'
  /** true when our page and the official source disagree OR our page is missing a fact official has. */
  discrepancy: boolean
  /** If refuted/conflict: the accurate statement to use instead. */
  correction: string | null
  /** If gap: the fact the official source has that our page is MISSING and should add. */
  proposed_addition: string | null
  /** Where the verdict came from. */
  source: { type: 'db' | 'official' | 'none'; ref: string }
  /** Entities we matched in our DB, for transparency. */
  matched: { programs: string[]; cards: string[] }
}

interface Extraction {
  search_terms: string[]
  entity_type: 'program' | 'card' | 'both' | 'unknown'
  fact_type: string
  polarity: 'affirm' | 'negate'
}

async function callClaude(client: Anthropic, prompt: string, label: string, model: string, maxTokens = 700): Promise<string> {
  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature: 0, // deterministic — a fact-checker must not vary run to run
    messages: [{ role: 'user', content: prompt }],
  })
  await logUsage(message, label)
  const block = message.content[0]
  return block.type === 'text' ? block.text.trim() : ''
}

function parseJson<T>(raw: string): T | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        return JSON.parse(m[0]) as T
      } catch {
        return null
      }
    }
    return null
  }
}

/** Compact a program row so the LLM sees the load-bearing facts, not a giant JSON blob. */
function compactProgram(p: Record<string, unknown>) {
  const trim = (arr: unknown): unknown =>
    Array.isArray(arr)
      ? arr.map((r: Record<string, unknown>) => ({
          from_slug: r.from_slug,
          ratio: r.ratio,
          tiers: r.tiers,
          notes: typeof r.notes === 'string' ? (r.notes as string).slice(0, 160) : r.notes,
        }))
      : arr
  return {
    name: p.name,
    slug: p.slug,
    intro: typeof p.intro === 'string' ? (p.intro as string).slice(0, 500) : null,
    transfer_partners_outbound: trim(p.transfer_partners_outbound),
    transfer_partners_inbound: trim(p.transfer_partners),
    lounge_access: typeof p.lounge_access === 'string' ? (p.lounge_access as string).slice(0, 900) : null,
  }
}

function compactCard(c: Record<string, unknown>) {
  return {
    name: c.name,
    slug: c.slug,
    annual_fee_usd: c.annual_fee_usd,
    intro: typeof c.intro === 'string' ? (c.intro as string).slice(0, 500) : null,
    good_to_know: typeof c.good_to_know === 'string' ? (c.good_to_know as string).slice(0, 1400) : null,
  }
}

export async function verifyClaim(
  supabase: SupabaseClient,
  claim: string,
  opts: { createdBy?: string; checkOfficial?: boolean } = {},
): Promise<VerifyClaimResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const base: VerifyClaimResult = {
    claim,
    verdict: 'unverified',
    confidence: 'low',
    our_page: '',
    official: null,
    official_source_url: null,
    reconciliation: 'skipped',
    discrepancy: false,
    correction: null,
    proposed_addition: null,
    source: { type: 'none', ref: '' },
    matched: { programs: [], cards: [] },
  }
  if (!apiKey) {
    base.our_page = 'ANTHROPIC_API_KEY missing — cannot run verification.'
    return base
  }
  const client = new Anthropic({ apiKey })

  // ---- Step 1: extract the entity + fact type -----------------------------
  const extractRaw = await callClaude(
    client,
    [
      'You extract the subject of a points-and-miles factual claim so we can look it up in our database.',
      'Return ONLY JSON: {"search_terms": string[], "entity_type": "program"|"card"|"both"|"unknown", "fact_type": string, "polarity": "affirm"|"negate"}.',
      'search_terms: the loyalty program(s) and/or credit card(s) named or implied, as short lookup strings (e.g. "Citi ThankYou", "Chase", "JetBlue", "Southwest"). For a transfer claim like "Citi transfers to American", the source program ("Citi") is the primary term.',
      'fact_type: one of transfer_ratio, transfer_partner, signup_bonus, benefit, lounge_access, card_exists, deadline, other.',
      'polarity: "negate" if the claim asserts something does NOT exist / does NOT happen / is missing; else "affirm".',
      '',
      `CLAIM: ${claim}`,
    ].join('\n'),
    'verifyClaim.extract',
    MODEL_EXTRACT,
    300,
  )
  const ex = parseJson<Extraction>(extractRaw) ?? {
    search_terms: [claim.slice(0, 40)],
    entity_type: 'unknown',
    fact_type: 'other',
    polarity: 'affirm',
  }

  // ---- Step 2: fetch OUR data for the matched entities --------------------
  const terms = (ex.search_terms?.length ? ex.search_terms : [claim.slice(0, 40)]).slice(0, 5)
  const progOr = terms.flatMap((t) => [`name.ilike.%${t}%`, `slug.ilike.%${t}%`]).join(',')
  const cardOr = terms.flatMap((t) => [`name.ilike.%${t}%`, `slug.ilike.%${t}%`]).join(',')

  const [{ data: progs, error: progErr }, { data: cards, error: cardErr }] = await Promise.all([
    supabase.from('programs').select('name,slug,intro,transfer_partners_outbound,transfer_partners,lounge_access,partner_chart_url').or(progOr).limit(4),
    supabase.from('credit_cards').select('name,slug,intro,good_to_know,annual_fee_usd,official_url').or(cardOr).limit(6),
  ])
  // Never let a bad column silently null the lookup (the Supabase silent-error trap).
  if (progErr) console.error('[verifyClaim] programs query error:', progErr.message)
  if (cardErr) console.error('[verifyClaim] credit_cards query error:', cardErr.message)

  const matchedPrograms = (progs ?? []).map((p) => compactProgram(p as Record<string, unknown>))
  const matchedCards = (cards ?? []).map((c) => compactCard(c as Record<string, unknown>))
  base.matched = {
    programs: (progs ?? []).map((p: Record<string, unknown>) => p.slug as string),
    cards: (cards ?? []).map((c: Record<string, unknown>) => c.slug as string),
  }

  if (matchedPrograms.length === 0 && matchedCards.length === 0) {
    base.our_page = `No matching program or card found in our DB for: ${terms.join(', ')}.`
    base.verdict = 'unverified'
    await persist(supabase, base, ex, opts.createdBy)
    return base
  }

  // ---- Step 3: compare the claim against OUR data -------------------------
  const verifyRaw = await callClaude(
    client,
    [
      'You are a strict fact-checker for a points-and-miles site. Compare the CLAIM against OUR DATABASE below.',
      'Rules: judge ONLY from the data provided. Do not use outside knowledge. If the data does not address the claim, verdict is "unverified".',
      'A claim that asserts a NEGATIVE ("X does not transfer to Y", "there is no Z card") is REFUTED if the data shows the thing DOES exist / DOES happen.',
      '',
      'Return ONLY JSON: {"verdict": "supported"|"refuted"|"unverified", "confidence": "high"|"medium"|"low", "our_page": "<one sentence: what our data actually says about this claim>", "correction": "<if refuted, the accurate statement; else null>"}.',
      '',
      `CLAIM: ${claim}`,
      '',
      'OUR DATABASE:',
      JSON.stringify({ programs: matchedPrograms, cards: matchedCards }),
    ].join('\n'),
    'verifyClaim.verify',
    MODEL_VERIFY,
    600,
  )
  const v = parseJson<{ verdict: Verdict; confidence: Confidence; our_page: string; correction: string | null }>(verifyRaw)
  if (v) {
    base.verdict = v.verdict
    base.confidence = v.confidence
    base.our_page = v.our_page
    base.correction = v.correction
    base.source = { type: 'db', ref: [...base.matched.programs, ...base.matched.cards].join(', ') }
  } else {
    base.our_page = 'Verification model returned an unparseable result.'
  }

  // ---- Step 4: reconcile OUR PAGE against the OFFICIAL source -------------
  // (match / conflict / gap / unchecked). A conflict -> fix our page; a gap ->
  // add the missing fact to our page; unchecked -> a manual-check finding.
  if (opts.checkOfficial !== false) {
    const prog = (progs?.[0] ?? undefined) as Record<string, unknown> | undefined
    const card = (cards?.[0] ?? undefined) as Record<string, unknown> | undefined

    // 1) Prefer the CORRECT page from the source-canonicalization registry.
    let officialUrl: string | null = null
    let fetchMethod = 'firecrawl'
    const entitySlugs = [...base.matched.programs, ...base.matched.cards]
    if (entitySlugs.length) {
      const { data: srcs } = await supabase
        .from('official_sources')
        .select('canonical_url, fetch_method, fact_type')
        .in('entity_slug', entitySlugs)
      if (srcs && srcs.length) {
        const chosen = srcs.find((s) => s.fact_type === ex.fact_type) ?? srcs.find((s) => !s.fact_type) ?? srcs[0]
        officialUrl = chosen.canonical_url as string
        fetchMethod = (chosen.fetch_method as string) ?? 'firecrawl'
      }
    }
    // 2) Fallback to the URL on the program/card row (programs: partner_chart_url; cards: official_url).
    if (!officialUrl) {
      officialUrl = (prog?.partner_chart_url as string | null) || (card?.official_url as string | null) || null
    }

    if (officialUrl) {
      base.official_source_url = officialUrl
      const fc =
        fetchMethod === 'browser'
          ? await fetchFirecrawlInteractive(officialUrl, { maxChars: 6000 })
          : await fetchFirecrawl(officialUrl, { maxChars: 6000 })
      if (!fc.ok || !fc.markdown) {
        base.reconciliation = 'unchecked'
        const reason = fc.ok ? 'empty' : (fc.reason ?? 'error')
        base.official = `Could not reach the official source (${reason}). Needs a manual check.`
      } else {
        const recRaw = await callClaude(
          client,
          [
            'Reconcile a points-and-miles claim across two sources: OUR PAGE and the OFFICIAL source below.',
            'Return ONLY JSON: {"specific_target":"<the exact partner/card/entity/value the claim hinges on, e.g. \\"American Airlines\\" or \\"5:3\\">","official_confirms_specific":boolean,"reconciliation":"match"|"conflict"|"gap"|"unchecked","official_evidence":"<one sentence: what the official source says about this>","discrepancy":boolean,"correction":"<if conflict: how to fix our page; else null>","proposed_addition":"<if gap: the fact official states that our page is MISSING and should add; else null>"}.',
            'official_confirms_specific = true ONLY if the official text explicitly confirms that exact specific_target. If the claim names a partner and the official partner list does NOT include it, official_confirms_specific is false.',
            'match = our page agrees with official (discrepancy=false). conflict = they disagree (discrepancy=true). gap = official states a relevant fact our page is missing (discrepancy=true). unchecked = the official text does not address the claim (discrepancy=false).',
            'CRITICAL: if the claim names a SPECIFIC partner, card, ratio, or entity, the official source must confirm THAT specific thing to be a match. Do NOT return match on a general statement alone (e.g. "airlines transfer at 1:1") when the specific partner named in the claim is absent from the official source. If our page asserts a specific partner/fact the official source does not list, that is a conflict (official appears to contradict) or unchecked (official simply does not cover it) — never match.',
            'Judge only from the official text provided. Do not use outside knowledge.',
            '',
            `CLAIM: ${claim}`,
            `OUR PAGE SAYS: ${base.our_page}`,
            '',
            `OFFICIAL SOURCE (${officialUrl}):`,
            fc.markdown,
          ].join('\n'),
          'verifyClaim.reconcile',
          MODEL_VERIFY,
          600,
        )
        const rec = parseJson<{
          specific_target: string | null
          official_confirms_specific: boolean
          reconciliation: 'match' | 'conflict' | 'gap' | 'unchecked'
          official_evidence: string
          discrepancy: boolean
          correction: string | null
          proposed_addition: string | null
        }>(recRaw)
        if (rec) {
          base.reconciliation = rec.reconciliation
          base.official = rec.official_evidence
          base.discrepancy = !!rec.discrepancy
          if (rec.correction) base.correction = rec.correction
          base.proposed_addition = rec.proposed_addition
          // Enforce in CODE: a "match" is invalid if the official source did not
          // confirm the specific partner/entity/value the claim hinges on. The
          // model over-matches on a general ratio while the named partner is
          // absent — downgrade to unchecked so it surfaces for a manual look.
          if (base.reconciliation === 'match' && rec.official_confirms_specific === false) {
            base.reconciliation = 'unchecked'
            base.official = `Official source did not confirm "${rec.specific_target ?? 'the specific claim'}" (it is not listed / not addressed). ${rec.official_evidence} Needs a manual check.`
          }
          if (base.reconciliation === 'conflict' || base.reconciliation === 'gap') {
            base.source = { type: 'official', ref: officialUrl }
          }
        }
      }
    }
  }

  await persist(supabase, base, ex, opts.createdBy)
  return base
}

/** Log the verification to the ledger. No-ops gracefully if the table isn't there yet. */
async function persist(
  supabase: SupabaseClient,
  r: VerifyClaimResult,
  ex: Extraction,
  createdBy?: string,
): Promise<void> {
  try {
    await supabase.from('claim_verifications').insert({
      claim_text: r.claim,
      entity_type: ex.entity_type,
      fact_type: ex.fact_type,
      verdict: r.verdict,
      confidence: r.confidence,
      our_page_evidence: r.our_page,
      official_evidence: r.official,
      official_source_url: r.official_source_url,
      reconciliation: r.reconciliation,
      discrepancy: r.discrepancy,
      correction: r.correction,
      proposed_addition: r.proposed_addition,
      source_type: r.source.type,
      source_ref: r.source.ref,
      created_by: createdBy ?? 'assistant',
    })
  } catch {
    // ledger table not created yet (Phase 1 migration) — safe to skip
  }
}
