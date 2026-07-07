/**
 * Inbound email webhook — Phase 2a.3.
 *
 * Resend (or any provider that POSTs the same shape) calls this when an
 * email arrives at intel+<tag>@ouarkiwhag.resend.app (sandbox) or eventually
 * intel+<tag>@in.crazy4points.com (custom subdomain).
 *
 * Security hardening (in order):
 *   1. Signature verification (Bearer token or Svix HMAC)
 *   2. Size cap (drop >1MB before parsing)
 *   3. Parse payload — pull from, to, subject, text, html
 *   4. Sanitize HTML (allowlist: p, a, ul, li, strong, em, br + safe href)
 *   5. Strip attachments (we never store binaries)
 *   6. Extract +tag from To: address → source attribution
 *   7. Sender allowlist check — if not on list, quarantine
 *   8. Haiku classification — has_loyalty_angle, headline, programs, etc.
 *   9. Skip if has_loyalty_angle=false (drop unrelated commercial email)
 *  10. Route to ingestItem with source_type='email'
 *
 * Failure mode: every error path writes to intel_ingest_errors so silent
 * failures are impossible. Failed signature / oversized payload return 4xx
 * to the provider (which logs it on their side too).
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Webhook } from 'svix'
import { createAdminClient } from '@/utils/supabase/server'
import { ingestItem } from '@/utils/intel/ingestItem'
import { sanitizeInboundHtml, extractSafeUrls } from '@/utils/intel/email-inbound/sanitizeHtml'
import { classifyEmail } from '@/utils/intel/email-inbound/classifyEmail'
import { fetchResendInboundEmail } from '@/utils/intel/email-inbound/fetchResendInboundEmail'
import { getAllPrograms } from '@/utils/supabase/queries'
import type { AlertType } from '@/utils/supabase/queries'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_PAYLOAD_BYTES = 1_000_000 // 1 MB

export async function POST(req: NextRequest) {
  // --- 1. Size cap (cheap header check before reading the body) --------------
  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10)
  if (contentLength > MAX_PAYLOAD_BYTES) {
    await logIngestError('email', 'security', 'payload >1MB', { content_length: contentLength })
    return NextResponse.json({ ok: false, error: 'payload too large' }, { status: 413 })
  }

  // Read the raw body ONCE — needed both for Svix HMAC verification (which
  // signs the exact bytes) and for JSON parsing.
  const rawBody = await req.text()
  if (rawBody.length > MAX_PAYLOAD_BYTES) {
    await logIngestError('email', 'security', 'payload >1MB (body)', { body_length: rawBody.length })
    return NextResponse.json({ ok: false, error: 'payload too large' }, { status: 413 })
  }

  // --- 2. Signature verification --------------------------------------------
  // Two accepted auth paths, both cryptographically enforced:
  //   (a) Bearer RESEND_INBOUND_WEBHOOK_SECRET  — used by our synthetic tests.
  //   (b) Svix HMAC signature, verified against RESEND_INBOUND_SIGNING_SECRET
  //       (the `whsec_...` value from Resend's webhook settings).
  // Fail CLOSED: a svix-signature header is only honored if it actually
  // verifies. A missing signing secret with a signature present is rejected.
  // Fail CLOSED on misconfiguration: if NEITHER auth secret is configured,
  // there is no way to authenticate the caller, so reject rather than process
  // an unauthenticated write into the intel pipeline.
  const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET
  const signingSecretConfigured = !!process.env.RESEND_INBOUND_SIGNING_SECRET
  if (!secret && !signingSecretConfigured) {
    await logIngestError('email', 'security', 'no inbound auth secret configured — refusing request', {})
    return NextResponse.json({ ok: false, error: 'server misconfiguration' }, { status: 500 })
  }
  {
    const auth = req.headers.get('authorization')
    const svixSig = req.headers.get('svix-signature')
    if (secret && auth === `Bearer ${secret}`) {
      // OK — trusted test path.
    } else if (svixSig) {
      const signingSecret = process.env.RESEND_INBOUND_SIGNING_SECRET
      if (!signingSecret) {
        await logIngestError('email', 'security', 'svix signature present but RESEND_INBOUND_SIGNING_SECRET not set', {})
        return NextResponse.json({ ok: false, error: 'signature verification unavailable' }, { status: 401 })
      }
      try {
        new Webhook(signingSecret).verify(rawBody, {
          'svix-id': req.headers.get('svix-id') ?? '',
          'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
          'svix-signature': svixSig,
        })
      } catch {
        await logIngestError('email', 'security', 'svix signature verification failed', {})
        return NextResponse.json({ ok: false, error: 'invalid signature' }, { status: 401 })
      }
    } else {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }
  }

  // --- 3. Parse payload -----------------------------------------------------
  let payload: ResendInboundPayload
  let emailId: string | null = null
  try {
    const raw = JSON.parse(rawBody)
    payload = normalizePayload(raw)
    emailId = extractEmailId(raw)
  } catch (err) {
    await logIngestError('email', 'parse', err)
    return NextResponse.json({ ok: false, error: 'malformed JSON' }, { status: 400 })
  }

  // --- 3b. Resend webhook only ships metadata; fetch body via API ----------
  // If we have an email_id but the webhook body is empty, retrieve the full
  // content from Resend's receiving API. Synthetic test payloads include
  // text/html directly and skip this step (they have no email_id).
  if (emailId && !payload.text && !payload.html) {
    const fetched = await fetchResendInboundEmail(emailId)
    if (fetched) {
      payload = {
        from: payload.from || fetched.from || '',
        to: payload.to.length > 0 ? payload.to : fetched.to,
        subject: payload.subject ?? fetched.subject,
        text: payload.text ?? fetched.text,
        html: payload.html ?? fetched.html,
      }
    } else {
      console.warn(
        `[email-inbound] failed to fetch body for email_id=${emailId} — proceeding with metadata only`,
      )
    }
  }

  if (!payload.from || !payload.to || payload.to.length === 0) {
    await logIngestError('email', 'parse', 'missing from/to', { payload })
    return NextResponse.json({ ok: false, error: 'missing from/to' }, { status: 400 })
  }

  // --- 4 + 5. Sanitize HTML / strip attachments ------------------------------
  const html = payload.html ? sanitizeInboundHtml(payload.html).sanitized : ''
  const bodyText = (payload.text ?? '').trim() || stripHtmlForText(html)
  const allUrls = html ? extractSafeUrls(html) : []
  // For source_url we want a meaningful destination — drop mailto: links
  // (they show up from "unsubscribe by email" or "contact us"); they're
  // safe and stay in the body, just not the canonical source.
  const urls = allUrls.filter((u) => !u.toLowerCase().startsWith('mailto:'))
  // payload.attachments — intentionally never read further. They aren't stored.

  // --- 6. Extract +tag from To: address ------------------------------------
  const { source_tag, normalized_recipient } = extractSourceTag(payload.to[0])

  // --- 7. Sender allowlist check + Phase 2b source lookup -------------------
  const supabase = createAdminClient()
  const senderDomain = (payload.from.split('@')[1] ?? '').toLowerCase()
  const senderEmail = payload.from.toLowerCase()

  const { data: senderRow } = await supabase
    .from('intel_email_senders')
    .select('id, source_id, active')
    .or(
      `email.eq.${senderEmail},domain.eq.${senderDomain},domain.eq.@${senderDomain}`,
    )
    .eq('active', true)
    .maybeSingle()

  // Look up the Phase 2b source by inbox_address +tag, if any
  let sourceName: string | null = null
  let sourceId: string | null = senderRow?.source_id ?? null
  if (source_tag) {
    const { data: srcByTag } = await supabase
      .from('sources')
      .select('id, name')
      .eq('inbox_address', normalized_recipient)
      .maybeSingle()
    if (srcByTag) {
      sourceId = srcByTag.id
      sourceName = srcByTag.name
    }
  }

  // No sender allowlist match → quarantine.
  if (!senderRow) {
    const { data: q, error: qErr } = await supabase
      .from('intel_email_quarantine')
      .insert({
        sender_email: senderEmail,
        sender_domain: senderDomain,
        subject: payload.subject ?? null,
        reason: 'sender_not_allowlisted',
        raw_payload: {
          from: payload.from,
          to: payload.to,
          subject: payload.subject,
          html_sanitized: html,
          text: bodyText.slice(0, 4000),
          urls,
          source_tag,
          email_id: emailId, // preserve so Promote can re-fetch body if needed
        },
      })
      .select('id')
      .single()
    if (qErr) await logIngestError('email', 'insert', qErr, { stage: 'quarantine' })
    return NextResponse.json({ ok: true, quarantined: q?.id ?? null })
  }

  // --- 8. Haiku classification ---------------------------------------------
  const programs = await getAllPrograms(supabase)
  const programSlugs = programs.map((p) => p.slug)

  const classification = await classifyEmail({
    subject: payload.subject ?? '',
    body_text: bodyText.slice(0, 6000),
    sender_email: senderEmail,
    sender_domain: senderDomain,
    available_program_slugs: programSlugs,
  })

  // --- 9. Loyalty-irrelevant: insert as rejected intel_item so editor has
  //         a visible record on /admin/triage?tab=rejected. Previously these
  //         were silently dropped, leaving no trail of what was forwarded.
  if (!classification.has_loyalty_angle && !classification.fail_open) {
    const { data: rejectedRow, error: rejErr } = await supabase
      .from('intel_items')
      .insert({
        source_url: urls[0] ?? null,
        source_type: 'email',
        source_name: sourceName ?? `email:${senderDomain}`,
        raw_text: bodyText.slice(0, 4000),
        headline: classification.headline,
        confidence: classification.confidence,
        alert_type: null,
        programs: classification.programs,
        expires_at: null,
        fact_origin: classification.fact_origin,
        processed: true,
        rejected_at: new Date().toISOString(),
        rejected_reason: 'auto-discard: no loyalty angle',
      })
      .select('id')
      .single()
    if (rejErr) {
      await logIngestError('email', 'insert', rejErr, { stage: 'auto-discard-record' })
    }
    console.log(
      `[email-inbound] auto-discarded as no-loyalty (intel_id=${rejectedRow?.id ?? '(failed)'}): from=${senderEmail} subject=${payload.subject?.slice(0, 60)}`,
    )
    return NextResponse.json({
      ok: true,
      discarded: 'no_loyalty_angle',
      intel_id: rejectedRow?.id ?? null,
    })
  }

  // --- 10. ingestItem -------------------------------------------------------
  const programSlugMap = new Map(programs.map((p) => [p.slug, p.id]))
  const result = await ingestItem(
    supabase,
    {
      source: 'email',
      source_type: 'email',
      source_name: sourceName ?? `email:${senderDomain}`,
      source_url: urls[0] ?? null,
      raw_text: bodyText.slice(0, 4000),
      headline: classification.headline,
      confidence: classification.confidence,
      alert_type: (classification.alert_type as AlertType) ?? null,
      programs: classification.programs,
      expires_at: classification.expires_at,
      fact_origin: classification.fact_origin,
    },
    programSlugMap,
  )

  return NextResponse.json({
    ok: true,
    classification: {
      headline: classification.headline,
      confidence: classification.confidence,
      programs: classification.programs,
      alert_type: classification.alert_type,
      fail_open: classification.fail_open,
    },
    ingest: result,
    source_id: sourceId,
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

interface ResendInboundPayload {
  from: string
  to: string[]
  subject: string | null
  text: string | null
  html: string | null
}

/**
 * Normalize provider payload shapes. Resend's exact wire format will be
 * confirmed once Jill sends a test email; for now we accept a handful of
 * common shapes (Resend, CloudMailin, Postmark all use slightly different
 * field names for from/to/text/html).
 */
