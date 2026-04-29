/**
 * Phase 2 — deterministic comparison-audit checker.
 *
 * Why this exists:
 *   Comparative claims ("X is faster than Y", "5/$10K = same rate as 2/$5K")
 *   are pure arithmetic, but LLMs are unreliable at math. The writer would
 *   confidently assert "5/$10K is the same rate as 2/$5K" (it isn't —
 *   0.5 vs 0.4 per $1K), the fact-checker would punt to web verify, and
 *   web verify would return "inconclusive" because no source explicitly
 *   says the comparison.
 *
 *   The fix: have the writer emit a structured audit block ALONGSIDE the
 *   prose, listing every comparison it makes. A deterministic JS function
 *   recomputes the math and decides true/false. No LLM in the loop for
 *   comparisons. No web roundtrip. Sub-millisecond, always right.
 *
 * The audit block lives in the article body as an HTML comment so it's
 * invisible to readers but trivially parsable by us:
 *
 *   <!-- comparison_audits:
 *   [
 *     { "metric": "qualifying_nights_per_$",
 *       "lhs": { "label": "business", "value": 5, "per": 10000 },
 *       "rhs": { "label": "personal", "value": 2, "per": 5000 },
 *       "assertion": "faster" }
 *   ]
 *   -->
 *
 * The verifier strips this block before sending the prose to Sonnet (so
 * Sonnet doesn't double-count the comparison as a natural-language claim)
 * and synthesizes one VerifyClaim per audit entry — supported=true if
 * the math holds, false if not.
 *
 * A regex safety net catches comparison words ("faster", "same rate",
 * "double", etc.) in prose where the writer didn't emit an audit, and
 * synthesizes a high-severity unaudited-comparison claim so the editor
 * is forced to either revise the prose or add the audit.
 */

import type { VerifyClaim } from './verifyAlertDraft'

/** Direction of comparison the writer claims about lhs relative to rhs. */
export type ComparisonAssertion =
  | 'equal'
  | 'faster' // higher rate (used when both operands are "value per denominator")
  | 'slower' // lower rate
  | 'greater' // simple value comparison, lhs > rhs
  | 'less' // simple value comparison, lhs < rhs

export interface ComparisonOperand {
  /** Human label like "business card" or "Hyatt 80K". Shows up in the synthetic claim text. */
  label: string
  /** Numerator, or the bare value if `per` is omitted. */
  value: number
  /** Denominator. When set, the operand normalizes to `value / per`. Omit for simple-value comparisons. */
  per?: number
  /** Optional unit string for human-readable messages — e.g. "nights", "points", "$". */
  unit?: string
}

export interface ComparisonAudit {
  /** Free-text metric label for human-readable claims, e.g. "qualifying_nights_per_$". */
  metric: string
  lhs: ComparisonOperand
  rhs: ComparisonOperand
  assertion: ComparisonAssertion
  /**
   * Relative tolerance for "equal" — default 0.01 (1%). Two normalized
   * values are considered equal when their relative difference is within
   * this tolerance. Wider tolerance = looser equality.
   */
  tolerance?: number
}

/**
 * Result of validating one comparison. `ok=true` means the prose's
 * assertion matches the math. `ok=false` means the writer claimed
 * something the numbers don't support.
 */
export interface ComparisonResult {
  audit: ComparisonAudit
  ok: boolean
  /** Normalized lhs value (value/per, or value if no denominator). */
  lhsNormalized: number
  /** Normalized rhs value. */
  rhsNormalized: number
  /** Human-readable message — populated for both pass and fail. */
  message: string
}

/**
 * Extract the audits JSON array from an article body. Returns null when
 * no audit block is present (writer emitted no comparisons).
 *
 * Tolerant of:
 *   - leading/trailing whitespace inside the comment
 *   - both `comparison_audits:` and `comparison_audits =`
 *   - trailing commas inside the JSON (we sanitize)
 *
 * Does NOT throw on parse failure — returns an empty array and lets the
 * caller see no audits, which fails-closed (regex safety net will fire).
 */
