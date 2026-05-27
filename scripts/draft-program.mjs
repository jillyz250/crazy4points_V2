#!/usr/bin/env node
//
// scripts/draft-program.mjs — Phase 2b of the facts ledger.
//
// Drafts a program page's prose fields from verified facts in the ledger.
// Each draft section links back to the ledger fact IDs that back it (via the
// prose_fact_links table), so drift detection can later say "this intro
// paragraph cites fact #42 which changed."
//
// USAGE
//   node scripts/draft-program.mjs --slug=<slug>
//   node scripts/draft-program.mjs --slug=<slug> --field=intro       # draft single field
//   node scripts/draft-program.mjs --slug=<slug> --dry               # no DB writes
//   node scripts/draft-program.mjs --slug=<slug> --force              # overwrite existing prose
//
// FIELDS DRAFTED (per program type):
//   - airline / loyalty_program / hotel: intro, sweet_spots, quirks
//   - hotel adds: lounge_access (Executive Lounge / Club rules)
//   - All: tier_benefits structure suggested but JSON tier objects aren't
//     LLM-drafted (too lossy); editor populates these from ledger manually
//
// WHAT IT DOESN'T DO (left for editor):
//   - tier_benefits JSONB (structured; LLM-prone to invention)
//   - transfer_partners JSONB (factual; populated from ledger directly via SQL)
//   - award_chart (specific data tables; editor authors from ledger)
//   - alliance, hubs, member_programs (categorical; editor sets)
//
// VOICE: Claude Sonnet 4.5 (better voice quality than Haiku for prose).
// Cost: ~$0.05-0.15 per program depending on fact count.

import { readFileSync, existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

void existsSync

// ── Env ──────────────────────────────────────────────────────────────────
try {
  const text = readFileSync('.env.local', 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase env missing')
if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY missing')

const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })
const SONNET_MODEL = 'claude-sonnet-4-5-20250929'

// ── Args ─────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    return m ? [m[1], m[2] ?? true] : [a, true]
  }),
)
const slug = typeof args.slug === 'string' ? args.slug : null
const fieldArg = typeof args.field === 'string' ? args.field : null
const dryRun = !!args.dry
const force = !!args.force

if (!slug) {
  console.error('Usage: draft-program.mjs --slug=<slug> [--field=<intro|sweet_spots|quirks|lounge_access>] [--dry|--force]')
  process.exit(1)
}

// ── Brand voice instructions (matches crazy4points editorial standards) ──
const BRAND_VOICE_GUIDE = `Brand voice — crazy4points editorial guidelines:

- Audience: points-and-miles enthusiasts who book reward travel actively
- Tone: sassy traveler-friend, slightly opinionated, never obnoxious. Think "smart friend texting you the play"
- Lead with the actual play (transfer, redemption, sweet spot), not marketing fluff
- Banned absolute words (rewrite if tempted): never, always, guaranteed, free, instant, all, every
- Use hedged language: "typically", "usually", "as of [Month YYYY]", "currently"
- Editorial value-add: don't just state facts; give a take or angle
- Never quote partner counts as fixed numbers — use {amex_airline_count} / {amex_hotel_count} / {citi_partner_count} tokens that resolve at render time
- Never use em-dashes (— or –) in prose — use regular hyphens with spaces ( - ) or restructure
- ASCII only — no smart quotes, no ellipsis characters, no curly apostrophes`

