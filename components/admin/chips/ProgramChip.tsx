/**
 * ProgramChip — single program slug as a grey chip.
 * ProgramsChip — multiple program slugs as ONE chip joined with " · ", so
 * a row's program signal always takes exactly one chip slot regardless of
 * how many programs the intel touches.
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

export function ProgramsChip({
  slugs,
  size,
}: {
  slugs: string[] | null | undefined
  size?: 'sm' | 'md'
}) {
  const list = (slugs ?? []).filter((s) => s && s.trim())
  if (list.length === 0) return null
  if (list.length === 1) {
    return <Chip color="grey" label={list[0]} size={size} title={`Program: ${list[0]}`} />
  }
  return (
    <Chip
      color="grey"
      label={list.join(' · ')}
      size={size}
      title={`${list.length} programs: ${list.join(', ')}`}
    />
  )
}
