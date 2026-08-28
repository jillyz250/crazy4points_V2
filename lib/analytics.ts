declare global {
  interface Window {
    gtag?: (command: 'event' | 'config' | 'js', eventName: string, params?: Record<string, unknown>) => void
    dataLayer?: unknown[]
    fbq?: (...args: unknown[]) => void
  }
}

/** Live production host only (not localhost / Vercel previews). Unlike
 *  isTrackableHost this does NOT require gtag, so the Meta pixel can fire
 *  even when GA is unavailable. */
function isLiveHost(): boolean {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  if (!h || h === 'localhost' || h.startsWith('127.') || h === '0.0.0.0' || h.endsWith('.vercel.app')) return false
  return true
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
  if (typeof window === 'undefined') return
  if (isTrackableHost()) {
    window.gtag!('event', name, { transport_type: 'beacon', ...params })
  }
  // Mirror a newsletter signup to the Meta pixel as a 'Lead' conversion, so paid
  // campaigns can measure + optimize toward signups (and build a retargeting base).
  // Consent-gated: fbq only exists once the visitor accepted analytics cookies.
  if (name === 'newsletter_signup' && isLiveHost() && typeof window.fbq === 'function') {
    window.fbq('track', 'Lead', {
      content_name: params?.surface ?? 'newsletter',
      content_category: params?.campaign ?? 'site',
    })
  }
}
