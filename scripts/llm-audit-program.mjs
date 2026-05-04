#!/usr/bin/env node
/**
 * llm-audit-program.mjs — LLM-based editorial audit
 *
 * Replaces the regex-based audit-program.mjs noise floor with a Claude
 * Haiku reading pass. Haiku reads the program row's text fields and
 * returns structured findings — only flags actual unhedged claims, not
 * factual past dates, perk descriptions, or industry-standard phrases.
 *
 * USAGE:
 *   node scripts/llm-audit-program.mjs --program=<slug>
 *   node scripts/llm-audit-program.mjs --all
 *
 * COST: ~$0.02-0.05 per program via Claude Haiku.
 *
 * EXIT CODE:
 *   0 = no findings, 1 = findings present
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'

function loadEnv() {
  try {
    const text = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
    }
  } catch {}
}

function parseArgs() {
  const args = { program: null, all: false, jsonOut: null, model: 'claude-haiku-4-5-20251001' }
  for (const a of process.argv.slice(2)) {
    if (a === '--all') args.all = true
    else if (a.startsWith('--program=')) args.program = a.slice('--program='.length)
    else if (a.startsWith('--json=')) args.jsonOut = a.slice('--json='.length)
    else if (a.startsWith('--model=')) args.model = a.slice('--model='.length)
    else if (a === '--sonnet') args.model = 'claude-sonnet-4-6'
    else if (a === '--opus') args.model = 'claude-opus-4-7'
  }
  if (!args.program && !args.all) {
    console.error('Usage: llm-audit-program.mjs --program=<slug> | --all  [--json=<file>] [--sonnet|--opus|--model=<id>]')
    process.exit(1)
  }
  return args
}

const MODEL_PRICING = {
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4.00 },
  'claude-sonnet-4-6':         { input: 3.00, output: 15.00 },
  'claude-opus-4-7':           { input: 15.00, output: 75.00 },
}

async function sb(path) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`
  const res = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}`)
  return res.json()
}

const FIELDS = ['intro', 'how_to_spend', 'sweet_spots', 'quirks', 'lounge_access', 'award_chart']

function buildPrompt(program) {
  const fieldText = FIELDS
    .filter((f) => program[f])
    .map((f) => `### ${f}\n${program[f]}`)
    .join('\n\n')

  const tierBenefits = program.tier_benefits ? `\n\n### tier_benefits (JSONB)\n${JSON.stringify(program.tier_benefits, null, 2)}` : ''
  const transferPartners = program.transfer_partners ? `\n\n### transfer_partners (JSONB)\n${JSON.stringify(program.transfer_partners, null, 2)}` : ''
  const memberPrograms = program.member_programs ? `\n\n### member_programs (JSONB)\n${JSON.stringify(program.member_programs, null, 2)}` : ''

  const today = new Date().toISOString().slice(0, 10)
  return `You are an editorial fact-checker for crazy4points.com, a points-and-miles publisher with a sassy-but-accurate brand voice.

Today's real-world date: ${today}. Treat past dates (including 2024, 2025, and earlier 2026 dates relative to today) as factual history that does not need hedging. Treat dates after today as future or speculative.

Audit the following program-page content for ${program.name} (slug: ${program.slug}, type: ${program.type}). Return a JSON array of findings — only ACTUAL editorial issues, not stylistic nits.

ONLY flag:
1. Unhedged absolute claims that may not stay true ("the only program that...", "always works", "guaranteed available")
2. Stale or unverifiable comparative claims ("the best business product", "first to do X")
3. Specific factual claims that drift quickly without hedging ("no fuel surcharges" without partner-specific context)
4. Card annual fees mentioned on a program page (these belong on card pages, not program pages)
5. Outdated date references that read as current ("recently", "this year") when not anchored to a specific year

DO NOT flag:
- Factual historical dates ("joined oneworld in 2024", "merger closed December 2024")
- Industry-standard guarantees ("Guaranteed Y-class for top elites" - this is a real benefit term)
- Perk descriptions ("free checked bag", "companion flies free", "free Wi-Fi")
- Award/award-name mentions ("Skytrax World's Best Airline 2025")
- Tier names ("Free-tier members")
- Already-hedged statements ("typically near-instant", "(usually) instant", "among the most-praised")
- Idiomatic English ("never looked back", "free if plans shift" meaning no fee)

Return EXACTLY this JSON shape (no markdown, no commentary, just JSON):
{
  "findings": [
    {
      "field": "intro|how_to_spend|sweet_spots|quirks|lounge_access|award_chart|tier_benefits|transfer_partners|member_programs",
      "severity": "high|medium|low",
      "claim": "EXACT verbatim phrase from the content (will be used in a SQL replace() call — must match the source byte-for-byte)",
      "issue": "one-sentence explanation of why this is a problem",
      "suggested_fix": "LITERAL REPLACEMENT TEXT ONLY. Must be the actual prose that should appear in the field — not a directive, not 'Revise to:', not 'Remove this'. If the only good fix is removal, suggested_fix must be the empty string. If the fix needs human judgment beyond a direct text swap, omit the finding entirely."
    }
  ]
}

CRITICAL: suggested_fix is fed directly into SQL as a text replacement for claim. If you write 'Revise to: ...' it will literally appear in the program content. Always write the raw replacement prose only.

If the program is editorially clean, return: {"findings": []}

PROGRAM CONTENT:

${fieldText}${tierBenefits}${transferPartners}${memberPrograms}`
}

async function auditOne(client, program, model) {
  const prompt = buildPrompt(program)
  const response = await client.messages.create({
    model,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content.find((b) => b.type === 'text')?.text ?? ''
  // Strip any markdown fencing the model occasionally adds
  const clean = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim()
  let parsed
  try {
    parsed = JSON.parse(clean)
  } catch (e) {
    return { findings: [], parseError: text.slice(0, 200), usage: response.usage }
  }
  return { findings: parsed.findings ?? [], usage: response.usage }
}

async function main() {
  loadEnv()
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY missing from .env.local')
    process.exit(1)
  }
  const args = parseArgs()
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const filter = args.program
    ? `slug=eq.${args.program}&select=*`
    : `select=*&intro=not.is.null&order=slug`
  const programs = await sb(`programs?${filter}`)

  if (!programs.length) {
    console.error('No programs matched.')
    process.exit(1)
  }

  let totalFindings = 0
  let totalCost = 0
  const allResults = []
  for (const p of programs) {
    process.stdout.write(`[${p.slug}] ... `)
    try {
      const { findings, usage, parseError } = await auditOne(client, p, args.model)
      allResults.push({ slug: p.slug, type: p.type, findings, parseError })
      const pricing = MODEL_PRICING[args.model] ?? MODEL_PRICING['claude-haiku-4-5-20251001']
      const inputCost = (usage?.input_tokens ?? 0) / 1_000_000 * pricing.input
      const outputCost = (usage?.output_tokens ?? 0) / 1_000_000 * pricing.output
      const cost = inputCost + outputCost
      totalCost += cost

      if (parseError) {
        console.log(`PARSE ERROR (raw: ${parseError})`)
        continue
      }
      if (!findings.length) {
        console.log(`CLEAN ($${cost.toFixed(4)})`)
        continue
      }
      console.log(`${findings.length} finding(s) ($${cost.toFixed(4)})`)
      totalFindings += findings.length
      for (const f of findings) {
        console.log(`  [${f.severity?.toUpperCase() ?? '?'}] ${f.field}`)
        console.log(`    claim: "${f.claim}"`)
        console.log(`    issue: ${f.issue}`)
        console.log(`    fix:   ${f.suggested_fix}`)
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`)
    }
  }

  console.log(`\n[llm-audit] Done. ${programs.length} program(s) scanned, ${totalFindings} total finding(s). Cost: $${totalCost.toFixed(3)}`)
  if (args.jsonOut) {
    writeFileSync(args.jsonOut, JSON.stringify(allResults, null, 2))
    console.log(`[llm-audit] JSON written to ${args.jsonOut}`)
  }
  process.exit(totalFindings > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(`[llm-audit] ${err.message}`)
  process.exit(1)
})
