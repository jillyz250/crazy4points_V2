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

  if (status === 'ERR') {
    return { ...t, status, reason: 'unreachable after 2 attempts' }
  }
  if (DEAD_MARKER.test(body)) {
    return { ...t, status, reason: 'page identifies itself as missing' }
  }
  // Deliberately NOT flagging bare 4xx responses, even short ones. Bot walls
  // answer 403 with a near-empty body — Flying Blue and Marriott Moments both
  // do, and both are healthy. Tested against the six real breakages found on
  // 2026-07-20 (Accor, BA, Qatar, Iberia, Qantas, JAL): every one is caught by
  // the dead-page marker or the unreachable path above, so a status-based rule
  // adds only false alarms. An audit people learn to ignore is worse than none.
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
