/**
 * Firecrawl /scrape wrapper — returns clean markdown for JS-heavy pages
 * that the plain-fetch path can't see (Chase, Amex, airline rewards portals).
 *
 * Docs: https://docs.firecrawl.dev/api-reference/endpoint/scrape
 *
 * Returns a discriminated union so callers can differentiate failure modes:
 * a bot-wall result should trigger a stealth retry, while `no_api_key` or
 * `timeout` should not. The old API (returning '' on every failure)
 * collapsed 6 distinct failure modes into one — Scout couldn't decide when
 * to retry.
 *
 * INTERACTIVE MODE
 * Pass `actions` to interact with the page before extracting markdown.
 * Used for issuer pages that hide benefits behind accordions, tabs, or
 * "Show more" links. Default action set in fetchFirecrawlInteractive()
 * expands `<details>` elements and clicks common reveal buttons.
 */

export type FirecrawlAction =
  | { type: 'wait'; milliseconds: number }
  | { type: 'click'; selector: string }
  | { type: 'write'; selector: string; text: string }
  | { type: 'executeJavascript'; script: string }
  | { type: 'scroll'; direction: 'up' | 'down' }
  | { type: 'press'; key: string }
  | { type: 'screenshot' }

export type FirecrawlOptions = {
  maxChars?: number
  actions?: FirecrawlAction[]
  /** Custom timeout override (default 30s plain, 60s with actions) */
  timeoutMs?: number
  /**
   * Stealth mode bypasses common anti-bot redirects (e.g. Delta's
   * "sorry-server" trap). Uses Firecrawl's residential proxy + fingerprint
   * randomization. Slower (~2-3x) + paid feature; only enable for known
   * hostile domains.
   */
  stealth?: boolean
  /**
   * Default true. When false, Firecrawl returns the FULL page including
   * footer, nav, and sections it normally classifies as boilerplate.
   *
   * Why this matters (Sleuth, 2026-05-18): Chase business product pages
   * (e.g. creditcards.chase.com/business-credit-cards/ink/cash) render
   * the "Travel & purchase coverage" section as STATIC HTML — no
   * accordion — but Firecrawl's main-content heuristic strips it as
   * boilerplate. WebFetch's HTML-to-markdown sees the content fine on
   * the same URL. Set `onlyMainContent: false` for these pages.
   */
  onlyMainContent?: boolean
  /**
   * Default ['markdown']. When ['markdown','rawHtml'] (or just ['rawHtml']),
   * the response includes the raw page HTML so the caller can re-derive
   * text Firecrawl's markdown converter dropped. Used by the Chase
   * business fallback in extractCardBenefits — when markdown comes back
   * thin, the raw HTML is stripped to text and concatenated.
   */
  formats?: Array<'markdown' | 'rawHtml' | 'html' | 'screenshot'>
}

export type FirecrawlFailReason =
  | 'no_api_key'
  | 'timeout'
  | 'bot_wall'
  | 'empty'
  | 'redirect_trap'
  | 'error'

export type FirecrawlResult =
  | { ok: true; markdown: string; rawHtml?: string }
  | { ok: false; reason: FirecrawlFailReason; message?: string }

