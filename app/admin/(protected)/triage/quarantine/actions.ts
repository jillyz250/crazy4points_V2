/**
 * Quarantine review actions — Phase 2a.4.
 *
 * Two actions per row:
 *   - promoteQuarantine: allowlist the sender + re-run ingestItem with the
 *     saved payload + mark quarantine row as promoted.
 *   - discardQuarantine: mark as reviewed, never auto-ingest.
 *
 * The "promote" path is intentionally idempotent: if the sender already
 * exists in intel_email_senders, we just reuse that row rather than insert
 * a duplicate.
 */
'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import { ingestItem } from '@/utils/intel/ingestItem'
import { sanitizeInboundHtml } from '@/utils/intel/email-inbound/sanitizeHtml'
import { classifyEmail } from '@/utils/intel/email-inbound/classifyEmail'
import { fetchResendInboundEmail } from '@/utils/intel/email-inbound/fetchResendInboundEmail'
import { getAllPrograms } from '@/utils/supabase/queries'
import type { AlertType } from '@/utils/supabase/queries'

interface SavedPayload {
  from?: string
  to?: string[]
  subject?: string | null
  html_sanitized?: string | null
  text?: string | null
  urls?: string[]
  source_tag?: string | null
  email_id?: string | null
}

export async function promoteQuarantine(formData: FormData): Promise<void> {
  await assertAdmin()
  const quarantineId = String(formData.get('quarantine_id') ?? '').trim()
  if (!quarantineId) return

  const supabase = createAdminClient()

  // 1. Fetch the quarantine row.
  const { data: q, error: qErr } = await supabase
    .from('intel_email_quarantine')
    .select('id, sender_email, sender_domain, raw_payload, subject, promoted_to_intel_id, discarded_at')
    .eq('id', quarantineId)
    .single()
  if (qErr || !q) return
  if (q.promoted_to_intel_id || q.discarded_at) return // already acted on

  const payload = (q.raw_payload ?? {}) as SavedPayload
  const senderEmail = (q.sender_email ?? '').toLowerCase()
  const senderDomain = (q.sender_domain ?? '').toLowerCase()

  // 2. Add to allowlist (insert OR ignore — domain-level if domain exists).
  if (senderDomain) {
    const { data: existing } = await supabase
      .from('intel_email_senders')
      .select('id')
      .eq('domain', senderDomain)
      .maybeSingle()
    if (!existing) {
      await supabase.from('intel_email_senders').insert({
        domain: senderDomain,
        notes: `auto-added from quarantine review on ${new Date().toISOString().slice(0, 10)}`,
      })
    }
  }

  // 3. Reconstruct the email body for classification. If the saved payload
  //    body is empty AND we have a Resend email_id, re-fetch from Resend's API
  //    (the original webhook only sent metadata).
  let savedText = (payload.text ?? '').trim()
  let savedHtml = payload.html_sanitized ?? ''
  if (!savedText && !savedHtml && payload.email_id) {
    const fetched = await fetchResendInboundEmail(payload.email_id)
    if (fetched) {
      savedText = (fetched.text ?? '').trim()
      if (fetched.html) {
        savedHtml = sanitizeInboundHtml(fetched.html).sanitized
      }
    }
  }
  const bodyText = savedText || stripHtmlForText(savedHtml)

  // 4. Re-run classification + ingestItem with the new fact that this is allowlisted.
  const programs = await getAllPrograms(supabase)
  const programSlugs = programs.map((p) => p.slug)
  const classification = await classifyEmail({
    subject: q.subject ?? '',
    body_text: bodyText.slice(0, 6000),
    sender_email: senderEmail,
    sender_domain: senderDomain,
    available_program_slugs: programSlugs,
  })

  if (!classification.has_loyalty_angle && !classification.fail_open) {
    // Loyalty-irrelevant — discard rather than ingest.
    await supabase
      .from('intel_email_quarantine')
      .update({
        discarded_at: new Date().toISOString(),
        discard_note: 'promoted but classifier said no loyalty angle',
      })
      .eq('id', quarantineId)
    revalidatePath('/admin/triage/quarantine')
    revalidatePath('/admin/triage')
    return
  }

  const programSlugMap = new Map(programs.map((p) => [p.slug, p.id]))
  const result = await ingestItem(
    supabase,
    {
      source: 'email',
      source_type: 'email',
      source_name: `email:${senderDomain}`,
      source_url: payload.urls?.[0] ?? null,
      raw_text: bodyText.slice(0, 4000),
      headline: classification.headline,
      confidence: classification.confidence,
      alert_type: (classification.alert_type as AlertType) ?? null,
      programs: classification.programs,
      expires_at: classification.expires_at,
      fact_origin: classification.confidence === 'high' ? 'official' : 'secondary',
    },
    programSlugMap,
  )

  // 5. Mark quarantine row as promoted (link to the intel_id if we got one).
  const intelId =
    result.kind === 'inserted' || result.kind === 'suppressed_as_dup' || result.kind === 'surfaced_as_update'
      ? result.intel_id
      : null
  await supabase
    .from('intel_email_quarantine')
    .update({ promoted_to_intel_id: intelId })
    .eq('id', quarantineId)

  revalidatePath('/admin/triage/quarantine')
  revalidatePath('/admin/triage')
}

export async function discardQuarantine(formData: FormData): Promise<void> {
  await assertAdmin()
  const quarantineId = String(formData.get('quarantine_id') ?? '').trim()
  if (!quarantineId) return
  const note = String(formData.get('discard_note') ?? '').trim().slice(0, 500) || null

  const supabase = createAdminClient()
  await supabase
    .from('intel_email_quarantine')
    .update({
      discarded_at: new Date().toISOString(),
      discard_note: note,
    })
    .eq('id', quarantineId)
    .is('promoted_to_intel_id', null)
    .is('discarded_at', null)

  revalidatePath('/admin/triage/quarantine')
  revalidatePath('/admin/triage')
}

function stripHtmlForText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}
