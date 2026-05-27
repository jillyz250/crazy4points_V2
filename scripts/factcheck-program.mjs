#!/usr/bin/env node
//
// scripts/factcheck-program.mjs — Phase 1 of the facts ledger.
//
// Extracts factual claims from a program's existing prose fields (intro,
// tier_benefits, sweet_spots, quirks, lounge_access, how_to_spend, award_chart),
// verifies each via Firecrawl /search across a trusted-blog allowlist, applies
// the 5-tier verification rule, and writes verdicts to program_facts.
//
// USAGE
//   node scripts/factcheck-program.mjs --slug=hilton
//   node scripts/factcheck-program.mjs --slug=hilton --dry         # no DB writes
//   node scripts/factcheck-program.mjs --slug=hilton --extract-only # print claims, no verify
//   node scripts/factcheck-program.mjs --fact-id=<uuid>            # re-verify single fact
//   node scripts/factcheck-program.mjs --slug=hilton --claims=path/to/claims.txt
//
// SCOPE (Phase 1):
//   - Sentence-level claim extraction via regex/heuristic (Phase 2 upgrades
//     to Claude Haiku for smarter extraction)
//   - Firecrawl /search for each claim across allowlist domains
//   - 5-tier verification rule (see plans/facts-ledger.md)
//   - Writes program_facts rows with verdict / risk_level / sources / disposition
//
// OUT OF SCOPE (Phase 2+):
//   - AI claim extraction
//   - Drafting prose from verified facts
//   - Drift detection cron
//   - Auto-rewrite on fact change

import { readFileSync, existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// ── Env loading ──────────────────────────────────────────────────────────
try {
  const text = readFileSync('.env.local', 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
  }
} catch {}

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!FIRECRAWL_KEY) throw new Error('FIRECRAWL_API_KEY missing')
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase env missing')

const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Args ──────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    return m ? [m[1], m[2] ?? true] : [a, true]
  }),
)
const slug = typeof args.slug === 'string' ? args.slug : null
const dryRun = !!args.dry
const extractOnly = !!args['extract-only']
const factId = typeof args['fact-id'] === 'string' ? args['fact-id'] : null
const claimsFile = typeof args.claims === 'string' ? args.claims : null

if (!slug && !factId) {
  console.error('Usage: factcheck-program.mjs --slug=<slug> [--dry|--extract-only|--claims=<file>]')
  console.error('   or: factcheck-program.mjs --fact-id=<uuid>')
  process.exit(1)
}

// ── Trusted source allowlist (see plans/facts-ledger.md) ─────────────────
const OFFICIAL_DOMAINS = new Set([
  'hilton.com', 'marriott.com', 'hyatt.com', 'ihg.com', 'wyndham.com',
  'aa.com', 'delta.com', 'united.com', 'southwest.com', 'alaskaair.com', 'jetblue.com',
  'americanexpress.com', 'chase.com', 'citi.com', 'capitalone.com', 'wellsfargo.com',
  'bilt.com', 'biltrewards.com', 'discover.com',
  'aircanada.com', 'britishairways.com', 'flyingblue.com', 'singaporeair.com',
  'qantas.com', 'virginatlantic.com', 'lufthansa.com', 'turkishairlines.com',
  'flyingblue.us', 'aeroplan.com', 'avianca.com', 'emirates.com', 'etihad.com',
  'rakuten.com', 'experiences.hiltonhonors.com', 'stories.hilton.com',
])

const TRUSTED_BLOG_DOMAINS = new Set([
  'thepointsguy.com',
  'onemileatatime.com',
  'frequentmiler.com',
  'awardwallet.com',
  'upgradedpoints.com',
  'viewfromthewing.com',
  'nerdwallet.com',
  'loyaltylobby.com',
  'doctorofcredit.com',
  'milesopedia.com',
  'australianfrequentflyer.com.au',
  '10xtravel.com',
  'awardtravelfinder.com',
])

