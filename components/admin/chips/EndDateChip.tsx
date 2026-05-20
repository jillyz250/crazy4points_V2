/**
 * EndDateChip — countdown to alert end_date / promo expiry.
 *
 * Coloring:
 *   > 7 days   → grey (informational)
 *   ≤ 7 days   → amber
 *   ≤ 3 days   → amber (stronger urgency)
 *   ≤ 24 hours → red
 *   past       → grey (expired)
 */
import { Chip, type ChipColor } from './Chip'

export function EndDateChip({
  endsAt,
  size,
}: {
  endsAt: string | Date | null | undefined
  size?: 'sm' | 'md'
}) {
  if (!endsAt) return null

  const end = typeof endsAt === 'string' ? new Date(endsAt) : endsAt
  if (Number.isNaN(end.getTime())) return null

  const now = Date.now()
  const diffMs = end.getTime() - now
  const diffHrs = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  let color: ChipColor
  let label: string

  if (diffMs <= 0) {
    color = 'grey'
    label = `Expired ${formatRelativePast(-diffDays)}`
  } else if (diffHrs <= 24) {
    color = 'red'
    label = `Ends in ${Math.max(1, Math.round(diffHrs))}h`
  } else if (diffDays <= 3) {
    color = 'red'
    label = `Ends in ${Math.round(diffDays)}d`
  } else if (diffDays <= 7) {
    color = 'amber'
    label = `Ends in ${Math.round(diffDays)}d`
  } else {
    color = 'grey'
    label = `Ends ${formatAbsolute(end)}`
  }

  return <Chip color={color} label={label} size={size} title={`End date: ${end.toISOString().slice(0, 10)}`} />
}

function formatRelativePast(daysAgo: number): string {
  if (daysAgo < 1) return 'today'
  if (daysAgo < 2) return 'yesterday'
  if (daysAgo < 30) return `${Math.round(daysAgo)}d ago`
  return `${Math.round(daysAgo / 30)}mo ago`
}

function formatAbsolute(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