export function extractComparisonAudits(body: string): ComparisonAudit[] {
  const match = body.match(
    /<!--\s*comparison_audits\s*[:=]\s*([\s\S]*?)-->/
  )
  if (!match) return []
  let raw = match[1].trim()
  // Tolerate trailing commas before ] and }
  raw = raw.replace(/,(\s*[\]}])/g, '$1')
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    console.warn(
      '[verifyComparisons] failed to parse audit block — treating as empty:',
      err instanceof Error ? err.message : String(err)
    )
    return []
  }
  if (!Array.isArray(parsed)) return []
  const out: ComparisonAudit[] = []
  for (const entry of parsed) {
    const a = entry as Partial<ComparisonAudit>
    if (
      typeof a?.metric !== 'string' ||
      !a.lhs ||
      !a.rhs ||
      typeof a.assertion !== 'string'
    ) {
      continue
    }
    const lhs = sanitizeOperand(a.lhs)
    const rhs = sanitizeOperand(a.rhs)
    if (!lhs || !rhs) continue
    if (
      a.assertion !== 'equal' &&
      a.assertion !== 'faster' &&
      a.assertion !== 'slower' &&
      a.assertion !== 'greater' &&
      a.assertion !== 'less'
    ) {
      continue
    }
    out.push({
      metric: a.metric.trim().slice(0, 120),
      lhs,
      rhs,
      assertion: a.assertion,
      tolerance:
        typeof a.tolerance === 'number' && a.tolerance > 0 && a.tolerance < 1
          ? a.tolerance
          : undefined,
    })
  }
  return out
}

function sanitizeOperand(raw: unknown): ComparisonOperand | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<ComparisonOperand>
  if (typeof o.label !== 'string' || !o.label.trim()) return null
  if (typeof o.value !== 'number' || !Number.isFinite(o.value)) return null
  return {
    label: o.label.trim().slice(0, 80),
    value: o.value,
    per:
      typeof o.per === 'number' && Number.isFinite(o.per) && o.per !== 0
        ? o.per
        : undefined,
    unit: typeof o.unit === 'string' ? o.unit.trim().slice(0, 32) : undefined,
  }
}

function normalize(op: ComparisonOperand): number {
  return op.per !== undefined ? op.value / op.per : op.value
}

/**
 * Recompute every audit deterministically. Returns a result per audit so
 * the caller can render both passes and fails in the UI.
 */
export function verifyComparisonAudits(
  audits: ComparisonAudit[]
): ComparisonResult[] {
  return audits.map((audit) => verifyOne(audit))
}

function verifyOne(audit: ComparisonAudit): ComparisonResult {
  const lhsN = normalize(audit.lhs)
  const rhsN = normalize(audit.rhs)
  const tol = audit.tolerance ?? 0.01
  // Relative difference, guarded against divide-by-zero
  const denom = Math.max(Math.abs(lhsN), Math.abs(rhsN), Number.EPSILON)
  const relDiff = Math.abs(lhsN - rhsN) / denom

  let ok = false
  let why = ''
  switch (audit.assertion) {
    case 'equal':
      ok = relDiff <= tol
      why = ok
        ? `${formatOperand(audit.lhs, lhsN)} ≈ ${formatOperand(audit.rhs, rhsN)} (within ${(tol * 100).toFixed(1)}%)`
        : `${formatOperand(audit.lhs, lhsN)} ≠ ${formatOperand(audit.rhs, rhsN)} — relative diff ${(relDiff * 100).toFixed(1)}% > ${(tol * 100).toFixed(1)}%`
      break
    case 'faster':
    case 'greater':
      ok = lhsN > rhsN && relDiff > tol
      why = ok
        ? `${formatOperand(audit.lhs, lhsN)} > ${formatOperand(audit.rhs, rhsN)} (${(relDiff * 100).toFixed(1)}% higher)`
        : `${formatOperand(audit.lhs, lhsN)} is NOT meaningfully greater than ${formatOperand(audit.rhs, rhsN)}`
      break
    case 'slower':
    case 'less':
      ok = lhsN < rhsN && relDiff > tol
      why = ok
        ? `${formatOperand(audit.lhs, lhsN)} < ${formatOperand(audit.rhs, rhsN)} (${(relDiff * 100).toFixed(1)}% lower)`
        : `${formatOperand(audit.lhs, lhsN)} is NOT meaningfully less than ${formatOperand(audit.rhs, rhsN)}`
      break
  }

  return {
    audit,
    ok,
    lhsNormalized: lhsN,
    rhsNormalized: rhsN,
    message: `${audit.metric}: ${audit.lhs.label} ${audit.assertion} ${audit.rhs.label} → ${why}`,
  }
}