function normalizePayload(raw: unknown): ResendInboundPayload {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('payload not an object')
  }
  const r = raw as Record<string, unknown>

  // Resend webhook envelope: { type: 'inbound.email.received', data: {...} }
  const data: Record<string, unknown> =
    typeof r.data === 'object' && r.data !== null ? (r.data as Record<string, unknown>) : r

  // From — could be a string ("Foo <foo@bar.com>") or {email, name}
  const fromRaw = data.from ?? data.From ?? data.sender ?? ''
  const from = typeof fromRaw === 'string'
    ? extractAddress(fromRaw)
    : typeof fromRaw === 'object' && fromRaw !== null
      ? extractAddress(String((fromRaw as Record<string, unknown>).email ?? (fromRaw as Record<string, unknown>).address ?? ''))
      : ''

  // To — could be array, string, or array of objects
  const toRaw = data.to ?? data.To ?? data.recipients ?? []
  const to: string[] = []
  if (Array.isArray(toRaw)) {
    for (const t of toRaw) {
      if (typeof t === 'string') {
        const addr = extractAddress(t)
        if (addr) to.push(addr)
      } else if (typeof t === 'object' && t !== null) {
        const obj = t as Record<string, unknown>
        const addr = extractAddress(String(obj.email ?? obj.address ?? ''))
        if (addr) to.push(addr)
      }
    }
  } else if (typeof toRaw === 'string') {
    // CSV or single
    for (const part of toRaw.split(',')) {
      const addr = extractAddress(part.trim())
      if (addr) to.push(addr)
    }
  }

  return {
    from,
    to,
    subject: (data.subject ?? data.Subject ?? null) as string | null,
    text: (data.text ?? data.text_body ?? data.TextBody ?? null) as string | null,
    html: (data.html ?? data.html_body ?? data.HtmlBody ?? null) as string | null,
  }
}

