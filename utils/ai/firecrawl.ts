/**
 * Firecrawl /scrape wrapper — returns clean markdown for JS-heavy pages
 * that the plain-fetch path can't see (Chase, Amex, airline rewards portals).
 *
 * Docs: https://docs.firecrawl.dev/api-reference/endpoint/scrape
 *
 * Returns empty string on missing key, timeout, or any non-OK response so the
 * caller can transparently fall back to a plain fetch.
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
}

export async function fetchFirecrawl(
  url: string,
  optionsOrMaxChars: FirecrawlOptions | number = {},
): Promise<string> {
  // Back-compat: callers that passed `maxChars` as a number still work.
  const options: FirecrawlOptions =
    typeof optionsOrMaxChars === 'number'
      ? { maxChars: optionsOrMaxChars }
      : optionsOrMaxChars
  const maxChars = options.maxChars ?? 4000

  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    console.warn('[firecrawl] FIRECRAWL_API_KEY not set — skipping Firecrawl fetch')
    return ''
  }

  const hasActions = options.actions && options.actions.length > 0
  const timeoutMs = options.timeoutMs ?? (hasActions ? 60_000 : 30_000)
  // Internal Firecrawl timeout (always lower than our abort signal)
  const firecrawlTimeout = Math.max(15_000, timeoutMs - 5_000)

  try {
    const body: Record<string, unknown> = {
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      timeout: firecrawlTimeout,
    }
    if (hasActions) {
      body.actions = options.actions
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
      console.warn(`[firecrawl] ${url} returned ${res.status}: ${errBody.slice(0, 200)}`)
      return ''
    }

    const json = (await res.json()) as { success?: boolean; data?: { markdown?: string } }
    if (!json.success || !json.data?.markdown) {
      console.warn(`[firecrawl] ${url} returned no markdown payload`)
      return ''
    }

    return json.data.markdown.slice(0, maxChars)
  } catch (err) {
    console.warn(`[firecrawl] ${url} fetch error:`, err)
    return ''
  }
}

/**
 * Standard "expand-everything" action set for issuer product pages.
 * - Opens all <details> elements
 * - Clicks buttons/links labeled Show more / View all / See all / Expand
 * - Toggles aria-expanded=false elements
 * - Then waits 2s for any expansions to render
 *
 * Run after a 1.5s initial wait to let dynamic content load first.
 */
export const EXPAND_EVERYTHING_ACTIONS: FirecrawlAction[] = [
  { type: 'wait', milliseconds: 1500 },
  {
    type: 'executeJavascript',
    script: `
      (() => {
        // Open all native <details>
        document.querySelectorAll('details').forEach((d) => { d.open = true });
        // Click reveal buttons by text
        const revealRegex = /show\\s*more|view\\s*all|see\\s*all|expand|read\\s*more|view\\s*details|more\\s*info/i;
        document.querySelectorAll('button, a, [role="button"]').forEach((el) => {
          try {
            const txt = (el.textContent || '').trim();
            if (revealRegex.test(txt) && el.click) el.click();
          } catch (e) {}
        });
        // Toggle aria-expanded=false elements
        document.querySelectorAll('[aria-expanded="false"]').forEach((el) => {
          try { if (el.click) el.click(); } catch (e) {}
        });
      })();
    `,
  },
  { type: 'wait', milliseconds: 2000 },
]

/**
 * Convenience: fetch with the default expand-everything action set.
 * Use for issuer pages that hide benefits behind accordions.
 */
export async function fetchFirecrawlInteractive(
  url: string,
  options: Omit<FirecrawlOptions, 'actions'> = {},
): Promise<string> {
  return fetchFirecrawl(url, {
    ...options,
    actions: EXPAND_EVERYTHING_ACTIONS,
  })
}
