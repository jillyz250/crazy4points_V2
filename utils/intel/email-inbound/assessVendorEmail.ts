/**
 * assessVendorEmail — is this forwarded email a vendor INVOICE, a vendor
 * PRODUCT-UPDATE ("what's new"), or NEITHER?
 *
 * Jill forwards everything to one intel inbox: issuer/points news AND her SaaS
 * vendor mail (Vercel, Supabase, Anthropic, Resend, Firecrawl, Hostinger, Google,
 * ChatGPT). This peels off the vendor mail before the loyalty-story path:
 *   - invoice        -> Erica's `expenses` ledger (amount extracted)
 *   - vendor_update  -> Morgan's `vendor_radar` (Claude's 4-part assessment)
 *   - neither        -> caller falls through to the normal intel pipeline
 *
 * FAIL-SAFE: on any API/parse failure, or any uncertainty, return kind:'neither'
 * so the email is never lost — it just continues down the existing news path.
 */
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/utils/ai/logUsage'

export type VendorEmailAssessment =
  | { kind: 'neither' }
  | {
      kind: 'invoice'
      vendor: string | null
      amount: number | null // dollars.cents, null if not confidently found
      spent_on: string | null // YYYY-MM-DD, null if not found
      note: string | null
    }
  | {
      kind: 'vendor_update'
      vendor: string | null
      whats_new: string
      could_help: string
      disposition: 'discuss' | 'fyi'
      suggested_owner: string // bill | devon | priya | erica | john | kesha | janet | morgan
    }

export interface AssessVendorEmailInput {
  subject: string
  body_text: string
  sender_email: string
  sender_domain: string
}

const VALID_OWNERS = ['bill', 'devon', 'priya', 'erica', 'john', 'kesha', 'janet', 'morgan']

const SYSTEM_PROMPT = `You triage forwarded email for crazy4points.com (a points & miles site). The owner forwards TWO unrelated kinds of mail to the same inbox: (A) travel/points/loyalty news, and (B) mail from the SaaS vendors that run the business — Vercel, Supabase, Anthropic/Claude, OpenAI/ChatGPT, Resend, Firecrawl, Hostinger, Google Workspace, GitHub.

Your ONLY job is to detect vendor mail of type B and classify it. Classify into exactly one "kind":

- "invoice": a bill, receipt, or payment confirmation from one of those SaaS vendors (subject/words like invoice, receipt, payment, your bill, amount due, charged). Extract the total amount actually charged and the date.
- "vendor_update": a product/feature announcement, changelog, release notes, or "what's new" newsletter from one of those SaaS vendors — i.e. new CAPABILITIES, not a bill.
- "neither": ANYTHING else — travel/points/airline/hotel/credit-card news, issuer promos, personal mail, or vendor mail you are not confident about. When in doubt, choose "neither".

Return ONLY a JSON object, no prose. Shapes:

invoice:
{"kind":"invoice","vendor":"Vercel","amount":84.57,"spent_on":"2026-09-01","note":"Pro + usage, invoice #1234"}
- amount: a NUMBER in dollars (no currency symbol/commas), the total charged; null if you cannot find it confidently.
- spent_on: YYYY-MM-DD of the charge/invoice; null if absent.

vendor_update:
{"kind":"vendor_update","vendor":"Supabase","whats_new":"<=200 chars, plain: the new capability","could_help":"<=300 chars: concretely how it could help crazy4points, or 'No clear fit right now.'","disposition":"discuss","suggested_owner":"bill"}
- disposition: "discuss" if it plausibly helps us, cuts cost, or changes what we can build; otherwise "fyi".
- suggested_owner: who should weigh in — bill (infra/security/database/hosting), devon (UI/design), priya (data/scraping/sources), erica (cost/billing), john (content), kesha (social), janet (growth/analytics), or morgan (general/unclear). Pick the single best fit.
- Be honest in could_help: most updates are not relevant; say so plainly rather than inventing a use.

neither:
{"kind":"neither"}`

export async function assessVendorEmail(input: AssessVendorEmailInput): Promise<VendorEmailAssessment> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { kind: 'neither' }

  const userMessage = `FROM: ${input.sender_email} (domain: ${input.sender_domain})
SUBJECT: ${input.subject}

BODY:
${input.body_text.slice(0, 12000)}`

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })
    try {
      await logUsage(response, 'assess_vendor_email', { sender_domain: input.sender_domain })
    } catch {
      /* non-fatal */
    }

    const content = response.content[0]
    if (content.type !== 'text') return { kind: 'neither' }
    const jsonText = content.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return { kind: 'neither' }
    }
    if (typeof parsed !== 'object' || parsed === null) return { kind: 'neither' }
    const p = parsed as Record<string, unknown>

    if (p.kind === 'invoice') {
      const amountRaw = p.amount
      let amount: number | null = null
      if (typeof amountRaw === 'number' && Number.isFinite(amountRaw) && amountRaw >= 0) {
        amount = Math.round(amountRaw * 100) / 100
      } else if (typeof amountRaw === 'string') {
        const n = parseFloat(amountRaw.replace(/[^0-9.]/g, ''))
        if (Number.isFinite(n) && n >= 0) amount = Math.round(n * 100) / 100
      }
      const spent_on =
        typeof p.spent_on === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.spent_on) ? p.spent_on : null
      return {
        kind: 'invoice',
        vendor: typeof p.vendor === 'string' ? p.vendor.slice(0, 80) : null,
        amount,
        spent_on,
        note: typeof p.note === 'string' ? p.note.slice(0, 300) : null,
      }
    }

    if (p.kind === 'vendor_update') {
      const whats_new = typeof p.whats_new === 'string' ? p.whats_new.slice(0, 400) : ''
      if (!whats_new.trim()) return { kind: 'neither' } // nothing useful extracted -> don't create noise
      const disposition = p.disposition === 'discuss' ? 'discuss' : 'fyi'
      const owner =
        typeof p.suggested_owner === 'string' && VALID_OWNERS.includes(p.suggested_owner)
          ? p.suggested_owner
          : 'morgan'
      return {
        kind: 'vendor_update',
        vendor: typeof p.vendor === 'string' ? p.vendor.slice(0, 80) : null,
        whats_new,
        could_help:
          typeof p.could_help === 'string' ? p.could_help.slice(0, 500) : 'No clear fit right now.',
        disposition,
        suggested_owner: owner,
      }
    }

    return { kind: 'neither' }
  } catch {
    return { kind: 'neither' }
  }
}
