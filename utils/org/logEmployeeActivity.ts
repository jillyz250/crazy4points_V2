import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * The activity chain: a finished item on a teammate's page ("what I shipped").
 * Logged best-effort from the content pipeline so each employee's page shows
 * their output (Priya verified, John published, Kesha posted, ...). Powers the
 * "Activity" feed on /admin/org/[slug] and the dashboard's "Today's output".
 */
export interface EmployeeActivityInput {
  employee_slug: string
  action: string // verified | drafted | published | posted | fixed | reviewed | shipped
  summary: string
  ref_type?: string | null // alert | page | social | guide | task | other
  ref_id?: string | null
  link?: string | null
}

/** Log one activity item. NEVER throws — activity logging must not break real work. */
export async function logEmployeeActivity(
  supabase: SupabaseClient,
  input: EmployeeActivityInput,
): Promise<void> {
  try {
    await supabase.from('employee_activity').insert({
      employee_slug: input.employee_slug,
      action: input.action,
      summary: input.summary.slice(0, 300),
      ref_type: input.ref_type ?? null,
      ref_id: input.ref_id ?? null,
      link: input.link ?? null,
    })
  } catch {
    /* non-fatal */
  }
}

/** Log many at once (one call per row; all best-effort). */
export async function logEmployeeActivities(
  supabase: SupabaseClient,
  inputs: EmployeeActivityInput[],
): Promise<void> {
  for (const i of inputs) await logEmployeeActivity(supabase, i)
}
