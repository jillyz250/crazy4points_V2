/**
 * Anti-fabrication verification for topics (content system rehaul, PR 2).
 *
 * Two hard programmatic checks (Check A + Check B) plus a soft "low
 * confidence" flag (Check C). All three run on the topic's stored
 * fact_ledger before fact_check_status can flip away from 'pending'.
 *
 * Check A: every fact_ledger entry's source_quote must be a substring of
 *          the topic's source_markdown (after whitespace + case normalize).
 * Check B: every source_url (in fact_ledger AND in topic.source_urls) must
 *          have a hostname on the issuer-domain allowlist below.
 * Check C: any entry with confidence='low' demotes the topic to
 *          fact_check_status='partially_verified' instead of 'verified'.
 *
 * See plans/content-system-rehaul.md.
 */

import type { FactLedgerEntry } from '@/utils/supabase/queries'

export const ISSUER_DOMAINS = [
  // Banks / issuers
  'chase.com',
  'creditcards.chase.com',
  'sites.chase.com',
  'marriott.chase.com',
  'americanexpress.com',
  'news.americanexpress.com',
  'about.americanexpress.com',
  'citi.com',
  'citigroup.com',
  'capitalone.com',
  'cards.barclaycardus.com',
  'home.barclays',
  'bankofamerica.com',
  'about.bankofamerica.com',
  'wellsfargo.com',
  'newsroom.wf.com',
  'biltrewards.com',
  'fnbo.com',
  'usbank.com',
  // Loyalty programs (issuer-domain for their respective news/products)
  'united.com',
  'hub.united.com',
  'delta.com',
  'news.delta.com',
  'aa.com',
  'southwest.com',
  'swacommunications.com',
  'marriott.com',
  'news.marriott.com',
  'hilton.com',
  'newsroom.hilton.com',
  'hyatt.com',
  'newsroom.hyatt.com',
  'ihg.com',
  'paze.com',
]

export type VerifyError =
  | {
      check: 'source_quote'
      claim_index: number
      reason: 'source_quote_not_in_markdown'
      actual_quote_attempted: string
    }
  | {
      check: 'issuer_domain'
      url: string
      reason: 'not_on_issuer_domain'
    }

export type VerifyTopicResult = {
  /** 'verified' (all-high/medium, all checks pass), 'partially_verified'
   * (at least one low-confidence claim, no hard failures), or 'failed'. */
  status: 'verified' | 'partially_verified' | 'failed'
  errors: VerifyError[]
  /** Count of fact_ledger entries flagged confidence='low'. */
  lowConfidenceCount: number
}

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

function isOnIssuerDomain(url: string): boolean {
  let hostname: string
  try {
    hostname = new URL(url).hostname.toLowerCase()
  } catch {
    return false
  }
  return ISSUER_DOMAINS.some((d) => hostname === d || hostname.endsWith('.' + d))
}

export function verifyTopic(input: {
  sourceMarkdown: string
  sourceUrls: string[]
  factLedger: FactLedgerEntry[]
}): VerifyTopicResult {
  const { sourceMarkdown, sourceUrls, factLedger } = input
  const errors: VerifyError[] = []

  // Check A — source_quote substring check
  const normalizedMarkdown = normalize(sourceMarkdown ?? '')
  factLedger.forEach((entry, i) => {
    const q = normalize(entry.source_quote ?? '')
    if (!q) {
      errors.push({
        check: 'source_quote',
        claim_index: i,
        reason: 'source_quote_not_in_markdown',
        actual_quote_attempted: entry.source_quote ?? '',
      })
      return
    }
    if (!normalizedMarkdown.includes(q)) {
      errors.push({
        check: 'source_quote',
        claim_index: i,
        reason: 'source_quote_not_in_markdown',
        actual_quote_attempted: entry.source_quote ?? '',
      })
    }
  })

  // Check B — issuer-domain allowlist for all URLs
  const allUrls = new Set<string>([
    ...sourceUrls.filter(Boolean),
    ...factLedger.map((e) => e.source_url).filter(Boolean),
  ])
  for (const url of allUrls) {
    if (!isOnIssuerDomain(url)) {
      errors.push({ check: 'issuer_domain', url, reason: 'not_on_issuer_domain' })
    }
  }

  // Check C — confidence floor
  const lowConfidenceCount = factLedger.filter((e) => e.confidence === 'low').length

  if (errors.length > 0) {
    return { status: 'failed', errors, lowConfidenceCount }
  }
  if (lowConfidenceCount > 0) {
    return { status: 'partially_verified', errors: [], lowConfidenceCount }
  }
  return { status: 'verified', errors: [], lowConfidenceCount: 0 }
}
