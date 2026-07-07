/**
 * Pre-triage lint for pending alerts. Pure, dependency-free logic shared by
 * the CLI tool (scripts/lint-pending-alerts.ts) and the daily-brief pre-triage
 * (app/api/build-brief). Flags three recurring error classes:
 *   - DUPE:       likely duplicate of an already-published alert
 *   - STALE:      expired/expiring window, or stale-terms date/URL mismatch
 *   - UNVERIFIED: transient availability language, or a price tied to one
 *
 * All checks map to real failures caught on 2026-07-07 (Qatar stale regional
 * terms, Marriott dupe, carried-over "wide open from 70,000 Avios" claim).
 */

export interface AlertForLint {
  id: string
  title: string
  summary?: string | null
  description?: string | null
  source_url?: string | null
  primary_program_id?: string | null
  start_date?: string | null
  end_date?: string | null
  verified_terms?: string | null
}

export interface PublishedForDupe {
  id: string
  title: string
  primary_program_id?: string | null
}

export type LintKind = 'DUPE' | 'STALE' | 'UNVERIFIED' | 'STYLE'
export interface LintFlag {
  kind: LintKind
  message: string
}

const STOP = new Set(['the','a','an','and','or','for','to','of','in','on','with','by','up','off','get','now','your','you','through','from','plus','at','is','are'])
function tokens(s: string): Set<string> {
  return new Set((s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)))
}
function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = [...a].filter((x) => b.has(x)).length
  const uni = new Set([...a, ...b]).size
  return uni ? inter / uni : 0
}

const MONTHS = 'january february march april may june july august september october november december'.split(' ')
/** Latest parseable date in a string, or null. */
export function latestDate(s: string): Date | null {
  if (!s) return null
  const found: Date[] = []
  for (const m of s.matchAll(/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/g)) {
    const mi = MONTHS.indexOf(m[2].toLowerCase())
    if (mi >= 0) found.push(new Date(Date.UTC(+m[3], mi, +m[1])))
  }
  for (const m of s.matchAll(/\b([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})\b/g)) {
    const mi = MONTHS.indexOf(m[1].toLowerCase())
    if (mi >= 0) found.push(new Date(Date.UTC(+m[3], mi, +m[2])))
  }
  for (const m of s.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) found.push(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])))
  return found.length ? new Date(Math.max(...found.map((d) => d.getTime()))) : null
}

const TRANSIENT = /\b(wide[- ]open|right now|available now|wide open|selling out|going fast)\b/i
const AWARD_PRICE = /\b\d{1,3}(,\d{3})+\s*(avios|miles|points)\b/i

/**
 * Editorial house-style check (editorialRules.ts): NO em-dashes or en-dashes,
 * no spaced-hyphen used as a dash, and "to" for numeric ranges (not "1-31").
 * Markdown list markers ("- item") at line start are ignored.
 */
export function lintCopyStyle(text: string): LintFlag[] {
  const flags: LintFlag[] = []
  if (!text) return flags
  if (/—/.test(text)) flags.push({ kind: 'STYLE', message: 'em-dash present (banned; use period, comma, or colon)' })
  if (/–/.test(text)) flags.push({ kind: 'STYLE', message: 'en-dash present (banned; use "to" for ranges)' })
  for (const raw of text.split(/\n/)) {
    const line = raw.replace(/^\s*[-*]\s+/, '') // drop list marker
    if (/ - /.test(line)) { flags.push({ kind: 'STYLE', message: 'spaced hyphen used as a dash (rewrite with period, comma, or colon)' }); break }
  }
  // Strip markdown-link targets and bare URLs so slug hyphens (intel-a73...-178...)
  // don't read as ranges.
  const noUrls = text.replace(/\]\([^)]*\)/g, '](url)').replace(/https?:\/\/\S+/g, 'url')
  const range = noUrls.match(/\d[\d,]*\s*-\s*\d/)
  if (range) flags.push({ kind: 'STYLE', message: `hyphenated range "${range[0]}" (use "to", e.g. "July 1 to 31")` })
  return flags
}

export function lintPendingAlert(a: AlertForLint, published: PublishedForDupe[], now: Date = new Date()): LintFlag[] {
  const flags: LintFlag[] = []
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())

  // 1. DUPE — same primary program + title token overlap vs published
  const at = tokens(a.title)
  const dupes = published
    .filter((p) => p.primary_program_id && p.primary_program_id === a.primary_program_id && p.id !== a.id)
    .map((p) => ({ p, score: jaccard(at, tokens(p.title)) }))
    .filter((x) => x.score >= 0.34)
    .sort((x, y) => y.score - x.score)
    .slice(0, 2)
  for (const d of dupes) flags.push({ kind: 'DUPE', message: `~${Math.round(d.score * 100)}% match vs published "${d.p.title.slice(0, 55)}"` })

  // 2. STALE — window at/past today
  if (a.end_date) {
    const ed = new Date(a.end_date)
    const edUTC = Date.UTC(ed.getUTCFullYear(), ed.getUTCMonth(), ed.getUTCDate())
    if (edUTC < todayUTC) flags.push({ kind: 'STALE', message: `end_date ${String(a.end_date).slice(0, 10)} already passed` })
    else if (edUTC === todayUTC) flags.push({ kind: 'STALE', message: `expires TODAY (${String(a.end_date).slice(0, 10)}) — confirm still live` })
  }
  if (a.verified_terms) {
    for (const line of a.verified_terms.split(/\n/)) {
      if (/\b(booking|travel|offer)\s*period/i.test(line)) {
        const d = latestDate(line)
        if (d && d.getTime() < todayUTC) flags.push({ kind: 'STALE', message: `terms window "${line.trim().slice(0, 44)}" ends ${d.toISOString().slice(0, 10)} (past)` })
      }
    }
    if (/\/[a-z]{2}-[a-z]{2}\//i.test(a.verified_terms)) flags.push({ kind: 'STALE', message: `terms cite a regional (/xx-yy/) URL — confirm it's the canonical offer page` })
  }
  const srcYear = (a.source_url || '').match(/\/(20\d{2})\//)?.[1]
  const startYear = a.start_date ? String(a.start_date).slice(0, 4) : null
  if (srcYear && startYear && Math.abs(+srcYear - +startYear) > 1) flags.push({ kind: 'STALE', message: `source year ${srcYear} vs alert year ${startYear}` })

  // 3. UNVERIFIED — transient availability language; price only if tied to it
  const body = `${a.summary || ''}\n${a.description || ''}`
  const tm = body.match(TRANSIENT)
  if (tm) flags.push({ kind: 'UNVERIFIED', message: `transient phrase "${tm[0]}" — availability goes stale, needs a live source` })
  for (const sent of body.split(/(?<=[.!?])\s+|\n+/)) {
    if (TRANSIENT.test(sent) && AWARD_PRICE.test(sent)) {
      flags.push({ kind: 'UNVERIFIED', message: `price "${sent.match(AWARD_PRICE)![0]}" tied to an availability claim — verify or drop` })
      break
    }
  }

  // 4. STYLE — editorial house-style (dashes / hyphenated ranges) across title + copy
  const seen = new Set(flags.map((f) => f.kind + f.message))
  for (const f of [...lintCopyStyle(a.title), ...lintCopyStyle(a.summary || ''), ...lintCopyStyle(a.description || '')]) {
    const key = f.kind + f.message
    if (!seen.has(key)) { seen.add(key); flags.push(f) }
  }
  return flags
}
