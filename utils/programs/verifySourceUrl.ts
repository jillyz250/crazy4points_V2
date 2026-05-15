/**
 * Pre-flight URL verification — saves Firecrawl + Sonnet credits when a URL
 * is stale (404), behind auth, or redirects to a different page.
 *
 * Strategy:
 *   1. HEAD request with redirect follow + 8s timeout
 *   2. If HEAD is blocked (some sites do), fall back to a small GET Range
 *   3. Return final URL after redirects so the caller can store the canonical
 *
 * Cost: one HTTP request, no API spend. Saves ~$0.12 + ~30s when a URL is dead.
 */

export type VerifyResult =
  | { ok: true; finalUrl: string; status: number; redirected: boolean }
  | { ok: false; error: string; status?: number }

const UA = 'Mozilla/5.0 (compatible; crazy4points-extractor/1.0; +https://crazy4points.com)'

export async function verifySourceUrl(url: string): Promise<VerifyResult> {
  // Quick sanity check on URL shape
  try {
    new URL(url)
  } catch {
    return { ok: false, error: `Invalid URL syntax: ${url}` }
  }

  // Attempt 1: HEAD with redirect follow
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': UA },
    })

    if (res.status === 405 || res.status === 403) {
      // HEAD not allowed or blocked — fall through to GET fallback
    } else if (res.status >= 400) {
      return {
        ok: false,
        error: `URL returned HTTP ${res.status}. Check that the page still exists.`,
        status: res.status,
      }
    } else {
      return {
        ok: true,
        finalUrl: res.url,
        status: res.status,
        redirected: normalizeUrl(res.url) !== normalizeUrl(url),
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('AbortError') || message.includes('timeout')) {
      // Many big airline / hotel sites (united.com, marriott.com) block
      // direct HEAD requests but ARE reachable through Firecrawl. Don't
      // hard-fail on timeout — let Firecrawl be the source of truth.
      return {
        ok: true,
        finalUrl: url,
        status: 0,
        redirected: false,
      }
    }
    // Network error — fall through to GET fallback before giving up
  }

  // Attempt 2: GET with small Range header (many CDNs allow this when HEAD is blocked)
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': UA,
        'Range': 'bytes=0-1023',
      },
    })

    if (res.status >= 400 && res.status !== 416) {
      // 416 = Range Not Satisfiable; treat as a 200 since the URL exists
      return {
        ok: false,
        error: `URL returned HTTP ${res.status}. Check that the page still exists.`,
        status: res.status,
      }
    }

    return {
      ok: true,
      finalUrl: res.url,
      status: res.status,
      redirected: normalizeUrl(res.url) !== normalizeUrl(url),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('AbortError') || message.includes('timeout')) {
      // Same soft-pass on GET timeout — let Firecrawl decide.
      return {
        ok: true,
        finalUrl: url,
        status: 0,
        redirected: false,
      }
    }
    return { ok: false, error: `Could not verify URL: ${message}` }
  }
}

/** Strip trailing slash + protocol + query for redirect comparison. */
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    return `${u.host}${u.pathname.replace(/\/$/, '')}`.toLowerCase()
  } catch {
    return url
  }
}