function formatOperand(op: ComparisonOperand, normalized: number): string {
  const valuePart =
    op.per !== undefined
      ? `${op.value}${op.unit ? ` ${op.unit}` : ''} per ${op.per}`
      : `${op.value}${op.unit ? ` ${op.unit}` : ''}`
  return `${op.label}=${valuePart} (≈${normalized.toPrecision(3)})`
}

/**
 * Strip the audit block from an article body so Sonnet doesn't see it.
 * Keeps surrounding whitespace clean — collapses any blank lines the
 * removal would otherwise leave behind.
 */
export function stripComparisonAudits(body: string): string {
  return body
    .replace(/<!--\s*comparison_audits\s*[:=][\s\S]*?-->/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Convert ComparisonResults into VerifyClaim objects so they merge into
 * the existing fact-check pipeline. Each comparison becomes one synthetic
 * claim; supported=true on a math-confirmed comparison, false on a
 * math-contradicted one.
 *
 * source_excerpt is filled with the math itself so the editor has the
 * proof inline in the AllClaimsViewer.
 */
export function comparisonResultsToClaims(
  results: ComparisonResult[]
): VerifyClaim[] {
  return results.map((r) => {
    const a = r.audit
    const direction =
      a.assertion === 'equal'
        ? 'the same as'
        : a.assertion === 'faster' || a.assertion === 'greater'
        ? 'greater than'
        : 'less than'
    const claimText = `${a.lhs.label} is ${direction} ${a.rhs.label} (${a.metric})`
    return {
      claim: claimText.slice(0, 300),
      // Math-grounded — three-state truth: true if math confirmed, false if
      // contradicted. There's no "unsupported" middle state here because
      // we computed the answer ourselves.
      supported: r.ok,
      severity: 'high',
      source_excerpt: r.message.slice(0, 400),
    }
  })
}

/**
 * Regex safety net — looks for comparison words in prose where the writer
 * didn't emit an audit. Returns one synthetic high-severity unsupported
 * claim per detected word so the editor sees the gap and either adds an
 * audit or rephrases.
 *
 * Word list intentionally permissive — false positives are cheap (editor
 * can mark them acknowledged), but missed comparisons silently slip through
 * to web verify and bounce as inconclusive (the failure mode this whole
 * system exists to prevent).
 *
 * Skips comparison words inside the audit block itself.
 */
export function detectUnauditedComparisons(
  bodyWithoutAudits: string
): VerifyClaim[] {
  // Word boundaries + simple prose patterns. Designed to favor recall;
  // editor can acknowledge any false positives.
  const patterns: { regex: RegExp; label: string }[] = [
    { regex: /\bsame rate\b/gi, label: '"same rate"' },
    { regex: /\bsame as\b/gi, label: '"same as"' },
    { regex: /\bfaster (per|than)\b/gi, label: '"faster than/per"' },
    { regex: /\bslower (per|than)\b/gi, label: '"slower than/per"' },
    { regex: /\bdouble (the|a)\b/gi, label: '"double the"' },
    { regex: /\btwice (as|the)\b/gi, label: '"twice as"' },
    { regex: /\bequal to\b/gi, label: '"equal to"' },
    { regex: /\bmore than\b/gi, label: '"more than"' },
    { regex: /\bless than\b/gi, label: '"less than"' },
    { regex: /\bbeats\b/gi, label: '"beats"' },
    { regex: /\bahead of\b/gi, label: '"ahead of"' },
  ]

  const hits: { label: string; snippet: string }[] = []
  const seenSnippets = new Set<string>()
  for (const { regex, label } of patterns) {
    const matches = bodyWithoutAudits.matchAll(regex)
    for (const m of matches) {
      const idx = m.index ?? 0
      const start = Math.max(0, idx - 60)
      const end = Math.min(bodyWithoutAudits.length, idx + (m[0]?.length ?? 0) + 60)
      const snippet = bodyWithoutAudits.slice(start, end).replace(/\s+/g, ' ').trim()
      const key = `${label}:${snippet}`
      if (seenSnippets.has(key)) continue
      seenSnippets.add(key)
      hits.push({ label, snippet })
    }
  }

  return hits.map((h) => ({
    claim: `Unaudited comparison ${h.label} in prose — writer did not emit a comparison_audit entry.`,
    supported: false,
    severity: 'high',
    source_excerpt: `…${h.snippet}…`.slice(0, 400),
  }))
}
