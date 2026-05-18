/**
 * URL reachability checker for the admin card-extract page.
 *
 * Background: editors were burning 5–15 min per card chasing wrong URLs
 * because the extract form happily submitted against 404 pages, wasting a
 * Sonnet call and surfacing thin "page missing content" results. This
 * utility lets the page show a green/yellow/red badge per configured URL
 * before the editor clicks Run Extraction.
 *
 * Strategy: try HEAD first (cheap), fall back to GET if HEAD is rejected
 * (some issuer CDNs return 405 for HEAD). 5-second timeout via AbortController.
 * Results are cached in-memory for 5 min to keep re-renders cheap; longer and
 * stale URLs slip through.
 */

export type UrlCheckResult =
  | { ok: true; status: number }
  | { ok: true; status: number; redirectedTo: string }
  | {
      ok: false
      status: number
      reason: 'not_found' | 'forbidden' | 'server_error' | 'unreachable' | 'timeout'
    }

type CacheEntry = { result: UrlCheckResult; expiresAt: number }
const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map<string, CacheEntry>()

function cacheGet(url: string): UrlCheckResult | null {
  const entry = cache.get(url)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(url)
    return null
  }
  return entry.result
}

function cacheSet(url: string, result: UrlCheckResult): void {
  cache.set(url, { result, expiresAt: Date.now() + CACHE_TTL_MS })
}

function classifyStatus(
  status: number,
): { ok: true; status: number } | { ok: false; status: number; reason: 'not_found' | 'forbidden' | 'server_error' } {
  if (status >= 200 && status < 400) return { ok: true, status }
  if (status === 403 || status === 401) return { ok: false, status, reason: 'forbidden' }
  if (status >= 500) return { ok: false, status, reason: 'server_error' }
  return { ok: false, status, reason: 'not_found' }
}

async function doFetch(url: string, method: 'HEAD' | 'GET', timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      // A real-browser UA so issuers don't reject bot HEADs out of hand.
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function checkUrl(url: string, timeoutMs = 5000): Promise<UrlCheckResult> {
  const cached = cacheGet(url)
  if (cached) return cached

  // Defensive — empty / non-http URLs shouldn't reach here, but if they do,
  // mark them unreachable rather than throwing.
  if (!url || !/^https?:\/\//i.test(url)) {
    const result: UrlCheckResult = { ok: false, status: 0, reason: 'unreachable' }
    cacheSet(url, result)
    return result
  }

  try {
    let res: Response
    try {
      res = await doFetch(url, 'HEAD', timeoutMs)
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') {
        const result: UrlCheckResult = { ok: false, status: 0, reason: 'timeout' }
        cacheSet(url, result)
        return result
      }
      throw e
    }

    // 405 / 501 = server doesn't support HEAD. Retry with GET.
    if (res.status === 405 || res.status === 501) {
      try {
        res = await doFetch(url, 'GET', timeoutMs)
      } catch (e) {
        if ((e as { name?: string }).name === 'AbortError') {
          const result: UrlCheckResult = { ok: false, status: 0, reason: 'timeout' }
          cacheSet(url, result)
          return result
        }
        throw e
      }
    }

    const classified = classifyStatus(res.status)
    let result: UrlCheckResult
    if (classified.ok) {
      // res.url reflects the final URL after redirect:'follow'.
      const finalUrl = res.url
      if (finalUrl && finalUrl !== url) {
        result = { ok: true, status: res.status, redirectedTo: finalUrl }
      } else {
        result = { ok: true, status: res.status }
      }
    } else {
      result = classified
    }
    cacheSet(url, result)
    return result
  } catch {
    const result: UrlCheckResult = { ok: false, status: 0, reason: 'unreachable' }
    cacheSet(url, result)
    return result
  }
}

/**
 * Convenience for the extract page — checks all configured card URLs in
 * parallel. Null/empty entries short-circuit to a "skipped" marker (no
 * network call). Returns a parallel-keyed object so the caller can render
 * status inline next to each URL.
 */
export type UrlChecks = {
  official_url: UrlCheckResult | null
  guide_to_benefits_url: UrlCheckResult | null
  pricing_terms_url: UrlCheckResult | null
  rotating_categories_url: UrlCheckResult | null
}

export async function checkCardUrls(urls: {
  official_url: string | null
  guide_to_benefits_url: string | null
  pricing_terms_url: string | null
  rotating_categories_url: string | null
}): Promise<UrlChecks> {
  const [official, guide, pricing, rotating] = await Promise.all([
    urls.official_url ? checkUrl(urls.official_url) : Promise.resolve(null),
    urls.guide_to_benefits_url ? checkUrl(urls.guide_to_benefits_url) : Promise.resolve(null),
    urls.pricing_terms_url ? checkUrl(urls.pricing_terms_url) : Promise.resolve(null),
    urls.rotating_categories_url ? checkUrl(urls.rotating_categories_url) : Promise.resolve(null),
  ])
  return {
    official_url: official,
    guide_to_benefits_url: guide,
    pricing_terms_url: pricing,
    rotating_categories_url: rotating,
  }
}

export function hasAnyBrokenUrl(checks: UrlChecks): boolean {
  return Object.values(checks).some((r) => r !== null && !r.ok)
}
