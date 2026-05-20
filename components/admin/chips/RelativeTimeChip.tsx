/**
 * RelativeTimeChip — "2h ago" / "3d ago" / "May 12" for when intel arrived.
 *
 * Neutral grey. Shows relative time under 7 days, absolute (Mon DD) beyond.
 */
import { Chip } from './Chip'

export function RelativeTimeChip({
  timestamp,
  size,
}: {
  timestamp: string | Date | null | undefined
  size?: 'sm' | 'md'
}) {
  if (!timestamp) return null
  const t = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  if (Number.isNaN(t.getTime())) return null

  const diffMs = Date.now() - t.getTime()
  const diffMin = diffMs / (1000 * 60)
  const diffHrs = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  let label: string
  if (diffMin < 60) label = `${Math.max(1, Math.round(diffMin))}m ago`
  else if (diffHrs < 24) label = `${Math.round(diffHrs)}h ago`
  else if (diffDays < 7) label = `${Math.round(diffDays)}d ago`
  else label = t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return <Chip color="grey" label={label} size={size} title={t.toISOString()} />
}
