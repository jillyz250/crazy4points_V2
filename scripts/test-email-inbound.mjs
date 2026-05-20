#!/usr/bin/env node
/**
 * Integration test for Phase 2a.3 — /api/intel-email-inbound endpoint.
 *
 * Three scenarios against the real dev server + real DB:
 *   1. Sender NOT on allowlist → quarantined
 *   2. Sender ON allowlist + loyalty email → ingested via ingestItem
 *   3. Sender ON allowlist + non-loyalty email → discarded (no DB write)
 *
 * Requires:
 *   - Dev server running on http://localhost:3000
 *   - RESEND_INBOUND_WEBHOOK_SECRET in .env.local (test uses this)
 *
 * Cleans up: removes test allowlist row + any intel_items / quarantine
 * rows created by the test.
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
const SECRET = process.env.RESEND_INBOUND_WEBHOOK_SECRET || 'test-secret-for-dev'

let pass = 0
let fail = 0
function check(label, cond, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${label}`) }
  else { fail++; console.log(`  ✗ ${label}  ${detail}`) }
}

const sentinel = `phase2a3-test-${Date.now()}`
const allowlistDomain = `${sentinel}.example.com`
const allowlistSender = `bot@${allowlistDomain}`
const unverifiedSender = `random@untrusted.example.com`

console.log(`\nPhase 2a.3 integration test (sentinel=${sentinel})`)
console.log('='.repeat(70))

// Pre-flight: insert test allowlist row
console.log('\nSetup: insert allowlist sender row')
const { data: allowlistRow, error: alErr } = await sb
  .from('intel_email_senders')
  .insert({ domain: allowlistDomain, notes: 'phase 2a.3 integration test' })
  .select('id')
  .single()
check('allowlist insert', !alErr, alErr?.message)

// ── Scenario 1: unverified sender → quarantined ────────────────────────────
console.log('\nScenario 1: unverified sender → quarantine')
const payload1 = {
  from: unverifiedSender,
  to: ['intel+test@ouarkiwhag.resend.app'],
  subject: `${sentinel} unverified sender test`,
  text: 'This is a test from a random sender. Should be quarantined.',
  html: '<p>This is a test from a random sender.</p>',
}
const r1 = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', authorization: `Bearer ${SECRET}` },
  body: JSON.stringify(payload1),
})
const j1 = await r1.json()
check('Scenario 1 returned 200', r1.status === 200, `got ${r1.status}: ${JSON.stringify(j1)}`)
check('Scenario 1 returned quarantine id', !!j1.quarantined, JSON.stringify(j1))
const quarantineId = j1.quarantined

// Verify the quarantine row landed
if (quarantineId) {
  const { data: qRow } = await sb.from('intel_email_quarantine').select('reason, sender_email').eq('id', quarantineId).single()
  check(`Scenario 1 quarantine reason='sender_not_allowlisted'`, qRow?.reason === 'sender_not_allowlisted', `got ${qRow?.reason}`)
}

// ── Scenario 2: allowlisted sender + loyalty email → ingested ───────────────
console.log('\nScenario 2: allowlisted sender + loyalty email → ingested')
const payload2 = {
  from: allowlistSender,
  to: ['intel+test@ouarkiwhag.resend.app'],
  subject: `${sentinel} Marriott Bonvoy 30% transfer bonus to Atmos Rewards through Dec 31`,
  text: 'Marriott Bonvoy is offering a 30% transfer bonus to Atmos Rewards through December 31, 2026. Transfer at the standard 3:1 ratio and you effectively get 3.9:1. Great for Hawaii bookings.',
  html: '<p>Marriott Bonvoy is offering a 30% transfer bonus.</p><a href="https://marriott.com">Details</a>',
}
const r2 = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', authorization: `Bearer ${SECRET}` },
  body: JSON.stringify(payload2),
})
const j2 = await r2.json()
check('Scenario 2 returned 200', r2.status === 200, `got ${r2.status}: ${JSON.stringify(j2).slice(0,200)}`)
check('Scenario 2 ingest kind is a valid success state',
  j2.ingest?.kind === 'inserted' ||
    j2.ingest?.kind === 'suppressed_as_dup' ||
    j2.ingest?.kind === 'surfaced_as_update',
  `got ingest=${JSON.stringify(j2.ingest)}`)
check('Scenario 2 classification has_loyalty_angle=true (implicit)',
  typeof j2.classification?.headline === 'string' && j2.classification.headline.length > 0,
  `got classification=${JSON.stringify(j2.classification)}`)

const intelId2 = j2.ingest?.intel_id ?? null

// ── Scenario 3: allowlisted sender + non-loyalty email → discarded ─────────
console.log('\nScenario 3: allowlisted sender + non-loyalty → discarded')
const payload3 = {
  from: allowlistSender,
  to: ['intel+test@ouarkiwhag.resend.app'],
  subject: `${sentinel} Your Amazon order has shipped`,
  text: 'Your Amazon order #123-4567890 has shipped via UPS. Track your package at amazon.com/orders.',
  html: '<p>Your Amazon order has shipped.</p>',
}
const r3 = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', authorization: `Bearer ${SECRET}` },
  body: JSON.stringify(payload3),
})
const j3 = await r3.json()
check('Scenario 3 returned 200', r3.status === 200, `got ${r3.status}: ${JSON.stringify(j3)}`)
check('Scenario 3 was discarded (no loyalty angle)',
  j3.discarded === 'no_loyalty_angle',
  `got ${JSON.stringify(j3)}`)

// ── Scenario 4: missing auth → 401 (skipped if no secret env var set) ─────
if (process.env.RESEND_INBOUND_WEBHOOK_SECRET) {
  console.log('\nScenario 4: missing auth → 401')
  const r4 = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload1),
  })
  check('Scenario 4 returned 401', r4.status === 401, `got ${r4.status}`)
} else {
  console.log('\nScenario 4: SKIPPED (set RESEND_INBOUND_WEBHOOK_SECRET in .env.local + restart dev server to enable auth path)')
}

// ── Cleanup ────────────────────────────────────────────────────────────────
console.log('\nCleanup')
if (quarantineId) {
  const { error } = await sb.from('intel_email_quarantine').delete().eq('id', quarantineId)
  check('deleted quarantine row', !error, error?.message)
}
if (intelId2) {
  const { error } = await sb.from('intel_items').delete().eq('id', intelId2)
  check('deleted intel row', !error, error?.message)
}
if (allowlistRow?.id) {
  const { error } = await sb.from('intel_email_senders').delete().eq('id', allowlistRow.id)
  check('deleted allowlist row', !error, error?.message)
}
// Also delete any leftover sentinel intel items in case ingest path created extras
await sb.from('intel_items').delete().like('headline', `%${sentinel}%`)

console.log('')
console.log('='.repeat(70))
console.log(`Tests:  ${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
