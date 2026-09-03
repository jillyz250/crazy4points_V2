/**
 * Ideas box — shared types + pure helpers (Devon, 2026-09-03).
 * Each employee proactively suggests improvements to THEIR area; Jill acts on
 * them. Kept OUT of actions.ts because a 'use server' module may only export
 * async functions — the types, constants, and the sync sort helper live here so
 * both the server page and the client IdeasBox can import them.
 * Table: public.employee_ideas (migration 663).
 */

export type IdeaArea = 'efficiency' | 'visual' | 'data' | 'process' | 'accuracy' | 'growth' | 'other'
export type IdeaStatus = 'new' | 'approved' | 'rejected' | 'shipped'

export interface EmployeeIdea {
  id: string
  employee_slug: string
  idea: string
  area: IdeaArea
  status: IdeaStatus
  created_by: string
  decided_note: string | null
  created_at: string
  decided_at: string | null
  shipped_at: string | null
}

export const IDEA_SELECT =
  'id, employee_slug, idea, area, status, created_by, decided_note, created_at, decided_at, shipped_at'

export const IDEA_AREAS: IdeaArea[] = ['efficiency', 'visual', 'data', 'process', 'accuracy', 'growth', 'other']
export const IDEA_STATUSES: IdeaStatus[] = ['new', 'approved', 'rejected', 'shipped']

export const AREA_LABEL: Record<IdeaArea, string> = {
  efficiency: 'Efficiency',
  visual: 'Visual',
  data: 'Data',
  process: 'Process',
  accuracy: 'Accuracy',
  growth: 'Growth',
  other: 'Other',
}

export const STATUS_LABEL: Record<IdeaStatus, string> = {
  new: 'New',
  approved: 'Approved',
  rejected: 'Rejected',
  shipped: 'Shipped',
}

/**
 * Box order: actionable first. NEW ideas surface at the top (they need Jill),
 * then approved (awaiting ship), then shipped, then rejected — newest first
 * within each bucket. Used identically after an optimistic flip (client) and on
 * the next server load.
 */
const STATUS_RANK: Record<IdeaStatus, number> = { new: 0, approved: 1, shipped: 2, rejected: 3 }
export function sortIdeas(list: EmployeeIdea[]): EmployeeIdea[] {
  return [...list].sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}