// ── Date floor for source freshness ──────────────────────────────────────
// Stable fact = 6 months. Volatile fact = 90 days. Detection of volatility
// is based on category — welcome_bonus / transfer_bonus / point_value are
// volatile, everything else is stable.
const VOLATILE_CATEGORIES = new Set(['welcome_bonus', 'transfer_bonus', 'point_value', 'promo_offer'])

function dateFloorMs(category) {
  return VOLATILE_CATEGORIES.has(category)
    ? 90 * 24 * 60 * 60 * 1000
    : 180 * 24 * 60 * 60 * 1000
}

// ── Risk-level heuristic ─────────────────────────────────────────────────
// HIGH   - affects booking math / money / points / dates / eligibility
// MEDIUM - strategy framing
// LOW    - tone, phrasing, context
const HIGH_RISK_PATTERNS = [
  /\b\d+:\d+(\.\d+)?\b/,                            // transfer ratios
  /\b\$\d+/,                                        // dollar amounts
  /\b\d{1,3},?\d{3}\s*(points|miles|nights)?\b/i,  // big numbers (points/miles/nights)
  /\b\d{1,3}%\b/,                                   // percentages
  /\bexpir|deadline|ends?\b/i,
  /\b(annual fee|welcome bonus|annual eligible spend)\b/i,
  /\b(qualify|eligible|threshold)\b/i,
]
const MEDIUM_RISK_PATTERNS = [
  /\b(tier|status|cobrand|cobranded)\b/i,
  /\b(partner|partnership|transfer)\b/i,
]

function classifyRisk(claim) {
  for (const re of HIGH_RISK_PATTERNS) if (re.test(claim)) return 'high'
  for (const re of MEDIUM_RISK_PATTERNS) if (re.test(claim)) return 'medium'
  return 'low'
}

// ── Category heuristic ───────────────────────────────────────────────────
function classifyCategory(claim) {
  const l = claim.toLowerCase()
  if (/transfer.*ratio|\b\d+:\d+|\d+,000.*=.*\d+/.test(claim)) return 'transfer_ratio'
  if (/tier|status|silver|gold|diamond|platinum/.test(l) && /\d/.test(claim)) return 'tier_threshold'
  if (/free night|fnr|certificate/.test(l)) return 'fnr_rule'
  if (/welcome bonus|sub|signup bonus/.test(l)) return 'welcome_bonus'
  if (/earn (rate|\d+x)/.test(l)) return 'earn_rate'
  if (/partnership|cobrand|co-brand/.test(l)) return 'partnership'
  if (/expir|inactiv/.test(l)) return 'expiry_policy'
  if (/lounge/.test(l)) return 'lounge_access'
  if (/bonus|promo|sale/.test(l)) return 'promo_offer'
  if (/\bcent|cpp|value\b/.test(l)) return 'point_value'
  return 'general'
}

// ── Claim extraction from prose ──────────────────────────────────────────
// Phase 1 heuristic: split prose into sentences, filter to ones matching a
// VERIFIABLE pattern (specific number+unit, ratio, named issuer, status tier
// + qualifier) and NOT matching reject patterns (voicey openers, hedge words).
// Plus normalize-and-dedupe so paraphrases of the same fact collapse.
// Phase 2 swaps in Claude Haiku for smarter LLM-based extraction.

const VERIFIABLE_PATTERNS = [
  /\b\d{1,3}(?:,\d{3})+\b/,                                       // numbers with commas (15,000)
  /\b\d+\s*(points?|miles?|nights?|stays?|cents?|cpp|%|x)\b/i,    // numbers with units
  /\b\d+:\d+(\.\d+)?\b/,                                          // ratios
  /\b\$\d+/,                                                       // dollar amounts
  /\b(silver|gold|platinum|diamond|elite|reserve)\s+(status|tier|qualify|requires?|membership)\b/i, // tier mentions
  /\b(transfer|ratio|bonus|fee|expire|cap|threshold|minimum)\b.*\d/i, // structural fact + number
  /\b(amex|chase|citi|capital one|bilt|wells fargo|membership rewards|thankyou|ultimate rewards)\b.*\b(transfer|ratio|point|mile)/i, // issuer-specific
  /\b(free night|fnr|certificate|anniversary)\b.*\d/i,
]

