/**
 * Firecrawl /scrape wrapper — returns clean markdown for JS-heavy pages
 * that the plain-fetch path can't see (Chase, Amex, airline rewards portals).
 *
 * Docs: https://docs.firecrawl.dev/api-reference/endpoint/scrape
 *
 * Returns empty string on missing key, timeout, or any non-OK response so the
 * caller can transparently fall back to a plain fetch.
 */
export async function fetchFirecrawl(url: string, maxChars = 4000): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    console.warn('[firecrawl] FIRECRAWL_API_KEY not set — skipping Firecrawl fetch')
    return ''
  }

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 25000,
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn(`[firecrawl] ${url} returned ${res.status}: ${body.slice(0, 200)}`)
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