export async function fetchFirecrawl(
  url: string,
  optionsOrMaxChars: FirecrawlOptions | number = {},
): Promise<FirecrawlResult> {
  // Back-compat: callers that passed `maxChars` as a number still work.
  const options: FirecrawlOptions =
    typeof optionsOrMaxChars === 'number'
      ? { maxChars: optionsOrMaxChars }
      : optionsOrMaxChars
  const maxChars = options.maxChars ?? 4000

  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    console.warn('[firecrawl] FIRECRAWL_API_KEY not set — skipping Firecrawl fetch')
    return { ok: false, reason: 'no_api_key' }
  }

  const hasActions = options.actions && options.actions.length > 0
  const timeoutMs = options.timeoutMs ?? (hasActions ? 60_000 : 30_000)
  // Internal Firecrawl timeout (always lower than our abort signal)
  const firecrawlTimeout = Math.max(15_000, timeoutMs - 5_000)

  try {
    const formats = options.formats ?? ['markdown']
    const onlyMainContent = options.onlyMainContent ?? true
    const body: Record<string, unknown> = {
      url,
      formats,
      onlyMainContent,
      // waitFor 3s: many big-brand sites (delta.com, marriott.com) render
      // hero content via JS post-load. Without a wait, Firecrawl captures
      // the skeleton + bot-detection redirect script before content lands.
      // Firecrawl's own debug AI recommended this for delta.com.
      waitFor: 3000,
      // maxAge 0: bypass Firecrawl's response cache. Without this, an
      // earlier sorry-server response can get served as the "cached"
      // answer for the same URL on subsequent calls — extraction would
      // never recover from a single bot redirect.
      maxAge: 0,
      timeout: firecrawlTimeout,
    }
    if (hasActions) {
      body.actions = options.actions
    }
    if (options.stealth) {
      // Firecrawl's stealth proxy (residential IP + fingerprint randomization).
      // Use 'auto' so plans without dedicated stealth fall back gracefully
      // to basic instead of erroring out.
      body.proxy = 'auto'
    }

    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      const snippet = errBody.slice(0, 200)
      console.warn(`[firecrawl] ${url} returned ${res.status}: ${snippet}`)
      // 403/429/503 frequently signal bot walls (Akamai, Cloudflare, etc.).
      // Mark these so the caller can retry with stealth proxy.
      if (res.status === 403 || res.status === 429 || res.status === 503) {
        return { ok: false, reason: 'bot_wall', message: `HTTP ${res.status}: ${snippet}` }
      }
      return { ok: false, reason: 'error', message: `HTTP ${res.status}: ${snippet}` }
    }

    const json = (await res.json()) as {
      success?: boolean
      data?: {
        markdown?: string
        rawHtml?: string
        html?: string
        metadata?: { sourceURL?: string; url?: string; statusCode?: number }
      }
    }
    const markdown = json.data?.markdown ?? ''
    const rawHtml = json.data?.rawHtml ?? json.data?.html ?? ''
    if (!json.success || (!markdown && !rawHtml)) {
      console.warn(`[firecrawl] ${url} returned no markdown/html payload`)
      return { ok: false, reason: 'empty', message: 'no markdown/html payload' }
    }

    // Detect anti-bot redirect traps. If the final URL contains marker tokens
    // ("sorry", "blocked", "captcha", "access-denied"), treat as a scrape
    // failure rather than letting the trap page's content flow downstream.
    const finalUrl = json.data?.metadata?.sourceURL || json.data?.metadata?.url || ''
    const TRAP_MARKERS = /sorry|blocked|captcha|access[-_]denied|bot[-_]check|incident/i
    if (finalUrl && TRAP_MARKERS.test(finalUrl) && finalUrl !== url) {
      console.warn(`[firecrawl] ${url} redirected to anti-bot trap: ${finalUrl}`)
      return { ok: false, reason: 'redirect_trap', message: `redirected to ${finalUrl}` }
    }

    const result: { ok: true; markdown: string; rawHtml?: string } = {
      ok: true,
      markdown: markdown.slice(0, maxChars),
    }
    if (rawHtml) {
      // rawHtml is bigger than markdown; allow up to 4x maxChars so callers
      // have enough surface to grep through for content the markdown
      // converter dropped. Callers that don't want it just ignore the field.
      result.rawHtml = rawHtml.slice(0, maxChars * 4)
    }
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[firecrawl] ${url} fetch error:`, err)
    // AbortSignal.timeout fires a DOMException with name "TimeoutError".
    if (err instanceof Error && (err.name === 'TimeoutError' || /timeout/i.test(message))) {
      return { ok: false, reason: 'timeout', message }
    }
    return { ok: false, reason: 'error', message }
  }
}

/**
 * Standard "expand-everything" action set for issuer product pages.
 *
 * SAFE MODE: only opens native <details> and clicks <button> elements that
 * are clearly expand-toggles (not submit/reset buttons). Does NOT click:
 *   - <a> anchors (they navigate to other pages — broke Citi extraction
 *     by navigating to the cards listing page)
 *   - [role="button"] on non-button elements (often hidden navigation)
 *   - aria-expanded=false on anything that isn't a <button> (the same)
 *
 * Run after a 1.5s initial wait to let dynamic content load first.
 */
export const EXPAND_EVERYTHING_ACTIONS: FirecrawlAction[] = [
  { type: 'wait', milliseconds: 1500 },
  {
    type: 'executeJavascript',
    script: `
      (() => {
        // 1. Open all native <details> — safe, no navigation possible
        document.querySelectorAll('details').forEach((d) => { d.open = true });

        // 2. Click <button> elements ONLY (never anchors).
        //    Exclude submit/reset/navigation buttons.
        const revealRegex = /show\\s*more|view\\s*all|see\\s*all|expand|read\\s*more|view\\s*details|more\\s*info/i;
        document.querySelectorAll('button').forEach((el) => {
          try {
            const type = el.getAttribute('type');
            if (type === 'submit' || type === 'reset') return;
            // Skip buttons with navigation-y data attributes / hrefs
            if (el.dataset.navigate) return;
            const txt = (el.textContent || '').trim();
            if (revealRegex.test(txt)) el.click();
          } catch (e) {}
        });

        // 3. Toggle aria-expanded=false ONLY on <button> elements
        //    (Anchors with role="button" are often nav links in disguise.)
        document.querySelectorAll('button[aria-expanded="false"]').forEach((el) => {
          try { el.click(); } catch (e) {}
        });
      })();
    `,
  },
  { type: 'wait', milliseconds: 2000 },
]

/**
 * AGGRESSIVE expand mode — used for hostile accordion patterns where the
 * standard set misses content (Chase business product pages are the
 * known offender — their "Travel & purchase coverage" section uses a
 * lazy-rendered accordion that doesn't materialize until the user scrolls
 * the section into view, AND the controls aren't <button> elements but
 * `[aria-expanded]` on custom tags with `aria-controls`).
 *
 * Differences from EXPAND_EVERYTHING_ACTIONS:
 *   1. Scrolls down 3x with waits in between to trigger lazy-load.
 *   2. Multi-pass clicks — Chase's accordion re-renders new collapsed
 *      children after the parent expands, so pass 1's button list isn't
 *      the same as pass 3's.
 *   3. Broader selectors: `[aria-expanded="false"]` across ALL non-anchor
 *      tags (not just <button>), `[aria-controls]`, and Chase-y class
 *      hints (`.accordion-trigger`, `.expand-collapse-link`,
 *      `[data-expandable]`).
 *   4. Scrolls back down after expansion in case more collapsed content
 *      was newly rendered.
 *
 * Anti-navigation: the script DELIBERATELY skips <a> tags. Citi extraction
 * broke before when interactive mode navigated the browser away from the
 * product page mid-scrape.
 *
 * Used by the auto-retry in extractCardBenefits when a business card
 * comes back with <3 insurance benefits. Slower (~10-12s vs. ~5s for
 * EXPAND_EVERYTHING_ACTIONS) so it's not the default.
 */
export const AGGRESSIVE_EXPAND_ACTIONS: FirecrawlAction[] = [
  { type: 'wait', milliseconds: 2500 },
  // Pass 1: scroll down to trigger lazy-load
  { type: 'scroll', direction: 'down' },
  { type: 'wait', milliseconds: 1000 },
  { type: 'scroll', direction: 'down' },
  { type: 'wait', milliseconds: 1000 },
  { type: 'scroll', direction: 'down' },
  { type: 'wait', milliseconds: 1500 },
  // Pass 2: aggressive expand on whatever is now in the DOM
  {
    type: 'executeJavascript',
    script: `
      (() => {
        document.querySelectorAll('details').forEach((d) => { d.open = true });

        const isAnchor = (el) => el && el.tagName === 'A';
        const revealRegex = /show\\s*more|view\\s*all|see\\s*all|expand|read\\s*more|view\\s*details|more\\s*info|travel\\s*&?\\s*purchase\\s*coverage|benefits|insurance|protection/i;

        // Expand-text triggers (skip anchors)
        document.querySelectorAll('button, [role="button"]').forEach((el) => {
          try {
            if (isAnchor(el)) return;
            const type = el.getAttribute && el.getAttribute('type');
            if (type === 'submit' || type === 'reset') return;
            if (el.dataset && el.dataset.navigate) return;
            const txt = (el.textContent || '').trim();
            if (revealRegex.test(txt)) el.click();
          } catch (e) {}
        });

        // Any aria-expanded=false control (skip anchors — those navigate)
        document.querySelectorAll('[aria-expanded="false"]').forEach((el) => {
          try {
            if (isAnchor(el)) return;
            el.click();
          } catch (e) {}
        });

        // Chase-y custom patterns
        document.querySelectorAll('[aria-controls]:not(a)').forEach((el) => {
          try {
            const expanded = el.getAttribute('aria-expanded');
            if (expanded === 'false') el.click();
          } catch (e) {}
        });
        document.querySelectorAll('[data-expandable]:not(a), .accordion-trigger:not(a), .expand-collapse-link:not(a)').forEach((el) => {
          try { el.click(); } catch (e) {}
        });
      })();
    `,
  },
  { type: 'wait', milliseconds: 2000 },
  // Pass 3: scroll + re-click, since Chase's accordion re-renders
  // additional collapsed children after the parent expands.
  { type: 'scroll', direction: 'down' },
  { type: 'wait', milliseconds: 1000 },
  {
    type: 'executeJavascript',
    script: `
      (() => {
        document.querySelectorAll('details').forEach((d) => { d.open = true });
        document.querySelectorAll('[aria-expanded="false"]').forEach((el) => {
          try {
            if (el.tagName === 'A') return;
            el.click();
          } catch (e) {}
        });
      })();
    `,
  },
  { type: 'wait', milliseconds: 2000 },
]

/**
 * Convenience: fetch with the default expand-everything action set.
 * Use for issuer pages that hide benefits behind accordions.
 *
 * @param aggressive  When true, uses AGGRESSIVE_EXPAND_ACTIONS (scroll +
 *                    multi-pass clicks + broader selectors) instead of
 *                    the standard set. Used on retry when a business
 *                    card came back with thin insurance data.
 */
export async function fetchFirecrawlInteractive(
  url: string,
  options: Omit<FirecrawlOptions, 'actions'> & { aggressive?: boolean } = {},
): Promise<FirecrawlResult> {
  const { aggressive, ...rest } = options
  const actions = aggressive ? AGGRESSIVE_EXPAND_ACTIONS : EXPAND_EVERYTHING_ACTIONS
  // Aggressive mode runs more actions, so bump the outer timeout to 90s.
  // (Firecrawl's internal timeout is capped at outer - 5s by fetchFirecrawl.)
  const timeoutMs = options.timeoutMs ?? (aggressive ? 90_000 : 60_000)
  return fetchFirecrawl(url, {
    ...rest,
    actions,
    timeoutMs,
  })
}

/**
 * Lightweight HTML-to-text stripper for the rawHtml fallback path.
 *
 * Not a full parser — does NOT preserve structure (headings, lists, links).
 * The goal is to expose text content that Firecrawl's markdown converter
 * dropped (e.g. Chase business "Travel & purchase coverage" benefits) so
 * Sonnet can still see it during extraction.
 *
 * Steps:
 *   1. Drop <script>, <style>, <noscript> blocks entirely.
 *   2. Drop HTML comments.
 *   3. Convert tags to whitespace.
 *   4. Decode the handful of HTML entities that Sonnet trips over (&amp;,
 *      &lt;, &gt;, &quot;, &#39;, &nbsp;).
 *   5. Collapse whitespace.
 *
 * Why not cheerio / jsdom / turndown? We don't have any of those installed
 * and adding a dep for one rescue path isn't worth it. This is intentionally
 * dumb-and-cheap — the worst case is we feed Sonnet some extra raw text;
 * Sonnet handles it fine.
 */
export function htmlToText(html: string): string {
  if (!html) return ''
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/?(br|p|div|li|h[1-6]|tr|td|th|section|article)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

/**
 * Identifies URLs where the issuer ships the benefits section as static
 * HTML that Firecrawl's main-content heuristic strips. Sleuth's
 * investigation (2026-05-18) found Chase business product pages
 * (creditcards.chase.com/business-credit-cards/...) lose the entire
 * "Travel & purchase coverage" section under default Firecrawl settings,
 * even though WebFetch reads the same content fine. Set onlyMainContent
 * to false + request rawHtml as a fallback for these.
 */
export function needsBoilerplateInclusive(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.hostname !== 'creditcards.chase.com') return false
    return u.pathname.startsWith('/business-credit-cards/')
  } catch {
    return false
  }
}

/**
 * Domains known to deploy aggressive bot detection (Akamai, Cloudflare
 * Enterprise, etc.). Scout (and any caller) should pass `stealth: true`
 * on the FIRST call to these domains, not just on retry.
 */
const HOSTILE_DOMAINS = [
  'delta.com',
  'marriott.com',
  'news.marriott.com',
]

/**
 * Returns true if `url` belongs to a known-hostile domain (Akamai, Cloudflare
 * Enterprise, etc). Scout pre-emptively uses stealth on these.
 */
export function isHostileDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return HOSTILE_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
  } catch {
    return false
  }
}

/**
 * Firecrawl /v1/map — returns a list of URLs reachable from a starting page.
 * Used for source-URL discovery before running a program extraction. Sonnet
 * then classifies which URLs map to which extraction fields.
 *
 * Docs: https://docs.firecrawl.dev/api-reference/endpoint/map
 *
 * Returns [] on missing key, timeout, or non-OK response.
 */
export async function mapFirecrawl(
  url: string,
  options: { search?: string; limit?: number; timeoutMs?: number } = {},
): Promise<string[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    console.warn('[firecrawl] FIRECRAWL_API_KEY not set — skipping map fetch')
    return []
  }

  const timeoutMs = options.timeoutMs ?? 30000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        search: options.search,
        limit: options.limit ?? 500,
      }),
    })
    clearTimeout(timer)

    if (!res.ok) {
      console.warn(`[firecrawl /map] non-OK status ${res.status} for ${url}`)
      return []
    }

    const json = (await res.json()) as { links?: string[]; success?: boolean }
    return Array.isArray(json.links) ? json.links : []
  } catch (err) {
    clearTimeout(timer)
    console.warn(`[firecrawl /map] error for ${url}:`, err)
    return []
  }
}