const REJECT_PATTERNS = [
  /\b(losses come|wins come|catch:|note:|the catch|here's|here is|the move)\b/i,
  /\b(typically|usually|generally|often|sometimes|maybe|perhaps|likely)\b/i,  // hedge words = opinion
  /\b(real travel|quietly|absurd|stupid|cute|cool|nice|amazing|incredible|killer)\b/i,  // voice words
  /^\s*\[/,                                                         // markdown link/image stubs
]

function normalizeForDedupe(s) {
  return s
    .toLowerCase()
    .replace(/\*\*/g, '')
    .replace(/^[*•\-\d\.\)]+\s*/, '')
    .replace(/[^\w\s:%.\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(the|a|an|that|this|those|these|its|their|your|our|of|on|in|at|to|for)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractClaimsFromProse(prose) {
  if (!prose || typeof prose !== 'string') return []
  const sentences = prose
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.!?])\s+|\n\s*[-*•]\s+|\n{2,}/)
    .map((s) => s.replace(/^\s*[-*•]\s+/, '').trim())
    .filter((s) => s.length > 20 && s.length < 400)
  return sentences.filter((s) => {
    if (!VERIFIABLE_PATTERNS.some((re) => re.test(s))) return false
    if (REJECT_PATTERNS.some((re) => re.test(s))) return false
    return true
  })
}

function extractAllClaims(program) {
  // Collect raw candidate claims first
  const raw = []
  for (const field of ['intro', 'how_to_spend', 'sweet_spots', 'quirks', 'lounge_access', 'award_chart']) {
    const txt = program[field]
    if (typeof txt === 'string') raw.push(...extractClaimsFromProse(txt))
  }
  if (Array.isArray(program.tier_benefits)) {
    for (const tier of program.tier_benefits) {
      if (tier?.qualification) raw.push(...extractClaimsFromProse(tier.qualification))
      if (Array.isArray(tier?.benefits)) {
        for (const b of tier.benefits) raw.push(...extractClaimsFromProse(b))
      }
    }
  }
  // transfer_partners + outbound — each entry is a synthesized claim
  for (const field of ['transfer_partners', 'transfer_partners_outbound']) {
    if (Array.isArray(program[field])) {
      for (const p of program[field]) {
        if (p?.from_slug && p?.ratio) {
          raw.push(`${program.slug} to ${p.from_slug} transfer ratio is ${p.ratio}.`)
        }
      }
    }
  }
  // Normalize-and-dedupe — collapse paraphrases of the same fact (lowercase,
  // strip articles + punctuation + bullets). Keep the FIRST raw form of each
  // normalized key so the editor still sees the original prose.
  const seen = new Map()
  for (const c of raw) {
    const key = normalizeForDedupe(c)
    if (!seen.has(key)) seen.set(key, c)
  }
  return [...seen.values()]
}

// ── Firecrawl search ─────────────────────────────────────────────────────
async function firecrawlSearch(query, limit = 8) {
  const r = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit }),
    signal: AbortSignal.timeout(60000),
  })
  if (!r.ok) return { ok: false, error: `${r.status} ${(await r.text()).slice(0, 200)}` }
  const j = await r.json()
  if (!j.success) return { ok: false, error: 'search failed' }
  return { ok: true, results: j.data || [] }
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function parseDate(d) {
  if (!d) return null
  const t = new Date(d).getTime()
  return isNaN(t) ? null : t
}

