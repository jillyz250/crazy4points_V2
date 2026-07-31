/**
 * Outbound link audit — finds reader-facing links that have gone dead.
 *
 * WHY THIS IS CONTENT-BASED, NOT STATUS-BASED
 * An HTTP status alone cannot tell a dead page from bot-blocking. When Accor
 * retired their experiences URL it returned 403 — exactly what Flying Blue and
 * Marriott Moments return, and those are perfectly healthy. Auditing on status
 * codes therefore either misses real breakages or cries wolf on working links.
 *
 * So we fetch the page and look for the fingerprints of an actual error page
 * ("Page not found", "AccessDenied", a 4xx with almost no body). That is what
 * separated 5 genuine breakages from 2 false alarms in the manual sweep on
 * 2026-07-20. The bias is deliberately toward SILENCE: a link is only reported
 * when the page itself says it is gone, because a noisy audit gets ignored.
 *
 * THE BOT-WALL ESCALATION (added 2026-07-31)
 * A plain node fetch cannot reach Akamai/Cloudflare-walled travel sites at all —
 * it simply throws ("unreachable"). On 2026-07-31 that path produced 6 false
 * alarms out of 7 (Emirates, Flying Blue, Choice, Qatar x2, Asiana were all
 * live in a real browser; only Turkish's award-tickets URL was truly 404). So a
 * plain-fetch failure — a thrown error OR a bare 4xx with no dead-page text — is
 * NEVER reported on its own. Instead we escalate that one URL to Firecrawl, which
 * renders like a browser, and report it dead only when Firecrawl confirms a
 * 404/410 or a dead-page marker. This keeps the silence bias (bot walls no
 * longer cry wolf) while still catching genuine deaths a plain fetch can't see.
 *
 * Deliberately kept out of runIntegrityChecks(), which is documented as cheap,
 * deterministic and network-free — the daily digest runs those live.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export interface LinkFinding {
  /** Where the link lives, e.g. "affiliate", "card official", "experience". */
  kind: string
  /** Human name of the owning record. */
  name: string
  url: string
  status: number | 'ERR'
  reason: string
}

interface Target {
  kind: string
  name: string
  url: string
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

/** Phrases a real error page says about itself. */
const DEAD_MARKER =
  /AccessDenied|<Code>NoSuchKey|Page ?Not ?Found|404 Error|404 Not Found|page you.{0,25}looking for|no longer available|doesn't exist/i

const TIMEOUT_MS = 20_000
const CONCURRENCY = 8

/**
 * Browser-grade second opinion for a URL a plain fetch couldn't judge (threw,
 * or answered a bare 4xx). Firecrawl renders like a real browser and defeats the
 * bot walls that block node fetch. Returns { dead: true } ONLY when Firecrawl
 * itself sees a 404/410 or a dead-page marker — anything else (a healthy 200, a
 * 403 bot wall, or Firecrawl erroring out) is treated as "not proven dead" so we
 * keep the silence bias. No API key → cannot escalate, so caller falls back.
 */
async function firecrawlConfirmsDead(url: string): Promise<{ escalated: boolean; dead: boolean; note: string }> {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) return { escalated: false, dead: false, note: 'no FIRECRAWL_API_KEY' }
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true, timeout: 60_000 }),
      signal: AbortSignal.timeout(75_000),
    })
    if (!res.ok) return { escalated: true, dead: false, note: `firecrawl HTTP ${res.status}` }
    const data = await res.json()
    const md: string = data?.data?.markdown ?? ''
    const code: number | undefined = data?.data?.metadata?.statusCode
    if (code === 404 || code === 410) return { escalated: true, dead: true, note: `firecrawl status ${code}` }
    if (DEAD_MARKER.test(md)) return { escalated: true, dead: true, note: 'firecrawl saw dead-page marker' }
    return { escalated: true, dead: false, note: `firecrawl status ${code ?? '?'} — page renders` }
  } catch (err) {
    return { escalated: true, dead: false, note: `firecrawl threw: ${String(err).slice(0, 60)}` }
  }
}

async function collectTargets(supabase: SupabaseClient): Promise<Target[]> {
  const targets: Target[] = []

  const { data: cards } = await supabase
    .from('credit_cards')
    .select('name, official_url, affiliate_url')
    .eq('is_active', true)
  for (const c of cards ?? []) {
    if (c.official_url) targets.push({ kind: 'card official', name: c.name as string, url: c.official_url as string })
    // Affiliate links are revenue — a dead one costs money silently.
    if (c.affiliate_url) targets.push({ kind: 'affiliate', name: c.name as string, url: c.affiliate_url as string })
  }

  const { data: exps } = await supabase
    .from('experiences')
    .select('name, official_url')
    .eq('status', 'published')
    .not('official_url', 'is', null)
  for (const e of exps ?? []) {
    targets.push({ kind: 'experience', name: e.name as string, url: e.official_url as string })
  }

  const { data: progs } = await supabase
    .from('programs')
    .select('name, program_url, partner_chart_url')
    .eq('is_active', true)
  for (const p of progs ?? []) {
    if (p.program_url) targets.push({ kind: 'program site', name: p.name as string, url: p.program_url as string })
    if (p.partner_chart_url)
      targets.push({ kind: 'partner chart', name: p.name as string, url: p.partner_chart_url as string })
  }

  return targets
}

async function checkOne(t: Target): Promise<LinkFinding | null> {
  let status: number | 'ERR' = 'ERR'
  let body = ''
  // Two attempts: a single network blip should never raise an alarm.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(t.url, {
        redirect: 'follow',
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      status = res.status
      body = (await res.text()).slice(0, 4000)
      break
    } catch {
      status = 'ERR'
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500))
    }
  }

  // A page that LOADED and says it is gone is a reliable signal — report it.
  if (status !== 'ERR' && DEAD_MARKER.test(body)) {
    return { ...t, status, reason: 'page identifies itself as missing' }
  }

  // Unreachable (threw) OR a bare 4xx: the plain fetch cannot tell a dead page
  // from a bot wall, so never report on that alone. Escalate to Firecrawl and
  // report only if a real browser confirms the death. See the header note.
  const is4xx = typeof status === 'number' && status >= 400 && status < 500
  if (status === 'ERR' || is4xx) {
    const verdict = await firecrawlConfirmsDead(t.url)
    if (verdict.dead) {
      const how = status === 'ERR' ? 'unreachable to bot' : `status ${status}`
      return { ...t, status, reason: `${how}; ${verdict.note}` }
    }
    // Not proven dead (live page, bot wall, or Firecrawl couldn't confirm) — stay silent.
    return null
  }

  return null
}

export async function auditLinks(supabase: SupabaseClient): Promise<{
  checked: number
  findings: LinkFinding[]
}> {
  const targets = await collectTargets(supabase)
  const findings: LinkFinding[] = []
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = await Promise.all(targets.slice(i, i + CONCURRENCY).map(checkOne))
    for (const f of batch) if (f) findings.push(f)
  }
  // Revenue links first, then reader-facing pages.
  const rank = (k: string) => (k === 'affiliate' ? 0 : k === 'card official' ? 1 : 2)
  findings.sort((a, b) => rank(a.kind) - rank(b.kind))
  return { checked: targets.length, findings }
}
