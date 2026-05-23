/**
 * Live "rate sheet" data for the newsletter — every currently-active
 * transfer bonus and point-purchase bonus, pulled from the alerts
 * table. Auto-rendered in the email between Sweet Spot and Also
 * Happening so subscribers always see what's bookable right now.
 *
 * Source of truth: alerts table (Wave 3a kept this updated via trigger
 * from content_variants). Filtering:
 *   • type IN ('transfer_bonus', 'point_purchase')
 *   • status = 'published'
 *   • end_date IS NULL OR end_date > now()
 *
 * Sorted by end_date ascending so expiring-soonest float to the top.
 * Capped at 12 entries — anything beyond that crowds the email.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/utils/supabase/server'

export interface ActiveBonusAlert {
  id: string
  slug: string | null
  title: string
  alert_type: 'transfer_bonus' | 'point_purchase'
  end_date: string | null
}

export async function getActiveBonusAlerts(
  supabase: SupabaseClient = createAdminClient(),
  now: Date = new Date(),
): Promise<ActiveBonusAlert[]> {
  const nowIso = now.toISOString()
  const { data, error } = await supabase
    .from('alerts')
    .select('id, slug, title, type, end_date')
    .in('type', ['transfer_bonus', 'point_purchase'])
    .eq('status', 'published')
    .or(`end_date.is.null,end_date.gt.${nowIso}`)
    .order('end_date', { ascending: true, nullsFirst: false })
    .limit(12)
  if (error || !data) return []
  return (data as Array<{ id: string; slug: string | null; title: string; type: string; end_date: string | null }>)
    .filter(
      (r): r is { id: string; slug: string | null; title: string; type: 'transfer_bonus' | 'point_purchase'; end_date: string | null } =>
        r.type === 'transfer_bonus' || r.type === 'point_purchase',
    )
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      alert_type: r.type,
      end_date: r.end_date,
    }))
}
