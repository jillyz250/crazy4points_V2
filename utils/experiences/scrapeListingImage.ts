/**
 * Scrape a hero image for an experience listing from its detail page.
 *
 * The 8 source platforms (Amex, Hyatt FIND, Atmos Unlocked, Delta, United,
 * Accor, Wyndham, Hilton) each render differently, so this is generic-first:
 * prefer og:image / twitter:image (present on most), fall back to the first
 * substantial image in the page markdown, and filter out logos/branding/
 * placeholders (incl. Atmos's generic "atmos_open" brand card).
 *
 * Returns the best image URL, or null (no usable image / scrape failed).
 * Detection-only helper — the caller writes it to experience_listings.image_url.
 */
const BAD_IMAGE = /logo|icon|sprite|avatar|placeholder|favicon|badge|\/brand|pixel|1x1|spacer|atmos_open|_open_|default|share-image|og-default|bookends|ios@2x|\/hds\//i

export async function scrapeListingImage(detailUrl: string): Promise<string | null> {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key || !detailUrl || !/^https?:\/\//.test(detailUrl)) return null
  let j: unknown
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      // waitFor lets JS-rendered pages (e.g. Hyatt FIND) paint their hero before capture
      body: JSON.stringify({ url: detailUrl, formats: ['markdown'], timeout: 30000, waitFor: 2500 }),
    })
    j = await res.json()
  } catch {
    return null
  }
  const data = (j as { data?: { metadata?: Record<string, unknown>; markdown?: string } })?.data ?? {}
  const meta = data.metadata ?? {}
  const md = data.markdown ?? ''

  const candidates: string[] = []
  for (const k of ['ogImage', 'og:image', 'twitterImage', 'twitter:image', 'image']) {
    const v = meta[k]
    if (typeof v === 'string' && /^https?:\/\//.test(v)) candidates.push(v)
    else if (Array.isArray(v) && typeof v[0] === 'string') candidates.push(v[0])
  }
  for (const m of md.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+\.(?:jpg|jpeg|png|webp|avif)[^)\s]*)\)/gi)) {
    candidates.push(m[1])
  }

  const good = candidates.find((u) => !BAD_IMAGE.test(u))
  return good ?? null
}
