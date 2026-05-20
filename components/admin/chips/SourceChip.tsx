/**
 * SourceChip — neutral grey chip showing where intel came from.
 *
 * Two flavors:
 *   - <SourceChip name="OMAAT" /> → "Source: OMAAT"
 *   - <SourceTypeChip type="scrape" /> → "scrape" (or email/social/etc)
 */
import { Chip } from './Chip'

export type SourceType =
  | 'scrape'
  | 'email'
  | 'social'
  | 'ai-discovery'
  | 'manual'
  | 'official'
  | 'blog'
  | 'reddit'

export function SourceChip({ name, size }: { name: string; size?: 'sm' | 'md' }) {
  return <Chip color="grey" label={`Source: ${name}`} size={size} title={`Source name: ${name}`} />
}

export function SourceTypeChip({ type, size }: { type: SourceType; size?: 'sm' | 'md' }) {
  return <Chip color="grey" label={type} size={size} title={`Source type: ${type}`} />
}
