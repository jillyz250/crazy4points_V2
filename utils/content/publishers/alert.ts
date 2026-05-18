/**
 * Alert publisher (Content System Rehaul PR 4).
 *
 * Maps a verified Topic + approved alert ContentVariant into the legacy
 * `alerts` table so the existing /alerts/<slug> public route renders it.
 *
 * Idempotent: upserts on `slug`. Re-publishing the same topic refreshes
 * fields rather than creating a new row.
 */

import type { PublishContext, PublishResult, UnpublishContext } from './shared'
import type {
  AlertActionType,
  AlertType,
  TopicType,
} from '@/utils/supabase/queries'
import { setAlertPrograms } from '@/utils/supabase/queries'

// Most TopicType values overlap 1:1 with AlertType. The few that don't are
// mapped explicitly. AlertType is the older / narrower enum (no 'other',
// no 'glitch'? — actually glitch IS in AlertType — etc.). Anything not in
// AlertType falls back to 'limited_time_offer'.
const ALERT_TYPES = new Set<AlertType>([
  'transfer_bonus',
  'limited_time_offer',
  'award_availability',
  'status_promo',
  'glitch',
  'devaluation',
  'program_change',
  'partner_change',
  'category_change',
  'earn_rate_change',
  'status_change',
  'policy_change',
  'sweet_spot',
  'industry_news',
  'signup_bonus',
  'referral_bonus',
  'retention_offer',
  'shopping_portal_bonus',
  'point_purchase',
  'award_sale',
  'companion_pass',
  'dining_bonus',
  'fee_change',
  'card_refresh',
  'milestone_bonus',
  'card_credit',
])

function mapTopicTypeToAlertType(t: TopicType): AlertType {
  if (ALERT_TYPES.has(t as AlertType)) return t as AlertType
  return 'limited_time_offer'
}

const VALID_ACTION_TYPES: AlertActionType[] = [
  'book',
  'transfer',
  'apply',
  'status_match',
  'buy_miles',
  'activate',
  'monitor',
  'learn',
]

function readActionType(metadata: Record<string, unknown>): AlertActionType {
  const raw = metadata.action_type
  if (typeof raw === 'string' && VALID_ACTION_TYPES.includes(raw as AlertActionType)) {
    return raw as AlertActionType
  }
  return 'learn'
}

function readScore(metadata: Record<string, unknown>, key: string): number {
  const raw = metadata[key]
  if (typeof raw === 'number' && raw >= 0 && raw <= 5) return raw
  if (typeof raw === 'string') {
    const n = Number(raw)
    if (Number.isFinite(n) && n >= 0 && n <= 5) return n
  }
  return 4
}

export async function publishAlert(ctx: PublishContext): Promise<PublishResult> {
  const { supabase, topic, variant } = ctx

  // Resolve primary_program_id from topic.programs[0] (slug → id lookup).
  let primaryProgramId: string | null = null
  if (topic.programs.length > 0) {
    const { data, error } = await supabase
      .from('programs')
      .select('id')
      .eq('slug', topic.programs[0])
      .maybeSingle()
    if (error) throw new Error(`Lookup primary program failed: ${error.message}`)
    primaryProgramId = (data as { id: string } | null)?.id ?? null
  }

  const metadata = (variant.metadata ?? {}) as Record<string, unknown>
  const nowIso = new Date().toISOString()

  const row = {
    slug: topic.slug,
    title: topic.title,
    summary: topic.summary ?? topic.title,
    description: variant.body ?? '',
    type: mapTopicTypeToAlertType(topic.topic_type),
    status: 'published' as const,
    primary_program_id: primaryProgramId,
    action_type: readActionType(metadata),
    start_date: null as string | null,
    end_date: topic.end_date,
    published_at: nowIso,
    source: 'Content rehaul topic publish',
    source_url: topic.source_urls[0] ?? null,
    confidence_level: 'high' as const,
    impact_score: readScore(metadata, 'impact_score'),
    impact_justification: topic.summary ?? topic.title,
    value_score: readScore(metadata, 'value_score'),
    rarity_score: readScore(metadata, 'rarity_score'),
    registration_required: false,
    is_hot: false,
    gaps: [] as never[],
    verified_terms: null as string | null,
    created_by: 'topic-publish',
  }

  // Upsert keyed on slug.
  const { data: upserted, error } = await supabase
    .from('alerts')
    .upsert(row, { onConflict: 'slug' })
    .select('id')
    .single()
  if (error) throw new Error(`Alert upsert failed: ${error.message}`)
  const alertId = (upserted as { id: string }).id

  // Tag programs in junction (first = primary, rest = secondary).
  if (topic.programs.length > 0) {
    const { data: progs, error: progErr } = await supabase
      .from('programs')
      .select('id, slug')
      .in('slug', topic.programs)
    if (progErr) throw new Error(`Program lookup failed: ${progErr.message}`)
    const bySlug = new Map<string, string>()
    for (const p of (progs ?? []) as Array<{ id: string; slug: string }>) {
      bySlug.set(p.slug, p.id)
    }
    const ids = topic.programs
      .map((s) => bySlug.get(s))
      .filter((v): v is string => !!v)
    const primaryId = ids[0] ?? null
    const secondaryIds = ids.slice(1)
    await setAlertPrograms(supabase, alertId, { primaryId, secondaryIds })
  }

  return { publishTargetUrl: `/alerts/${topic.slug}` }
}

export async function unpublishAlert(ctx: UnpublishContext): Promise<void> {
  const { supabase, topic } = ctx
  const { error } = await supabase
    .from('alerts')
    .update({ status: 'draft', published_at: null, updated_at: new Date().toISOString() })
    .eq('slug', topic.slug)
  if (error) throw new Error(`Alert unpublish failed: ${error.message}`)
}
