/**
 * Plain (non-server-action) shared constants + types for the Expenses page.
 * These can't live in actions.ts because a 'use server' file may only export
 * async functions.
 */

// The categories Erica tracks. Kept in sync with the <select> on the page.
export const EXPENSE_CATEGORIES = [
  'hosting',
  'supabase',
  'api-llm',
  'email',
  'ads',
  'tools',
  'other',
] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export type ExpenseRow = {
  id: string
  spent_on: string
  amount: string // numeric comes back as a string — keep it exact, never parseFloat for display
  vendor: string | null
  category: string | null
  note: string | null
  created_at: string
}

// ── Vendor radar ─────────────────────────────────────────────────────────────
// Forwarded vendor "what's new" emails, assessed by Claude and filed for triage.
// Lives on the expenses hub because that page is vendor-central.
export const VENDOR_RADAR_STATUSES = ['new', 'reviewed', 'acted', 'dismissed'] as const
export type VendorRadarStatus = (typeof VENDOR_RADAR_STATUSES)[number]

export type VendorRadarRow = {
  id: string
  received_at: string
  vendor: string | null
  subject: string | null
  whats_new: string | null
  could_help: string | null
  disposition: 'discuss' | 'fyi'
  suggested_owner: string | null
  status: VendorRadarStatus
  source_email: string | null
  raw_excerpt: string | null
  decided_note: string | null
  decided_at: string | null
  created_at: string
}