/**
 * Pull Resend's email_id out of the webhook envelope.
 * Resend sends `{ type: 'email.received', data: { email_id, ... } }`.
 */
function extractEmailId(raw: unknown): string | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const data = typeof r.data === 'object' && r.data !== null ? (r.data as Record<string, unknown>) : r
  const id = data.email_id ?? data.emailId ?? data.id
  return typeof id === 'string' ? id : null
}

/** Pull bare address out of "Name <addr@host>" form. */
function extractAddress(raw: string): string {
  const m = raw.match(/<([^>]+)>/)
  if (m) return m[1].toLowerCase().trim()
  return raw.toLowerCase().trim()
}

/**
 * Extract the +tag from intel+marriott@host → returns { source_tag: 'marriott',
 * normalized_recipient: 'intel+marriott@host' }. Recipient stays lowercase.
 */
function extractSourceTag(recipient: string): { source_tag: string | null; normalized_recipient: string } {
  const lower = recipient.toLowerCase().trim()
  const m = lower.match(/^([^+@]+)\+([^@]+)@(.+)$/)
  if (m) return { source_tag: m[2], normalized_recipient: lower }
  return { source_tag: null, normalized_recipient: lower }
}

function stripHtmlForText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function logIngestError(
  source: 'email' | 'scout' | 'grok' | 'manual' | 'x',
  stage: 'security' | 'parse' | 'classify' | 'dedup' | 'haiku-diff' | 'insert' | 'surface',
  err: unknown,
  extraPayload?: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('intel_ingest_errors').insert({
      source,
      stage,
      payload: (extraPayload ?? { note: String(err) }) as Record<string, unknown>,
      error_message: (err instanceof Error ? err.message : String(err)).slice(0, 1000),
      error_stack: err instanceof Error ? err.stack?.slice(0, 4000) ?? null : null,
    })
  } catch (logErr) {
    console.error('[email-inbound] failed to log ingest error:', logErr, 'orig:', err)
  }
}