// ── Field prompts ────────────────────────────────────────────────────────
const FIELD_PROMPTS = {
  intro: {
    label: 'intro',
    instruction: `Draft an intro paragraph (2-3 paragraphs total) for this program's public page. Cover:
- What the program is + its position in the market
- The structural advantage or unique angle for points-and-miles readers
- 1-2 standout perks or recent changes worth flagging
- The honest caveat (what makes it tricky or where it disappoints)

Aim for 250-400 words. Voice it like you're telling a points-savvy friend what they need to know in 60 seconds.`,
    minFacts: 5,
  },
  sweet_spots: {
    label: 'sweet_spots',
    instruction: `Draft a "Sweet spots" markdown list (3-7 bullet points). Each bullet:
- Names a specific high-value redemption or play
- Quantifies the value where possible (point cost, $ equivalent, cents-per-point)
- Gives a 1-2 sentence why-it-matters

Lead with the strongest play. Use markdown bullets (- ). Don't fabricate point costs; rely only on what's in the verified facts.`,
    minFacts: 3,
  },
  quirks: {
    label: 'quirks',
    instruction: `Draft a "Quirks & things to know" markdown bullet list (5-10 bullets). Cover the gotchas + non-obvious rules that affect booking decisions:
- Expiry rules
- Family / pooling / transferability mechanics
- Stopover or routing oddities
- Recent program changes worth knowing
- Cobranded card mechanics that interact with the program

Use markdown bullets (- ). Bold the lead phrase of each bullet for scannability.`,
    minFacts: 5,
  },
  lounge_access: {
    label: 'lounge_access',
    instruction: `Draft a "Lounge access" markdown section. Cover:
- Which tier(s) get lounge access
- What kind of lounge (own-brand Executive Lounge, alliance partner lounges, paid options)
- Eligibility rules (guests, restrictions, fare class exclusions)
- Day-pass or single-visit pass options if applicable
- Flagship/destination lounge callout if notable

Use short paragraphs + markdown bullets. Be factual + concise.`,
    minFacts: 3,
    hotelOnly: false,
  },
  how_to_spend: {
    label: 'how_to_spend',
    instruction: `Draft a "How to spend points" markdown bullet list. Cover the main redemption channels:
- Standard award stays / flights
- Premium / suite upgrades
- Partner transfers (if outbound to airlines)
- Free Night Certificates if applicable
- Anything unusual (Experiences platform, cruise, etc.)

Use markdown bullets. Be factual.`,
    minFacts: 4,
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────
async function fetchProgram() {
  const { data, error } = await sb
    .from('programs')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error || !data) {
    console.error(`Program not found: ${slug}`)
    process.exit(1)
  }
  return data
}

async function fetchVerifiedFacts() {
  const { data } = await sb
    .from('program_facts')
    .select('id, claim_text, category, risk_level, verdict, disposition, sources')
    .eq('program_slug', slug)
    .is('superseded_at', null)
    .in('verdict', ['verified'])  // Only draft from verified — never from incorrect/needs_clarification

  // Also include facts the editor explicitly kept (override even though
  // verdict wasn't verified — editor signed off)
  const { data: kept } = await sb
    .from('program_facts')
    .select('id, claim_text, category, risk_level, verdict, disposition, sources')
    .eq('program_slug', slug)
    .is('superseded_at', null)
    .eq('disposition', 'kept')

  const combined = [...(data ?? [])]
  const seenIds = new Set(combined.map((f) => f.id))
  for (const k of kept ?? []) if (!seenIds.has(k.id)) combined.push(k)
  return combined
}

function formatFactsForPrompt(facts) {
  // Group facts by category for easier LLM consumption
  const byCategory = new Map()
  for (const f of facts) {
    const cat = f.category ?? 'general'
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat).push(f)
  }
  const sections = []
  for (const [cat, items] of byCategory) {
    sections.push(`## ${cat.toUpperCase()}`)
    for (const f of items) {
      sections.push(`- [Fact #${f.id.slice(0, 8)}] ${f.claim_text}`)
    }
    sections.push('')
  }
  return sections.join('\n')
}

