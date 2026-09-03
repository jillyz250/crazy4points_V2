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
