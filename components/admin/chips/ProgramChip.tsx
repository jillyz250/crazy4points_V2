/**
 * ProgramChip — neutral grey chip rendering a program slug (e.g. "chase",
 * "marriott-bonvoy"). Multiple programs render as multiple chips per row.
 */
import { Chip } from './Chip'

export function ProgramChip({
  slug,
  size,
}: {
  slug: string
  size?: 'sm' | 'md'
}) {
  return <Chip color="grey" label={slug} size={size} title={`Program: ${slug}`} />
}