async function draftField(fieldKey, program, facts) {
  const cfg = FIELD_PROMPTS[fieldKey]
  if (!cfg) throw new Error(`Unknown field: ${fieldKey}`)
  if (facts.length < cfg.minFacts) {
    console.log(`  [skip] ${fieldKey} — only ${facts.length} verified facts (need ${cfg.minFacts}+)`)
    return null
  }
  const factsBlock = formatFactsForPrompt(facts)
  const prompt = `${BRAND_VOICE_GUIDE}

You're drafting the "${cfg.label}" field for the public page at /programs/${slug} (${program.name}).

CRITICAL CONSTRAINTS:
- Use ONLY the verified facts below. Do not introduce any claim that is not directly backed by one of these facts.
- It is OK to phrase / restructure the facts for voice. Do NOT invent new claims.
- If the facts are insufficient to write a good draft, return a short note explaining what's missing instead of fabricating.

VERIFIED FACTS AVAILABLE:
${factsBlock}

INSTRUCTION:
${cfg.instruction}

Output ONLY the drafted ${cfg.label} content. No preamble, no markdown code fences, no explanation. Just the text that should land in the database field.`

  console.log(`  [draft] ${fieldKey} — calling Sonnet with ${facts.length} facts in context...`)
  const msg = await anthropic.messages.create({
    model: SONNET_MODEL,
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  if (block?.type !== 'text') return null
  return block.text.trim()
}

// ── Main ─────────────────────────────────────────────────────────────────
const program = await fetchProgram()
const facts = await fetchVerifiedFacts()

console.log(`\n=== Drafting prose for ${program.name} (${slug}) ===`)
console.log(`Verified+kept facts available: ${facts.length}`)
if (facts.length < 3) {
  console.error(`Too few facts (${facts.length}). Run factcheck-program.mjs first to populate the ledger.`)
  process.exit(1)
}

const fieldsToProcess = fieldArg ? [fieldArg] : ['intro', 'sweet_spots', 'quirks', 'how_to_spend', 'lounge_access']
const drafts = {}

for (const field of fieldsToProcess) {
  // Don't overwrite existing prose unless --force
  if (program[field] && program[field].trim().length > 100 && !force) {
    console.log(`  [skip] ${field} — already populated (${program[field].length}c). Use --force to overwrite.`)
    continue
  }
  const draft = await draftField(field, program, facts)
  if (draft) {
    drafts[field] = draft
    console.log(`  [done] ${field} — ${draft.length}c drafted`)
  }
}

if (Object.keys(drafts).length === 0) {
  console.log('\nNo drafts produced (existing prose or insufficient facts).')
  process.exit(0)
}

// Display drafts
console.log(`\n${'='.repeat(60)}`)
for (const [field, txt] of Object.entries(drafts)) {
  console.log(`\n=== ${field.toUpperCase()} (${txt.length}c) ===`)
  console.log(txt)
  console.log('')
}

if (dryRun) {
  console.log('(--dry — no DB writes made)')
  process.exit(0)
}

// Write to programs table
const update = { ...drafts, content_updated_at: new Date().toISOString() }
const { error: updErr } = await sb.from('programs').update(update).eq('slug', slug)
if (updErr) {
  console.error(`DB update failed: ${updErr.message}`)
  process.exit(1)
}
console.log(`\n✓ Wrote ${Object.keys(drafts).length} fields to programs table`)

// Write prose_fact_links — paragraph-level for each field's draft
// Phase 2 simple approach: link every fact in scope to every paragraph in the
// draft. Phase 2.5 will refine with per-paragraph claim attribution.
const linkRows = []
for (const [field, txt] of Object.entries(drafts)) {
  const paragraphs = txt.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  for (let i = 0; i < paragraphs.length; i++) {
    for (const f of facts) {
      linkRows.push({
        program_slug: slug,
        field_name: field,
        fragment_anchor: String(i),
        fact_id: f.id,
        fragment_snippet: paragraphs[i].slice(0, 200),
      })
    }
  }
}
if (linkRows.length > 0) {
  // Wipe old links for these fields first
  await sb
    .from('prose_fact_links')
    .delete()
    .eq('program_slug', slug)
    .in('field_name', Object.keys(drafts))
  // Insert in chunks to avoid request-size limits
  const CHUNK = 500
  for (let i = 0; i < linkRows.length; i += CHUNK) {
    const { error } = await sb.from('prose_fact_links').insert(linkRows.slice(i, i + CHUNK))
    if (error) console.error(`  Link insert failed for chunk ${i}: ${error.message}`)
  }
  console.log(`✓ Wrote ${linkRows.length} prose_fact_links rows`)
}

console.log(`\nReview at: https://crazy4points.com/admin/programs/${slug}/edit`)
console.log(`Spot-check public page: https://crazy4points.com/programs/${slug}`)
