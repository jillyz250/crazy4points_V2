/**
 * localStorage abstraction for the wallet.
 *
 * Schema v2: shifts from binary used/unused to a running-balance model.
 *
 *   - `uses[benefit_id][period_key]` is now an ARRAY of use-records, each
 *     with an amount + date + optional note. Sum the amounts and subtract
 *     from the benefit's pool ($10/mo, $150/H1, $300/yr, etc.) to get
 *     remaining balance.
 *   - `certs[benefit_id]` carries both issued AND expiration dates for
 *     free-night-style benefits.
 *
 * v1 data is dropped on load (no real users yet — only dogfooding).
 */

import type { PeriodKey } from './periods'

const STORAGE_KEY = 'crazy4points.wallet.v2'
const LEGACY_KEYS = ['crazy4points.wallet.v1']

export interface UseRecord {
  /** Dollar amount of this single use (e.g. $57 for a StubHub ticket). */
  amount: number
  /** ISO date (YYYY-MM-DD) the user logged the purchase. */
  date: string
  /** Optional free-text note (e.g. "Wicked, Broadway"). */
  note?: string
  /** Internal id so we can edit/delete individual rows. */
  id: string
}

export interface CertRecord {
  /** ISO date the user received the certificate (e.g. anniversary). */
  issuedAt?: string
  /** ISO date the certificate expires (issuer-stated). */
  expiresAt?: string
  /** Free-text note (e.g. "Used at Hyatt Centric Las Vegas 8/4"). */
  note?: string
}

export interface WalletState {
  schemaVersion: 2
  selectedCards: string[]
  /** benefit_id → period_key → list of use records logged in that period. */
  uses: Record<string, Record<PeriodKey, UseRecord[]>>
  /** benefit_id → free-night-style cert tracking. */
  certs: Record<string, CertRecord>
}

export function emptyState(): WalletState {
  return {
    schemaVersion: 2,
    selectedCards: [],
    uses: {},
    certs: {},
  }
}

export function loadWalletState(): WalletState {
  if (typeof window === 'undefined') return emptyState()
  try {
    // Drop any v1 data — no real users yet
    for (const k of LEGACY_KEYS) window.localStorage.removeItem(k)

    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as WalletState
    return {
      schemaVersion: 2,
      selectedCards: Array.isArray(parsed.selectedCards) ? parsed.selectedCards : [],
      uses: typeof parsed.uses === 'object' && parsed.uses !== null ? parsed.uses : {},
      certs: typeof parsed.certs === 'object' && parsed.certs !== null ? parsed.certs : {},
    }
  } catch {
    return emptyState()
  }
}

export function saveWalletState(state: WalletState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full / blocked — silently swallow
  }
}

export function setSelectedCards(state: WalletState, slugs: string[]): WalletState {
  return { ...state, selectedCards: Array.from(new Set(slugs)) }
}

function freshId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function logUse(
  state: WalletState,
  benefitId: string,
  periodKey: PeriodKey,
  amount: number,
  date: string,
  note?: string,
): WalletState {
  const next = { ...state, uses: { ...state.uses } }
  const benefitMap = { ...(next.uses[benefitId] ?? {}) }
  const list = [...(benefitMap[periodKey] ?? [])]
  list.push({ id: freshId(), amount, date, note: note?.trim() || undefined })
  benefitMap[periodKey] = list
  next.uses[benefitId] = benefitMap
  return next
}

export function deleteUse(
  state: WalletState,
  benefitId: string,
  periodKey: PeriodKey,
  useId: string,
): WalletState {
  const next = { ...state, uses: { ...state.uses } }
  const benefitMap = { ...(next.uses[benefitId] ?? {}) }
  const list = (benefitMap[periodKey] ?? []).filter((u) => u.id !== useId)
  if (list.length === 0) {
    delete benefitMap[periodKey]
  } else {
    benefitMap[periodKey] = list
  }
  if (Object.keys(benefitMap).length === 0) {
    delete next.uses[benefitId]
  } else {
    next.uses[benefitId] = benefitMap
  }
  return next
}

export function setCert(
  state: WalletState,
  benefitId: string,
  patch: Partial<CertRecord>,
): WalletState {
  const next = { ...state, certs: { ...state.certs } }
  const current = next.certs[benefitId] ?? {}
  const merged = { ...current, ...patch }
  // Drop empty-string fields so the row is "clean" when user clears it
  if (!merged.issuedAt && !merged.expiresAt && !merged.note) {
    delete next.certs[benefitId]
  } else {
    next.certs[benefitId] = merged
  }
  return next
}

export function sumUses(records: UseRecord[] | undefined): number {
  if (!records) return 0
  return records.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
}
