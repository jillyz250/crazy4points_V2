#!/usr/bin/env node
/**
 * check-duplicate-export — catch a helper that already exists BEFORE you build a
 * duplicate.
 *
 * Born from a real 2026-08-28 miss: a new `lib/sweepstakes/timeshare.ts`
 * `isTimeshareSweep()` was created when `lib/sweepstakes/categories.ts` already
 * exported one (the "check the existing mechanism first" guardrail, but nothing
 * mechanical enforced it). This does.
 *
 * Two modes:
 *   node scripts/check-duplicate-export.mjs                 # audit: every name
 *       defined (not re-exported) in 2+ files, minus Next.js conventional exports
 *   node scripts/check-duplicate-export.mjs --name Foo      # pre-create check:
 *       where (if anywhere) is a symbol named Foo already exported? Exit 1 if so.
 *   node scripts/check-duplicate-export.mjs Foo             # same, positional
 *
 * Scans app/ lib/ utils/ components/ scripts/ for .ts/.tsx. No deps.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SCAN_DIRS = ['app', 'lib', 'utils', 'components', 'scripts']
const SKIP = new Set(['node_modules', '.next', '.git', '.claude', 'dist', 'build'])

// Next.js (and route) conventional exports are SUPPOSED to repeat per file.
const CONVENTIONAL = new Set([
  'default', 'metadata', 'generateMetadata', 'generateStaticParams', 'revalidate',
  'dynamic', 'dynamicParams', 'fetchCache', 'runtime', 'preferredRegion', 'viewport',
  'generateViewport', 'maxDuration', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH',
  'OPTIONS', 'HEAD', 'config', 'Page', 'Layout', 'Loading', 'Error', 'NotFound',
  // opengraph-image / twitter-image conventional exports (one set per route).
  'alt', 'contentType', 'size',
])

// Matches an export that DEFINES a symbol here (not `export { x } from './y'`,
// not `export * from`). Captures the name.
const DEF = [
  /^export\s+default\s+function\s+([A-Za-z0-9_$]+)/,
  /^export\s+(?:async\s+)?function\s*\*?\s+([A-Za-z0-9_$]+)/,
  /^export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)/,
  /^export\s+class\s+([A-Za-z0-9_$]+)/,
  /^export\s+(?:abstract\s+)?class\s+([A-Za-z0-9_$]+)/,
  /^export\s+(?:interface|type|enum)\s+([A-Za-z0-9_$]+)/,
]

function walk(dir, out) {
  let entries
  try { entries = readdirSync(dir) } catch { return }
  for (const e of entries) {
    if (SKIP.has(e)) continue
    const full = join(dir, e)
    let st
    try { st = statSync(full) } catch { continue }
    if (st.isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(e) && !/\.d\.ts$/.test(e)) out.push(full)
  }
}

/** name -> Set(relative file paths) that DEFINE-and-export it. */
function buildIndex() {
  const files = []
  for (const d of SCAN_DIRS) walk(join(ROOT, d), files)
  const index = new Map()
  for (const file of files) {
    let src
    try { src = readFileSync(file, 'utf8') } catch { continue }
    const rel = relative(ROOT, file)
    for (const raw of src.split('\n')) {
      const line = raw.trim()
      if (!line.startsWith('export')) continue
      for (const rx of DEF) {
        const m = line.match(rx)
        if (m) {
          const name = m[1]
          if (!index.has(name)) index.set(name, new Set())
          index.get(name).add(rel)
          break
        }
      }
    }
  }
  return index
}

const argName = process.argv.slice(2).find((a) => a && !a.startsWith('--')) ||
  (process.argv.includes('--name') ? process.argv[process.argv.indexOf('--name') + 1] : null)

const index = buildIndex()

if (argName) {
  const hits = index.get(argName)
  if (hits && hits.size) {
    console.log(`\n⚠  "${argName}" is ALREADY exported from ${hits.size} file(s):`)
    for (const f of hits) console.log(`   - ${f}`)
    console.log(`\nReuse or extend the existing one instead of creating a duplicate.\n`)
    process.exit(1)
  }
  console.log(`✓ No existing export named "${argName}" — safe to create.`)
  process.exit(0)
}

// Audit mode: names defined in 2+ files, excluding conventional per-file exports.
const dupes = [...index.entries()]
  .filter(([name, files]) => files.size > 1 && !CONVENTIONAL.has(name))
  .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))

if (!dupes.length) {
  console.log('✓ No duplicate exported definitions found.')
  process.exit(0)
}

console.log(`\nFound ${dupes.length} exported name(s) defined in more than one file:\n`)
for (const [name, files] of dupes) {
  console.log(`  ${name}  (${files.size})`)
  for (const f of files) console.log(`     - ${f}`)
}
console.log(
  `\nSome are legitimate (re-exported barrels, same-name-different-purpose). Review\n` +
  `each: if two files define the SAME concept, consolidate to one.\n`,
)
// Non-zero exit so this can gate CI later if desired.
process.exit(dupes.length ? 1 : 0)
