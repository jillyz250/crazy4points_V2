/**
 * Legal/compliance disclosure for financial-product + external-offer alerts
 * (Charlie, Head of Legal, 2026-09-05, after a Bask Bank bank-bonus alert
 * reached publish without the legal gate).
 *
 * The rule: any alert about a financial product (bank/card/brokerage/insurer/
 * fintech, money in or out) OR any alert with an outbound offer button
 * (offer_url) must carry a "not affiliated / not financial advice / not a
 * recommendation" disclosure. `needsFinancialDisclosure` is the single source
 * of truth for BOTH the publish gate (`legal` in publishGates) and the alert
 * page renderer, so the two can never disagree. The page auto-renders
 * DEFAULT_FINANCIAL_DISCLOSURE when an applicable alert has no custom
 * `legal_disclosure`, so a disclosure can never be silently missing.
 */
import type { AlertType } from '@/utils/supabase/queries'

/** Alert types that are inherently financial products (money in or out). */
export const FINANCIAL_ALERT_TYPES: AlertType[] = ['signup_bonus', 'point_purchase']

/** True when an alert must carry the financial/offer legal disclosure. */
export function needsFinancialDisclosure(
  type: AlertType,
  offerUrl?: string | null,
): boolean {
  return FINANCIAL_ALERT_TYPES.includes(type) || !!(offerUrl && offerUrl.trim())
}

/** Generic fallback disclosure (no em/en dashes per house style). Used when an
 *  applicable alert has no custom, provider-named `legal_disclosure`. */
export const DEFAULT_FINANCIAL_DISCLOSURE =
  'Disclosure: crazy4points is not affiliated with, sponsored by, or endorsed by the ' +
  'providers mentioned, and we earn nothing if you sign up unless a link is clearly ' +
  'marked as affiliate. This is information, not financial, tax, or investment advice, ' +
  'and it is not a recommendation to open any account, deposit funds, or apply for any ' +
  'product. Bonuses, rates, and terms are set by the provider and can change at any time, ' +
  'so confirm the current details on the official site before you act. Consider your own ' +
  'situation and consult a licensed professional before making a financial decision.'

/** The disclosure text an applicable alert will actually show (custom or default),
 *  or null when the alert needs no financial disclosure. */
export function resolveDisclosure(
  type: AlertType,
  offerUrl: string | null | undefined,
  custom: string | null | undefined,
): string | null {
  if (custom && custom.trim()) return custom.trim()
  return needsFinancialDisclosure(type, offerUrl) ? DEFAULT_FINANCIAL_DISCLOSURE : null
}
