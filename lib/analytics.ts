declare global {
  interface Window {
    gtag?: (command: 'event' | 'config' | 'js', eventName: string, params?: Record<string, unknown>) => void
    dataLayer?: unknown[]
  }
}

/**
 * True only on the real production domain. Skips local dev (localhost,
 * 127.0.0.1) and Vercel preview deploys (*.vercel.app) so test clicks
 * never pollute the live GA4 property.
 */
function isTrackableHost(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof window.gtag !== 'function') return false
  const h = window.location.hostname
  if (!h) return false
  if (h === 'localhost' || h.startsWith('127.') || h === '0.0.0.0') return false
  if (h.endsWith('.vercel.app')) return false
  return true
}

/** Fire a GA4 custom event. No-op on local dev / Vercel previews.
 *  `transport_type: 'beacon'` ensures the request survives the click→
 *  navigate race on outbound and internal-card clicks. */
export function track(name: string, params?: Record<string, unknown>): void {
  if (!isTrackableHost()) return
  window.gtag!('event', name, { transport_type: 'beacon', ...params })
}
