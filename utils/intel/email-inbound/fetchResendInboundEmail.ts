/**
 * Fetch the full body of an inbound email from Resend's API.
 *
 * The email.received webhook only sends metadata (from, to, subject, email_id).
 * To get the actual body we call GET /emails/receiving/{id} with the Resend
 * API key.
 *
 * Docs: https://resend.com/docs/api-reference/emails/retrieve-received-email
 */

export interface ResendInboundEmail {
  id: string
  from: string | null
  to: string[]
  subject: string | null
  text: string | null
  html: string | null
  headers?: Record<string, string>
}

export async function fetchResendInboundEmail(emailId: string): Promise<ResendInboundEmail | null> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[fetchResendInboundEmail] RESEND_API_KEY missing')
    return null
  }
  if (!emailId) return null

  try {
    const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) {
      console.error(
        `[fetchResendInboundEmail] HTTP ${res.status} for email ${emailId}: ${await res.text().then((t) => t.slice(0, 200)).catch(() => '')}`,
      )
      return null
    }
    const data: unknown = await res.json()
    if (typeof data !== 'object' || data === null) return null
    const r = data as Record<string, unknown>
    return {
      id: String(r.id ?? emailId),
      from: typeof r.from === 'string' ? r.from : null,
      to: Array.isArray(r.to) ? r.to.filter((x) => typeof x === 'string').map(String) : [],
      subject: typeof r.subject === 'string' ? r.subject : null,
      text: typeof r.text === 'string' ? r.text : null,
      html: typeof r.html === 'string' ? r.html : null,
      headers:
        typeof r.headers === 'object' && r.headers !== null
          ? (r.headers as Record<string, string>)
          : undefined,
    }
  } catch (err) {
    console.error('[fetchResendInboundEmail] threw:', err instanceof Error ? err.message : String(err))
    return null
  }
}
