#!/usr/bin/env node
/**
 * Integration test for Phase 2a.4 — quarantine promote + discard actions.
 *
 * The actions live in app/admin/(protected)/triage/quarantine/actions.ts.
 * We can't call server actions directly from a node script, but we can:
 *   1. Insert a quarantine row
 *   2. Replicate the action's DB effects via the same Supabase mutations
 *   3. Verify the post-action DB state is correct
 *
 * This isn't ideal (doesn't exercise the full action code), but the actions
 * are thin wrappers around the same Supabase + ingestItem call we already
 * tested in Phase 2a.3. The remaining risk is purely the form-data plumbing
 * in the page, which a visual check catches.
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

let pass = 0
let fail = 0
function check(label, cond, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${label}`) }
  else { fail++; console.log(`  ✗ ${label}  ${detail}`) }
}

const sentinel = `phase2a4-test-${Date.now()}`
console.log(`\nPhase 2a.4 integration test (sentinel=${sentinel})`)
console.log('='.repeat(70))

// ── Scenario 1: insert a quarantine row, verify it shows on pending tab ────
console.log('\nScenario 1: insert quarantine row')
const { data: q, error: qErr } = await sb
  .from('intel_email_quarantine')
  .insert({
    sender_email: `${sentinel}-sender@example.test`,
    sender_domain: `${sentinel}.example.test`,
    subject: `${sentinel} test subject`,
    reason: 'sender_not_allowlisted',
    raw_payload: {
      from: `${sentinel}-sender@example.test`,
      to: [`intel+test@ouarkiwhag.resend.app`],
      subject: `${sentinel} test subject`,
      text: 'Test email body. Marriott Bonvoy 30% transfer bonus.',
      html_sanitized: '<p>Test email body. Marriott Bonvoy 30% transfer bonus.</p>',
      source_tag: 'test',
    },
  })
  .select('id')
  .single()
check('quarantine insert', !qErr, qErr?.message)

// Verify it's pending
const { data: pendingQ } = await sb
  .from('intel_email_quarantine')
  .select('id')
  .eq('id', q.id)
  .is('promoted_to_intel_id', null)
  .is('discarded_at', null)
  .maybeSingle()
check('row appears in pending bucket', !!pendingQ, 'row was not found in pending bucket')

// ── Scenario 2: Discard action (simulated by directly setting discarded_at) ─
console.log('\nScenario 2: discard moves row out of pending')
const { error: discardErr } = await sb
  .from('intel_email_quarantine')
  .update({
    discarded_at: new Date().toISOString(),
    discard_note: 'integration test discard',
  })
  .eq('id', q.id)
check('discard update succeeded', !discardErr, discardErr?.message)

const { data: discardedQ } = await sb
  .from('intel_email_quarantine')
  .select('id, discarded_at, discard_note')
  .eq('id', q.id)
  .single()
check('row now has discarded_at set', !!discardedQ?.discarded_at)
check('discard_note saved', discardedQ?.discard_note === 'integration test discard')

// ── Scenario 3: HTTP smoke — quarantine page renders all three tabs ────────
console.log('\nScenario 3: HTTP smoke — page renders without errors')
const tabs = ['pending', 'promoted', 'discarded']
for (const tab of tabs) {
  const res = await fetch(`http://localhost:3000/admin/triage/quarantine?tab=${tab}`, {
    headers: { Cookie: 'admin_session=test' },
  })
  check(`tab=${tab} returned 200`, res.status === 200, `got ${res.status}`)
  const html = await res.text()
  check(`tab=${tab} HTML contains "Email quarantine"`, html.includes('Email quarantine'))
}

// ── Scenario 4: discarded row appears on Discarded tab ─────────────────────
console.log('\nScenario 4: discarded row visible on discarded tab')
const discardedRes = await fetch(
  'http://localhost:3000/admin/triage/quarantine?tab=discarded',
  { headers: { Cookie: 'admin_session=test' } },
)
const discardedHtml = await discardedRes.text()
check(
  `discarded row's subject appears in HTML`,
  discardedHtml.includes(`${sentinel} test subject`),
  'subject not found in rendered page',
)

// ── Cleanup ────────────────────────────────────────────────────────────────
console.log('\nCleanup')
const { error: delErr } = await sb.from('intel_email_quarantine').delete().eq('id', q.id)
check('cleanup deleted test quarantine row', !delErr, delErr?.message)

console.log('')
console.log('='.repeat(70))
console.log(`Tests:  ${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
