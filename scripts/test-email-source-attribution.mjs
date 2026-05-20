#!/usr/bin/env node
/**
 * Integration test for Phase 2b — source subscription manager attribution.
 *
 * Verifies the full chain:
 *   1. A source row with intake_method='email' + inbox_address gets created
 *   2. An email POSTed to /api/intel-email-inbound addressed to that alias
 *      is correctly attributed to the source (source_name comes from the
 *      source row, not the default "email:domain" fallback).
 *
 * Skips the actual form submission (server actions can't be invoked from
 * a Node script). Inserts the source row directly via Supabase — same DB
 * effect as the form would produce.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

try {
  const text = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
  }
} catch {}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const ENDPOINT = 'http://localhost:3000/api/intel-email-inbound'

let pass = 0
let fail = 0
function check(label, cond, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${label}`) }
  else { fail++; console.log(`  ✗ ${label}  ${detail}`) }
}

const sentinel = `phase2b-test-${Date.now()}`
const slug = sentinel.replace(/[^a-z0-9-]/g, '-').slice(0, 32)
const inboxAddress = `intel+${slug}@ouarkiwhag.resend.app`
const sourceName = `${sentinel} Test Source`
const senderEmail = `bot@${sentinel}.example.test`
const senderDomain = `${sentinel}.example.test`

console.log(`\nPhase 2b integration test (sentinel=${sentinel})`)
console.log('='.repeat(70))

// ── Setup: insert source + allowlist row ────────────────────────────────────
console.log('\nSetup')
const { data: src, error: srcErr } = await sb
  .from('sources')
  .insert({
    name: sourceName,
    url: 'https://example.test/feed',
    type: 'email',
    tier: 3,
    intake_method: 'email',
    inbox_address: inboxAddress,
  })
  .select('id, name, intake_method, inbox_address')
  .single()
check('source insert succeeded', !srcErr, srcErr?.message)
check('source has intake_method=email', src?.intake_method === 'email')
check('source has expected inbox_address', src?.inbox_address === inboxAddress)

const { error: alErr } = await sb
  .from('intel_email_senders')
  .insert({ domain: senderDomain, source_id: src.id, notes: 'phase 2b test' })
check('allowlist row inserted', !alErr, alErr?.message)

// ── Scenario: forwarded email lands at the alias → attributed to source ────
console.log('\nScenario: email to alias → source attribution')
const payload = {
  from: senderEmail,
  to: [inboxAddress],
  subject: `${sentinel} Marriott Bonvoy 50% transfer bonus to United through Dec 31`,
  text: 'Marriott Bonvoy is offering a 50% transfer bonus to United MileagePlus through December 31, 2026. Standard ratio is 3:1.1, so 50% bonus effectively gets you 3:1.65 on transfers.',
  html: '<p>Marriott Bonvoy 50% transfer bonus to United through Dec 31, 2026.</p>',
}
const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
check('inbound endpoint returned 200', res.status === 200, `got ${res.status}`)
const json = await res.json()
check('endpoint returned source_id matching our source',
  json.source_id === src.id,
  `expected ${src.id}, got ${json.source_id}`)
check('classification has a headline',
  typeof json.classification?.headline === 'string' && json.classification.headline.length > 0)

const intelId =
  json.ingest?.kind === 'inserted' || json.ingest?.kind === 'suppressed_as_dup' || json.ingest?.kind === 'surfaced_as_update'
    ? json.ingest.intel_id
    : null

// Verify the intel_item row carries the source's name (not the default 'email:domain')
if (intelId) {
  const { data: intel } = await sb.from('intel_items').select('source_name').eq('id', intelId).single()
  check(`intel_item.source_name = source's name (got "${intel?.source_name}")`,
    intel?.source_name === sourceName,
    `expected "${sourceName}", got "${intel?.source_name}"`)
}

// ── Cleanup ────────────────────────────────────────────────────────────────
console.log('\nCleanup')
if (intelId) await sb.from('intel_items').delete().eq('id', intelId)
// Delete any test rows that might have been created via dedup path
await sb.from('intel_items').delete().like('headline', `%${sentinel}%`)
await sb.from('intel_email_quarantine').delete().eq('sender_email', senderEmail)
await sb.from('intel_email_senders').delete().eq('domain', senderDomain)
const { error: srcDel } = await sb.from('sources').delete().eq('id', src.id)
check('cleanup deleted test source', !srcDel, srcDel?.message)

console.log('')
console.log('='.repeat(70))
console.log(`Tests:  ${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
