/**
 * Phase 4 — per-slug grounding tracking.
 *
 * The fact-checker takes a single concatenated `source_text` blob (alert
 * prose + intel raw_text + program pages + card pages) and returns claims
 * with a `source_excerpt` quoted from that blob. Up to now the UI knew the
 * AGGREGATE count of claims grounded against T1 ("3 of your pages
 * contributed"), but couldn't tell WHICH page contributed which claim.
 *
 * This module factors the source-text builder into LABELED SEGMENTS, each
 * with a `source_slug` like `program:world-of-hyatt` or `card:chase-world-
 * of-hyatt`. After Sonnet returns claims, we match each `source_excerpt`
 * back to the segment whose text contains it, and stamp the claim with
 * the segment's slug. The SourcesUsed pills then carry per-slug counts
 * so the editor can see "✓ /programs/world-of-hyatt: 5 claims" and
 * "✓ /cards/chase-world-of-hyatt-business: 2 claims".
 *
 * Why string-containment matching: the fact-checker is instructed to
 * fill `source_excerpt` with a verbatim quote from `source_text`. The
 * quote is short (<200 chars) so simple `includes()` matching is reliable
 * enough — segments are big enough that an excerpt unambiguously falls
 * inside one. Falls back to null when no segment matches (e.g. when the
 * model paraphrases instead of quoting, or when the excerpt straddles a
 * boundary).
 */

import type { Program } from '@/utils/supabase/queries'
import type { CardSource } from './cardSourceText'
import { programsToSourceText } from './programSourceText'
import { cardsToSourceText, cardToSourceText } from './cardSourceText'

type ProgramSourceSubset = Pick<
  Program,
  | 'name'
  | 'slug'
  | 'type'
  | 'intro'
  | 'award_chart'
  | 'sweet_spots'
  | 'how_to_spend'
  | 'quirks'
  | 'lounge_access'
  | 'transfer_partners'
  | 'tier_benefits'
  | 'alliance'
  | 'hubs'
  | 'description'
>

/** A labeled chunk of the merged source_text — used to match excerpts back to slugs. */
export interface SourceSegment {
  /** Stable identifier for this segment, used as VerifyClaim.source_slug. */
  source_slug: string
  /** Human label for logs / debug. */
  label: string
  /** The verbatim text that landed in source_text for this segment. */
  text: string
}

export interface SourceTextBuildInput {
  alert?: { id: string; title: string | null; summary: string | null; description: string | null } | null
  intel?: { id: string; raw_text: string | null } | null
  programs?: ProgramSourceSubset[]
  cards?: CardSource[]
}

export interface SourceTextBuildResult {
  /** Final concatenated source_text exactly as the fact-checker receives it. */
  text: string
  /** One segment per contributing surface — used for per-slug matching. */
  segments: SourceSegment[]
}

const SECTION_PROGRAMS_HEADER = '═══ OFFICIAL PROGRAM PAGE CONTENT ═══'
const SECTION_CARDS_HEADER = '═══ OFFICIAL CARD PAGE CONTENT ═══'

/**
 * Build the source_text the same way factCheckArticleAction always has —
 * but emit a parallel SourceSegment array so we can match excerpts back
 * to specific slugs.
 *
 * Critically: the JOINED text MUST be byte-identical to what the previous
 * inline construction produced, so swapping in this builder is a pure
 * refactor on the verifier side. Verified by the existing prompts +
 * source_excerpt matching against this exact format.
 */
export function buildSourceTextWithSegments(
  input: SourceTextBuildInput
): SourceTextBuildResult {
  const segments: SourceSegment[] = []
  const parts: string[] = []

  if (input.alert) {
    const alertText = [input.alert.title, input.alert.summary, input.alert.description]
      .filter(Boolean)
      .join('\n\n')
    if (alertText) {
      parts.push(alertText)
      segments.push({
        source_slug: `alert:${input.alert.id}`,
        label: input.alert.title ?? 'source alert',
        text: alertText,
      })
    }
  }

  if (input.intel?.raw_text) {
    parts.push(input.intel.raw_text)
    segments.push({
      source_slug: `intel:${input.intel.id}`,
      label: 'source intel raw text',
      text: input.intel.raw_text,
    })
  }

  if (input.programs && input.programs.length > 0) {
    const programsBlock = `${SECTION_PROGRAMS_HEADER}\n\n${programsToSourceText(input.programs)}`
    parts.push(programsBlock)
    // Per-program segments — match each program's rendered chunk so
    // an excerpt from "Park Hyatt Tokyo" lands on the world-of-hyatt slug.
    // programsToSourceText joins individual programs with the same
    // boundary cardsToSourceText uses, so we re-derive the per-program
    // text by rendering each program in isolation.
    for (const p of input.programs) {
      const single = programsToSourceText([p])
      segments.push({
        source_slug: `program:${p.slug}`,
        label: p.name ?? p.slug,
        text: single,
      })
    }
  }

  if (input.cards && input.cards.length > 0) {
    const cardsBlock = `${SECTION_CARDS_HEADER}\n\n${cardsToSourceText(input.cards)}`
    parts.push(cardsBlock)
    for (const c of input.cards) {
      // Render each card in isolation so its block can be matched.
      const single = cardToSourceText(c)
      segments.push({
        source_slug: `card:${c.slug}`,
        label: c.name ?? c.slug,
        text: single,
      })
    }
  }

  const text = parts.join('\n\n').trim()
  return { text, segments }
}

/**
 * Find which segment contains `excerpt`. Uses simple substring matching
 * because the fact-checker quotes verbatim. Returns the FIRST matching
 * segment's slug — segments are processed in append order so program/card
 * matches preferred over alert/intel only when the excerpt is unique to
 * that surface (which is typical because card/program prose is much more
 * specific than alert prose).
 *
 * Returns null when nothing matches — paraphrased excerpts, web-only
 * grounding, or empty/very short excerpts where the noise floor is too
 * high. Caller treats null as "we don't know which slug" and renders
 * the claim without a per-slug pill bump.
 */
export function findSegmentForExcerpt(
  excerpt: string | null | undefined,
  segments: SourceSegment[]
): string | null {
  if (!excerpt) return null
  const trimmed = excerpt.trim()
  // Excerpts under ~12 chars are too noisy to disambiguate (numbers,
  // single tokens, dates). Skip rather than guess.
  if (trimmed.length < 12) return null
  for (const seg of segments) {
    if (seg.text.includes(trimmed)) {
      return seg.source_slug
    }
  }
  // Fallback: try a relaxed match on the first ~80 chars, in case the
  // model edited whitespace or punctuation slightly.
  const relaxed = trimmed.slice(0, 80).replace(/\s+/g, ' ')
  if (relaxed.length < 24) return null
  for (const seg of segments) {
    const segNormalized = seg.text.replace(/\s+/g, ' ')
    if (segNormalized.includes(relaxed)) {
      return seg.source_slug
    }
  }
  return null
}
