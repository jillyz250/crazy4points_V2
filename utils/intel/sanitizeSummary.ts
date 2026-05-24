/**
 * Strip scraped-page noise out of a candidate alert summary.
 *
 * Sources upstream of `alerts.summary`:
 *   • `app/api/ingest-intel/route.ts` — sets summary = raw_text.slice(0, 300)
 *     when staging from Claude Scout. raw_text frequently starts with
 *     navigation/footer text from the source blog (Frequent Miler,
 *     OMAAT, View From the Wing). Without a sanitizer the summary that
 *     appears in the editor (and gets published if the editor doesn't
 *     catch it) reads like "back to top[Facebook](https://...)..." —
 *     visible to subscribers, the exact thing Jill flagged 2026-05-24.
 *
 *   • `app/admin/(protected)/triage/actions.ts` (stageAlertFromCandidate)
 *     uses headline directly (clean) — but we still run the sanitizer
 *     in case future paths reintroduce raw_text.
 *
 * The sanitizer is intentionally conservative: it strips the noise
 * patterns we've seen IRL, then trims/truncates. If the result is too
 * short to be useful, return null so callers fall back to the
 * headline.
 */

const STRIP_PATTERNS: RegExp[] = [
  // Markdown link: [text](url) — leaves nothing
  /\[[^\]]*\]\([^)]*\)/g,
  // Bare URLs
  /https?:\/\/\S+/g,
  // Common blog nav cruft
  /\bback to top\b/gi,
  /\bskip to content\b/gi,
  /\bshare this article\b/gi,
  /\bsubscribe to our newsletter\b/gi,
  // Social-icon labels left over after stripping their links
  /\b(facebook|twitter|x|threads|instagram|linkedin|pinterest|youtube|tiktok)\b\s*[·•|]+\s*/gi,
  // Standalone "image" / "image caption" boilerplate
  /\bimage:[^.]*\./gi,
  // Markdown headings at start of paragraph
  /^#{1,6}\s+/gm,
]

const MIN_USEFUL_LENGTH = 30

/**
 * Sanitize a candidate summary string. Returns the cleaned string, or
 * null if cleaning leaves it shorter than {@link MIN_USEFUL_LENGTH}.
 */
export function sanitizeSummary(input: string | null | undefined): string | null {
  if (!input) return null
  let s = String(input)

  for (const pat of STRIP_PATTERNS) {
    s = s.replace(pat, ' ')
  }

  // Collapse repeated whitespace, normalize spacing around punctuation
  s = s.replace(/\s+/g, ' ').trim()
  // Drop leading punctuation residue
  s = s.replace(/^[\s\-·•|,.;:]+/, '').trim()

  if (s.length < MIN_USEFUL_LENGTH) return null

  // Truncate to 300 chars at a word boundary
  if (s.length > 300) {
    const cut = s.slice(0, 300)
    const lastSpace = cut.lastIndexOf(' ')
    s = (lastSpace > 200 ? cut.slice(0, lastSpace) : cut).trim() + '…'
  }

  return s
}

/**
 * Hard predicate for the publish gate. Returns true if the summary
 * still contains markers we never want shipped to subscribers, no
 * matter what.
 *
 * Used by publishAlertAction to refuse publish when the summary is
 * obviously broken. Editor will see a clear error and have to fix the
 * summary before retrying.
 */
export function summaryContainsScrapeNoise(input: string | null | undefined): boolean {
  if (!input) return false
  const s = String(input)
  if (/https?:\/\//i.test(s)) return true
  if (/\]\(/.test(s)) return true // markdown link bracket
  if (/\bback to top\b/i.test(s)) return true
  return false
}
