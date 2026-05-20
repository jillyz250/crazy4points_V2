/**
 * StatusChip — maps a unified lifecycle status to its color.
 * See plan v9 "Unified status lifecycle" table.
 */
import { Chip, type ChipColor } from './Chip'

export type LifecycleStatus =
  | 'new'
  | 'pending'
  | 'auto-approved'
  | 'snoozed'
  | 'approved'
  | 'gated'
  | 'published'
  | 'expired'
  | 'rejected'
  | 'archived'

// Color semantics:
//   blue   = "do something" — only `pending` demands editorial action
//   green  = "moving toward published" — auto-approved → approved → published
//   purple = deferred (snoozed)
//   amber  = warning (gated)
//   grey   = inert (pre-pipeline or post-pipeline terminal states)
const STATUS_COLOR: Record<LifecycleStatus, ChipColor> = {
  'new':           'grey',   // just arrived, not yet scored — pre-pipeline, inert
  'pending':       'blue',   // ← the only "action needed" state
  'auto-approved': 'green',  // system said yes, positive flow
  'snoozed':       'purple',
  'approved':      'green',  // you said yes, positive flow
  'gated':         'amber',
  'published':     'green',
  'expired':       'grey',
  'rejected':      'grey',
  'archived':      'grey',
}

const STATUS_LABEL: Record<LifecycleStatus, string> = {
  'new':           'New',
  'pending':       'Pending',
  'auto-approved': 'Auto-approved',
  'snoozed':       'Snoozed',
  'approved':      'Approved',
  'gated':         'Gated',
  'published':     'Published',
  'expired':       'Expired',
  'rejected':      'Rejected',
  'archived':      'Archived',
}

export function StatusChip({ status, size }: { status: LifecycleStatus; size?: 'sm' | 'md' }) {
  return <Chip color={STATUS_COLOR[status]} label={STATUS_LABEL[status]} size={size} />
}