// ── Verification: apply 5-tier rule to a single claim ────────────────────
async function verifyClaim(claim, category) {
  const search = await firecrawlSearch(`${claim} 2026`, 8)
  if (!search.ok) {
    return {
      verdict: 'incorrect',
      risk_level: classifyRisk(claim),
      sources: [],
      third_party_fallback: false,
      reason: `search failed: ${search.error}`,
    }
  }

  // Score results — official vs trusted-blog vs other; date-floor pruning
  const floor = Date.now() - dateFloorMs(category)
  const officialSources = []
  const blogSources = []
  const seenDomains = new Set()

  for (const r of search.results) {
    const url = r.url
    const domain = getDomain(url)
    if (!domain || seenDomains.has(domain)) continue
    const pubDate = parseDate(r.publishedDate || r.metadata?.publishedDate)
    if (pubDate && pubDate < floor) continue

    const source = {
      url,
      publication_date: r.publishedDate || r.metadata?.publishedDate || null,
      snippet: (r.description || r.content || '').slice(0, 250),
      is_official: false,
    }

    if (OFFICIAL_DOMAINS.has(domain)) {
      source.is_official = true
      officialSources.push(source)
      seenDomains.add(domain)
    } else if (TRUSTED_BLOG_DOMAINS.has(domain)) {
      blogSources.push(source)
      seenDomains.add(domain)
    }
  }

  const risk = classifyRisk(claim)

  // Tier 1: official source present
  if (officialSources.length >= 1) {
    return {
      verdict: 'verified',
      risk_level: risk,
      sources: [...officialSources, ...blogSources].slice(0, 5),
      third_party_fallback: false,
    }
  }

  // Tier 2: no official, but 2+ blogs agree
  if (blogSources.length >= 2) {
    return {
      verdict: 'verified',
      risk_level: risk,
      sources: blogSources.slice(0, 5),
      third_party_fallback: true,
    }
  }

  // Tier 3: only 1 blog
  if (blogSources.length === 1) {
    return {
      verdict: 'needs_clarification',
      risk_level: risk,
      sources: blogSources,
      third_party_fallback: false,
      reason: 'Only one third-party source; needs corroboration',
    }
  }

  // Tier 5: no source found
  return {
    verdict: 'incorrect',
    risk_level: risk,
    sources: [],
    third_party_fallback: false,
    reason: 'No 2026-dated source found in trusted allowlist',
  }
}

// ── Re-verify a single existing fact by id ───────────────────────────────
async function reverifySingleFact() {
  const { data: row, error } = await sb.from('program_facts').select('*').eq('id', factId).single()
  if (error || !row) {
    console.error('Fact not found:', factId)
    process.exit(1)
  }
  console.log(`Re-verifying: ${row.claim_text}`)
  const v = await verifyClaim(row.claim_text, row.category)
  console.log(`  -> ${v.verdict} (${v.risk_level}); ${v.sources.length} sources`)

  if (dryRun) return

  // Mark old superseded, write new row
  await sb.from('program_facts').update({ superseded_at: new Date().toISOString() }).eq('id', factId)
  const newRow = {
    program_slug: row.program_slug,
    claim_text: row.claim_text,
    category: row.category,
    verdict: v.verdict,
    risk_level: v.risk_level,
    sources: v.sources,
    third_party_fallback: v.third_party_fallback,
    disposition: v.verdict === 'verified' ? 'auto_locked' : null,
    program_state_context: row.program_state_context,
    prior_version_id: row.id,
    reviewed_by: 'factcheck-program.mjs',
  }
  await sb.from('program_facts').insert(newRow)
  console.log('  Re-verified + new ledger row written.')
}

