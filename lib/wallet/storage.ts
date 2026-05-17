/**
 * localStorage abstraction for the wallet.
 *
 * v0 stores everything in the browser (no auth). Single JSON blob under a
 * stable key. Schema-versioned so we can migrate later when we add account-
 * backed sync.
 */

import type { PeriodKey } from './periods'

const STORAGE_KEY = 'crazy4points.wallet.v1'

export interface WalletState {
  schemaVersion: 1
  /** Card slugs the user owns. */
  selectedCards: string[]
  /** benefit_id → period_key → ISO timestamp when marked used. */
  usage: Record<string, Record<PeriodKey, string>>
  /** benefit_id → YYYY-MM-DD expiration date (for free night certs). */
  certExpirations: Record<string, string>
}

export function emptyState(): WalletState {
  return {
    schemaVersion: 1,
    selectedCards: [],
    usage: {},
    certExpirations: {},
  }
}

export function loadWalletState(): WalletState {
  if (typeof window === 'undefined') return emptyState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as WalletState
    // Defensive — handle older or malformed shapes
    return {
      schemaVersion: 1,
      selectedCards: Array.isArray(parsed.selectedCards) ? parsed.selectedCards : [],
      usage: typeof parsed.usage === 'object' && parsed.usage !== null ? parsed.usage : {},
      certExpirations:
        typeof parsed.certExpirations === 'object' && parsed.certExpirations !== null
          ? parsed.certExpirations
          : {},
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
    // Storage full / blocked — silently swallow; user can re-toggle later
  }
}

export function toggleUsage(
  state: WalletState,
  benefitId: string,
  periodKey: PeriodKey,
): WalletState {
  const next = { ...state, usage: { ...state.usage } }
  const benefitMap = { ...(next.usage[benefitId] ?? {}) }
  if (benefitMap[periodKey]) {
    delete benefitMap[periodKey]
  } else {
    benefitMap[periodKey] = new Date().toISOString()
  }
  if (Object.keys(benefitMap).length === 0) {
    delete next.usage[benefitId]
  } else {
    next.usage[benefitId] = benefitMap
  }
  return next
}

export function setSelectedCards(state: WalletState, slugs: string[]): WalletState {
  return { ...state, selectedCards: Array.from(new Set(slugs)) }
}

export function setCertExpiration(
  state: WalletState,
  benefitId: string,
  expiration: string | null,
): WalletState {
  const next = { ...state, certExpirations: { ...state.certExpirations } }
  if (!expiration) {
    delete next.certExpirations[benefitId]
  } else {
    next.certExpirations[benefitId] = expiration
  }
  return next
}
