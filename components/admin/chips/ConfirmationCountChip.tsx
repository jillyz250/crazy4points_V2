/**
 * ConfirmationCountChip — "+N confirmations" badge.
 *
 * Increments when later intel items get attached as silent dups via
 * ingestItem (see utils/intel/ingestItem.ts). Renders only when count > 0.
 */
import { Chip } from './Chip'

export function ConfirmationCountChip({
  count,
  sources,
  size,
}: {
  count: number
  sources?: string[] | null
  size?: 'sm' | 'md'
}) {
  if (!count || count <= 0) return null
  const title = sources?.length
    ? `Confirmed by: ${sources.join(', ')}`
    : `${count} other source(s) later confirmed this`
  return <Chip color="blue" label={`+${count} confirmation${count > 1 ? 's' : ''}`} size={size} title={title} />
}
