/**
 * FactOriginChip — provenance of the underlying CLAIM (distinct from
 * source confidence).
 *
 * Anti-hallucination chip: distinguishes "Marriott press release" from
 * "Grok said it summarizing X posts." AI-discovered-only renders in red
 * with deliberately distinct visual weight so the editor never confuses
 * an AI-surfaced rumor with verified issuer announcement.
 *
 * See plan v9 "Pervasive labeling system / Source provenance" + "Hidden
 * Risk You Didn't Mention — AI hallucination laundering" callout.
 */
import { Chip, type ChipColor } from './Chip'

export type FactOrigin =
  | 'official'
  | 'secondary'
  | 'social-rumor'
  | 'inferred'
  | 'ai-discovered-only'

const COLOR: Record<FactOrigin, ChipColor> = {
  'official':           'green',
  'secondary':          'blue',
  'social-rumor':       'amber',
  'inferred':           'purple', // distinct from social-rumor (was amber, too visually similar)
  'ai-discovered-only': 'red',
}

const LABEL: Record<FactOrigin, string> = {
  'official':           'Official source',
  'secondary':          'Secondary reporting',
  'social-rumor':       'Social rumor',
  'inferred':           'Inferred',
  'ai-discovered-only': 'AI-discovered only',
}

const TITLE: Record<FactOrigin, string> = {
  'official':           'Direct from issuer (press release, official policy page)',
  'secondary':          'Credible blog or third-party reporting (TPG, OMAAT, Frequent Miler, etc.)',
  'social-rumor':       'Reddit / X social claim — not yet corroborated by official or secondary source',
  'inferred':           'Analyst inference from indirect signals — Grok summarizing trends, etc.',
  'ai-discovered-only': 'AI surfaced this without a human-verifiable upstream source. Treat with caution.',
}

export function FactOriginChip({ origin, size }: { origin: FactOrigin; size?: 'sm' | 'md' }) {
  return <Chip color={COLOR[origin]} label={LABEL[origin]} size={size} title={TITLE[origin]} />
}
