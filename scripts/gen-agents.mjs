#!/usr/bin/env node
/**
 * gen-agents — generate .claude/agents/<slug>.md from Supabase (Jill, 2026-09-02).
 * ONE-WAY FLOW: Supabase is truth; these files are generated; agents consume them.
 * Never edit the generated files by hand (they get overwritten). Only ACTIVE agents
 * (kind='agent', status='active') get a file — planned hires appear on the org chart
 * but aren't invokable until activated. Guardrail: build the whole file in memory and
 * only write if complete (never a partial file); stamp last_regenerated_at on success.
 * Run: node scripts/gen-agents.mjs
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const arr = (v) => (Array.isArray(v) ? v : [])

function render(e, logs) {
  const bullets = (xs) => arr(xs).map((x) => `- ${x}`).join('\n') || '- (none yet)'
  const plats = arr(e.platforms).map((p) => `- **${p.platform}** (${p.status})${p.notes ? ` — ${p.notes}` : ''}`).join('\n') || '- (none yet)'
  const log = logs.length
    ? logs.map((l) => `- [${l.type}] ${l.note}${l.actor ? ` (${l.actor})` : ''}`).join('\n')
    : '- (no entries yet)'
  return `---
name: ${e.slug}
description: ${e.role_title || 'crazy4points team member'} — ${(e.mission || '').replace(/\n/g, ' ')}
---

# ${e.name} — ${e.role_title || ''} ${e.emoji || ''}

You are **${e.name}**, ${e.role_title || 'a team member'} at crazy4points. You report to Morgan (Chief of Staff), who reports to Jill (Founder & CEO). You act only within your scope below, follow every rule, and you never invent facts.

## Persona
${e.persona || '(not set)'}

## Mission
${e.mission || '(not set)'}

## Rules (non-negotiable)
${bullets(e.rules)}

## Responsibilities
${bullets(e.responsibilities)}

## Platforms
${plats}

## Skills you own
${bullets(e.skills)}

## What you may touch (allowed scopes — least privilege)
${bullets(e.allowed_scopes)}

## Recent performance log
${log}

<!-- GENERATED FROM SUPABASE (employees table). Do NOT edit by hand — changes are
     overwritten. Edit via /admin/org, then run: node scripts/gen-agents.mjs -->
`
}

const { data: agents, error } = await db.from('employees')
  .select('*').eq('kind', 'agent').eq('status', 'active')
if (error) { console.log('!! query problem:', error.message); process.exit(1) }
if (!agents?.length) { console.log('no active agents to generate'); process.exit(0) }

fs.mkdirSync('.claude/agents', { recursive: true })
let n = 0
for (const e of agents) {
  const { data: logs } = await db.from('employee_logs')
    .select('type, note, actor, created_at').eq('employee_id', e.id).order('created_at', { ascending: false }).limit(10)
  const content = render(e, logs || [])            // build fully in memory first
  if (!content || content.length < 200) { console.log(`SKIP ${e.slug}: content too small, not writing partial`); continue }
  fs.writeFileSync(`.claude/agents/${e.slug}.md`, content)  // only write when complete
  await db.from('employees').update({ last_regenerated_at: new Date().toISOString() }).eq('id', e.id)
  console.log(`✓ generated .claude/agents/${e.slug}.md (${content.length} bytes)`)
  n++
}
console.log(`\ngenerated ${n} agent file(s) from Supabase.`)
