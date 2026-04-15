/**
 * Server-side only. Generates an AI summary for a published alert and writes
 * a row to alert_history. Never import this from client components.
 */
import { createAdminClient } from '@/utils/supabase/server'
import { logAlertHistory } from '@/utils/supabase/queries'
import { summarizeAlert } from '@/utils/ai/summarizeAlert'
import type { Alert } from '@/utils/supabase/queries'

export async function logPublishEvent(
  alert: Alert,
  programName: string | null = null
): Promise<void> {
  const aiSummary = await summarizeAlert({
    title: alert.title,
    type: alert.type,
    description: alert.description,
    programName,
    start_date: alert.start_date,
    end_date: alert.end_date,
    confidence_level: alert.confidence_level,
    source_url: alert.source_url,
  })

  const supabase = createAdminClient()

  await logAlertHistory(supabase, {
    alert_id: alert.id,
    event: 'published',
    title: alert.title,
    type: alert.type,
    status: alert.status,
    start_date: alert.start_date,
    end_date: alert.end_date,
    confidence_level: alert.confidence_level,
    source_url: alert.source_url,
    primary_program_id: alert.primary_program_id,
    ai_summary: aiSummary,
  })
}
