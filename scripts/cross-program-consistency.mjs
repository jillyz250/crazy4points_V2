#!/usr/bin/env node
/**
 * Cross-program consistency check.
 *
 * Verifies that every transfer relationship asserted on program A's
 * transfer_partners JSON resolves to a real program row in the database.
 * v1 catches:
 *   - from_slug references to programs that don't exist
 *   - duplicate from_slugs within a single program
 *   - typos / underscore vs kebab inconsistencies
 *
 * v2 (future) will check reciprocity: if BA Avios says Amex MR transfers
 * 1:1, then Amex MR's page (when authored) should list BA Avios as a
 * transfer destination.
 *
 * Exit code 1 if any inconsistency; 0 if clean.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qorkbikqikxhchksummn.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY env var')
  process.exit(2)
}

async function fetchPrograms() {
  const url = `${SUPABASE_URL}/rest/v1/programs?select=slug,name,type,transfer_partners&order=slug`
  const r = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  if (!r.ok) throw new Error(`fetch failed: ${r.status} ${await r.text()}`)
  return r.json()
}

async function main() {
  const programs = await fetchPrograms()
  const slugs = new Set(programs.map((p) => p.slug))
  const findings = []

  for (const program of programs) {
    const tp = program.transfer_partners
    if (!tp || !Array.isArray(tp) || tp.length === 0) continue

    const seenSlugs = new Set()

    for (const partner of tp) {
      const fromSlug = partner.from_slug
      if (!fromSlug) {
        findings.push({
          program: program.slug,
          severity: 'high',
          issue: 'transfer_partners entry missing from_slug',
          detail: JSON.stringify(partner).slice(0, 100),
        })
        continue
      }

      // Underscore detection (we use kebab convention)
      if (fromSlug.includes('_')) {
        findings.push({
          program: program.slug,
          severity: 'medium',
          issue: `from_slug uses underscore convention: '${fromSlug}'`,
          detail: 'Project convention is kebab-case (e.g., "ba-avios", "miles-and-more").',
        })
      }

      // Duplicate
      if (seenSlugs.has(fromSlug)) {
        findings.push({
          program: program.slug,
          severity: 'high',
          issue: `duplicate transfer partner entry: '${fromSlug}'`,
          detail: 'Same from_slug appears more than once in transfer_partners',
        })
      }
      seenSlugs.add(fromSlug)

      // Slug doesn't resolve
      if (!slugs.has(fromSlug)) {
        findings.push({
          program: program.slug,
          severity: 'high',
          issue: `from_slug does not resolve to a programs row: '${fromSlug}'`,
          detail: 'Either the slug is a typo, or the source program needs a skeleton row.',
        })
      }
    }
  }

  if (findings.length === 0) {
    console.log(`✅ All ${programs.length} program transfer_partners resolve cleanly. No inconsistencies.`)
    process.exit(0)
  }

  console.log(`\nFound ${findings.length} cross-program inconsistencies across ${programs.length} programs:\n`)
  const grouped = {}
  for (const f of findings) {
    grouped[f.program] = grouped[f.program] || []
    grouped[f.program].push(f)
  }
  for (const [program, items] of Object.entries(grouped)) {
    console.log(`## ${program}`)
    for (const f of items) {
      const icon = f.severity === 'high' ? '❌' : '⚠️'
      console.log(`  ${icon} [${f.severity}] ${f.issue}`)
      if (f.detail) console.log(`      ${f.detail}`)
    }
  }
  console.log(`\n❌ ${findings.length} cross-program inconsistencies. Fix before shipping new programs.`)
  process.exit(1)
}

main().catch((e) => { console.error(e); process.exit(2) })
