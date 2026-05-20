/**
 * QAChip — per-gate result for fact-check, voice check, originality check, T&Cs.
 *
 * Result color:
 *   passed → green
 *   partial → amber
 *   failed → red
 *   missing → red (T&Cs only, equivalent to "not verified")
 *   waived → amber (T&Cs only, equivalent to "skipped with reason")
 */
import { Chip, type ChipColor } from './Chip'

export type QAKind = 'fact-check' | 'voice' | 'originality' | 'tcs'
export type QAResult = 'passed' | 'partial' | 'failed' | 'missing' | 'waived'

const COLOR: Record<QAResult, ChipColor> = {
  passed:  'green',
  partial: 'amber',
  failed:  'red',
  missing: 'red',
  waived:  'amber',
}

const KIND_LABEL: Record<QAKind, string> = {
  'fact-check':  'Fact-check',
  'voice':       'Voice',
  'originality': 'Originality',
  'tcs':         'T&Cs',
}

const RESULT_LABEL: Record<QAResult, string> = {
  passed:  'passed',
  partial: 'partial',
  failed:  'failed',
  missing: 'missing',
  waived:  'waived',
}

// Voice gets verbal labels instead of pass/partial/failed because "5/5" is
// not intuitive — readers don't know the denominator.
const VOICE_RESULT_LABEL: Record<QAResult, string> = {
  passed:  'on-brand',
  partial: 'mixed',
  failed:  'off-brand',
  missing: 'missing',
  waived:  'waived',
}

export function QAChip({
  kind,
  result,
  detail,
  size,
}: {
  kind: QAKind
  result: QAResult
  /** Optional detail appended to the label. For voice, this is the raw 1-5 score in a tooltip. */
  detail?: string
  size?: 'sm' | 'md'
}) {
  const resultLabel = kind === 'voice' ? VOICE_RESULT_LABEL[result] : RESULT_LABEL[result]
  const label = `${KIND_LABEL[kind]} ${resultLabel}`
  // For voice, surface the raw score as a tooltip rather than inline text.
  const title = kind === 'voice' && detail ? `Voice score: ${detail}` : undefined
  return <Chip color={COLOR[result]} label={label} size={size} title={title} />
}
