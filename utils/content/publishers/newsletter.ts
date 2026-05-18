/**
 * Newsletter publisher (Content System Rehaul PR 4).
 *
 * Adds a row to content_ideas (type='newsletter', status='idea_bank') so the
 * weekly newsletter compose flow picks it up. Editor finalizes / sends via
 * existing /admin/content-ideas workflow — no auto-send here.
 */

import type { PublishContext, PublishResult, UnpublishContext } from './shared'

export async function publishNewsletter(ctx: PublishContext): Promise<PublishResult> {
  const { supabase, topic, variant } = ctx
  const metadata = (variant.metadata ?? {}) as Record<string, unknown>
  const subjectLine =
    typeof metadata.subject_line === 'string' && metadata.subject_line.trim()
      ? metadata.subject_line.trim()
      : topic.title

  // Try to attach to an existing alert row (if alert variant was already
  // published for this topic). Best-effort only.
  let sourceAlertId: string | null = null
  const { data: alertRow } = await supabase
    .from('alerts')
    .select('id')
    .eq('slug', topic.slug)
    .maybeSingle()
  if (alertRow) sourceAlertId = (alertRow as { id: string }).id

  // Use a deterministic slug-derived title so the open-status unique index
  // (type, lower(title)) doesn't collide on repeated publishes. If an
  // existing idea_bank row already exists for this topic, update it.
  const { data: existing } = await supabase
    .from('content_ideas')
    .select('id, status')
    .eq('type', 'newsletter')
    .eq('title', subjectLine)
    .in('status', ['new', 'idea_bank'])
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('content_ideas')
      .update({
        pitch: variant.body ?? '',
        source_alert_id: sourceAlertId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (existing as { id: string }).id)
    if (error) throw new Error(`Newsletter idea update failed: ${error.message}`)
  } else {
    const { error } = await supabase.from('content_ideas').insert({
      type: 'newsletter',
      title: subjectLine,
      pitch: variant.body ?? '',
      status: 'idea_bank',
      source: 'manual',
      source_alert_id: sourceAlertId,
    })
    if (error) throw new Error(`Newsletter idea insert failed: ${error.message}`)
  }

  return { publishTargetUrl: '/admin/content-ideas' }
}

export async function unpublishNewsletter(ctx: UnpublishContext): Promise<void> {
  const { supabase, topic, variant } = ctx
  const metadata = (variant.metadata ?? {}) as Record<string, unknown>
  const subjectLine =
    typeof metadata.subject_line === 'string' && metadata.subject_line.trim()
      ? metadata.subject_line.trim()
      : topic.title

  const { error } = await supabase
    .from('content_ideas')
    .update({ status: 'dismissed', updated_at: new Date().toISOString() })
    .eq('type', 'newsletter')
    .eq('title', subjectLine)
    .in('status', ['new', 'idea_bank'])
  if (error) throw new Error(`Newsletter unpublish failed: ${error.message}`)
}
