/**
 * ConfidenceChip — high/medium/low source confidence.
 * Distinct from FactOriginChip (provenance of the claim itself).
 */
import { Chip, type ChipColor } from './Chip'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

const COLOR: Record<ConfidenceLevel, ChipColor> = {
  high:   'green',
  medium: 'amber',
  low:    'red',
}

export function ConfidenceChip({
  level,
  size,
}: {
  level: ConfidenceLevel
  size?: 'sm' | 'md'
}) {
  return (
    <Chip
      color={COLOR[level]}
      label={`${level} confidence`}
      size={size}
      title="Scout's classification of how solid the source is"
    />
  )
}
