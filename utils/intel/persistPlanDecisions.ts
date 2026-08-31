/**
 * Persist an editorial plan's triage decisions onto intel_items.
 *
 * The single source of truth for turning a planner result into
 * `triage_decision` marks — shared by /api/build-brief (both the daily email
 * batch and the backlog-drain batches) and scripts/drain-triage-backlog.mjs so
 * the leak-closing logic never drifts between the cron path and manual drains.
 *
 * Closes the historical "seen but never marked" leak: previously only
 * approve/reject/newsletter were persisted, so any item the planner routed to a
 * GUIDE (blog_ideas[].source_intel_ids) stayed triage_decision=NULL and got
 * re-fed forever. Every destination the planner can name is now marked.
 *
 * decision values written (see migration 304): approved | rejected | blog_idea
 * | newsletter_idea. Items the planner OMITS from every bucket are intentionally
 * left NULL so the next run re-feeds them (self-healing) — in practice the
 * planner classifies 100% of what it sees (coverage probe: 30/30), so omissions
 * are vanishingly rare.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { EditorialPlan } from '@/utils/ai/generateEditorialPlan'

export interface PersistDecisionsResult {
  persisted: number
  approved: number
  rejected: number
  blogIdea: number
  newsletterIdea: number
  /** intel_ids the plan named in at least one bucket (i.e. got a decision). */
  decidedIds: Set<string>
}

export async function persistPlanDecisions(
  supabase: SupabaseClient,
  plan: EditorialPlan,
): Promise<PersistDecisionsResult> {
  // Resolve ONE final decision per intel_id (last-write-wins), then do a single
  // UPDATE each. Order matters where an id appears in more than one bucket:
  // newsletter_candidates are a SUBSET of approve, and the newsletter mark is
  // applied LAST so a newsletter-worthy approve lands as 'newsletter_idea' —
  // preserving the pre-refactor behavior. Collapsing to one write per id also
  // halves DB round-trips and makes the returned counts reflect FINAL state
  // (no double-counting an approve that became a newsletter_idea).
  const finalById = new Map<string, { decision: string; reasoning: string }>()

  for (const a of plan.approve ?? []) {
    if (a?.intel_id) finalById.set(a.intel_id, { decision: 'approved', reasoning: a.why_publish ?? '' })
  }
  for (const r of plan.reject ?? []) {
    if (r?.intel_id) finalById.set(r.intel_id, { decision: 'rejected', reasoning: r.why_reject ?? '' })
  }
  // GUIDE-routed intel: the planner links the source items on each blog idea.
  // These were previously dropped (route comment "blog_ideas have no intel_id
  // binding") — that comment predated the source_intel_ids field. Mark them so
  // they leave the undecided pool; the sweep archives them like newsletter_ideas.
  for (const b of plan.blog_ideas ?? []) {
    for (const id of b?.source_intel_ids ?? []) {
      if (id) finalById.set(id, { decision: 'blog_idea', reasoning: b.title ?? '' })
    }
  }
  for (const n of plan.newsletter_candidates ?? []) {
    if (n?.intel_id) finalById.set(n.intel_id, { decision: 'newsletter_idea', reasoning: n.angle ?? '' })
  }

  const nowIso = new Date().toISOString()
  const counts = { approved: 0, rejected: 0, blogIdea: 0, newsletterIdea: 0 }
  const decidedIds = new Set<string>()
  let persisted = 0

  for (const [intelId, u] of finalById) {
    const { error } = await supabase
      .from('intel_items')
      .update({
        triage_decision: u.decision,
        triage_reasoning: u.reasoning.slice(0, 1000),
        triage_decided_at: nowIso,
      })
      .eq('id', intelId)
    if (error) continue
    persisted++
    decidedIds.add(intelId)
    if (u.decision === 'approved') counts.approved++
    else if (u.decision === 'rejected') counts.rejected++
    else if (u.decision === 'blog_idea') counts.blogIdea++
    else if (u.decision === 'newsletter_idea') counts.newsletterIdea++
  }

  return { persisted, decidedIds, ...counts }
}
