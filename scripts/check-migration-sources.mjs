#!/usr/bin/env node
/**
 * Pre-commit / pre-PR gate: scans new migration files that touch program
 * content fields and flags claims that lack inline source citations.
 *
 * Soft gate (warns + non-zero exit only on serious gaps; not perfect).
 *
 * What it looks for:
 *   - Migrations that update programs.intro / sweet_spots / quirks / etc.
 *   - Heuristic claim detection: dated claims, specific numbers, partner
 *     names, "as of YYYY", etc.
 *   - Whether the migration includes any `-- source:` comments anywhere
 *
 * Usage:
 *   node scripts/check-migration-sources.mjs supabase/migrations/192_*.sql
 *   node scripts/check-migration-sources.mjs --staged   # check staged migrations only
 */

import { readFileSync, statSync } from 'node:fs'
import { execSync } from 'node:child_process'

// Heuristic patterns that suggest a factual claim
const CLAIM_PATTERNS = [
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}?,?\s*\d{4}\b/, // dated event
  /\b(?:as of|effective)\s+\w+\s+\d{4}\b/i,
  /\b\d+\s*(?:miles?|points?|cents?|cpp|%)\s*(?:per|on|for|to|off)/i, // points/miles math
  /\b\d{4,}\s*(?:point|mile|tier|qualifying|status)/i, // status thresholds
  /\bjoined\s+(?:oneworld|skyteam|star\s*alliance)\s+(?:in\s+)?\d{4}\b/i,
  /\bended|terminated|discontinued|launched|introduced\b/i,
  /\b(?:transfers?|partner)\s*(?:at\s*)?\d+\s*[:×]\s*\d+\b/i, // transfer ratio
]

const SOURCE_HINT_PATTERNS = [
  /--\s*source:/i,
  /verified\s+(?:via|at|against)/i,
  /https?:\/\/[a-z]/i,
  /\(verified\b/i,
  /\bper\s+[a-z.]+\.com\b/i,
]

function isProgramContentMigration(content) {
  return /update\s+programs\s+set/i.test(content) &&
    /(intro|sweet_spots|quirks|how_to_spend|lounge_access|award_chart|tier_benefits|transfer_partners)/i.test(content)
}

function getStaged() {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=A', { encoding: 'utf8' })
    return out.split('\n').filter((p) => p.match(/^supabase\/migrations\/.*\.sql$/))
  } catch {
    return []
  }
}

function checkFile(path) {
  let content
  try {
    content = readFileSync(path, 'utf8')
  } catch (e) {
    return { path, ok: false, error: `cannot read: ${e.message}` }
  }

  if (!isProgramContentMigration(content)) {
    return { path, ok: true, skipped: 'not a program-content migration' }
  }

  const lines = content.split('\n')
  const claimLines = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const p of CLAIM_PATTERNS) {
      if (p.test(line)) {
        claimLines.push({ line: i + 1, text: line.trim().slice(0, 100) })
        break
      }
    }
  }

  const hasSourceHint = SOURCE_HINT_PATTERNS.some((p) => p.test(content))

  return {
    path,
    ok: hasSourceHint || claimLines.length === 0,
    claimCount: claimLines.length,
    hasSourceHint,
    claims: claimLines.slice(0, 5),
  }
}

const args = process.argv.slice(2)
let files
if (args.length === 1 && args[0] === '--staged') {
  files = getStaged()
  if (files.length === 0) {
    console.log('No staged migration files. Skipping.')
    process.exit(0)
  }
} else if (args.length === 0) {
  console.error('Usage: node scripts/check-migration-sources.mjs <migration-file> [...] | --staged')
  process.exit(2)
} else {
  files = args
}

const results = files.map(checkFile)
let failed = 0
for (const r of results) {
  if (r.error) {
    console.log(`⚠️ ${r.path}: ${r.error}`)
    continue
  }
  if (r.skipped) {
    console.log(`➖ ${r.path}: ${r.skipped}`)
    continue
  }
  if (r.ok) {
    console.log(`✅ ${r.path}: ${r.claimCount} claim(s) detected, source citation found`)
  } else {
    failed++
    console.log(`❌ ${r.path}: ${r.claimCount} claim(s) detected, no source citation found`)
    console.log(`   Add a "-- source: <url>" comment, or "verified via ..." reference.`)
    console.log(`   Examples of detected claims:`)
    for (const c of r.claims) {
      console.log(`     L${c.line}: ${c.text}`)
    }
  }
}

if (failed > 0) {
  console.log(`\n❌ ${failed} migration(s) lack source citations. Add inline sources before merging.`)
  process.exit(1)
}
console.log(`\n✅ All ${results.length} migration(s) have appropriate source citations.`)
process.exit(0)