// ── Main verification flow ───────────────────────────────────────────────
async function runForProgram() {
  // Load program data
  const { data: program, error } = await sb
    .from('programs')
    .select('slug, name, intro, transfer_partners, transfer_partners_outbound, how_to_spend, sweet_spots, tier_benefits, lounge_access, quirks, award_chart')
    .eq('slug', slug)
    .single()

  if (error || !program) {
    console.error(`Program not found: ${slug}`)
    process.exit(1)
  }

  // Extract claims — from --claims file if provided, else from existing prose
  let claims
  if (claimsFile && existsSync(claimsFile)) {
    claims = readFileSync(claimsFile, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean)
    console.log(`Loaded ${claims.length} claims from ${claimsFile}`)
  } else {
    claims = extractAllClaims(program)
    console.log(`Extracted ${claims.length} claims from ${program.name} prose`)
  }

  if (extractOnly) {
    console.log('\n=== EXTRACTED CLAIMS (--extract-only) ===')
    claims.forEach((c, i) => console.log(`${i + 1}. ${c}`))
    return
  }

  // Wipe prior non-superseded facts for this program (Phase 1 simple approach;
  // Phase 2 will diff + preserve identical claims).
  if (!dryRun) {
    await sb
      .from('program_facts')
      .update({ superseded_at: new Date().toISOString() })
      .eq('program_slug', slug)
      .is('superseded_at', null)
  }

  const verdicts = { verified: [], needs_clarification: [], incorrect: [] }
  const rows = []
  const now = new Date().toISOString()

  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i]
    const category = classifyCategory(claim)
    process.stdout.write(`[${i + 1}/${claims.length}] ${claim.slice(0, 70)}... `)
    const v = await verifyClaim(claim, category)
    process.stdout.write(`${v.verdict} (${v.risk_level})\n`)

    verdicts[v.verdict].push({ claim, category, ...v })

    rows.push({
      program_slug: slug,
      claim_text: claim,
      category,
      verdict: v.verdict,
      risk_level: v.risk_level,
      sources: v.sources,
      third_party_fallback: v.third_party_fallback,
      disposition: v.verdict === 'verified' ? 'auto_locked' : null,
      reviewed_at: now,
      reviewed_by: 'factcheck-program.mjs',
    })

    // Be nice to Firecrawl rate limit
    await new Promise((r) => setTimeout(r, 250))
  }

  if (!dryRun && rows.length > 0) {
    const { error: insErr } = await sb.from('program_facts').insert(rows)
    if (insErr) {
      console.error(`\nDB insert failed: ${insErr.message}`)
      process.exit(1)
    }
  }

  // Report
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Program: ${program.name} (${slug})`)
  console.log(`Total claims: ${claims.length}`)
  console.log(`  ✅ Verified: ${verdicts.verified.length} (auto-locked)`)
  console.log(`  ⚠️  Needs clarification: ${verdicts.needs_clarification.length} (your action required)`)
  console.log(`  ❌ Incorrect: ${verdicts.incorrect.length} (default: remove)`)
  console.log(`${'='.repeat(60)}`)

  if (verdicts.needs_clarification.length > 0) {
    console.log('\n⚠️  NEEDS CLARIFICATION:')
    for (const r of verdicts.needs_clarification) {
      console.log(`\n  CLAIM: ${r.claim}`)
      console.log(`  RISK: ${r.risk_level}`)
      console.log(`  REASON: ${r.reason || 'sources insufficient'}`)
      if (r.sources.length > 0) {
        console.log(`  SOURCES (${r.sources.length}):`)
        for (const s of r.sources) console.log(`    - ${s.url} (${s.publication_date || 'no date'})`)
      }
    }
  }

  if (verdicts.incorrect.length > 0) {
    console.log('\n❌ INCORRECT (no 2026 source found):')
    for (const r of verdicts.incorrect) {
      console.log(`  - ${r.claim}`)
    }
  }

  console.log(`\nReview: https://crazy4points.com/admin/programs/${slug}/edit (Facts tab)`)
  if (dryRun) console.log('(--dry — no DB writes made)')
}

// ── Dispatch ─────────────────────────────────────────────────────────────
if (factId) {
  await reverifySingleFact()
} else {
  await runForProgram()
}
