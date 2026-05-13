import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const id = '7dfe4dbb-0e68-4af9-b395-e9026e84d099'

const { data, error } = await sb
  .from('content_ideas')
  .select('article_body')
  .eq('id', id)
  .single()
if (error) { console.error(error); process.exit(1) }

const replacements = [
  {
    from: 'JetBlue said it will run its largest operation ever out of Fort Lauderdale this summer with 130 daily departures, 75% more than last year.',
    to: "JetBlue's pulling in for the assist — Fort Lauderdale will see 130 daily departures this summer, the carrier's biggest operation there ever, up from roughly 75 last year.",
  },
  {
    from: 'Companies that go out of business typically stop honoring rewards, coupons and vouchers after they cease operations.',
    to: 'When an airline shuts down, the loyalty currency goes with it — vouchers, coupons, and points usually stop being honored the moment the doors close.',
  },
]

let body = data.article_body
const report = []
for (const r of replacements) {
  if (body.includes(r.from)) {
    body = body.replace(r.from, r.to)
    report.push({ ok: true, from: r.from.slice(0, 60) + '…' })
  } else {
    report.push({ ok: false, from: r.from.slice(0, 60) + '…' })
  }
}

console.table(report)

const anyApplied = report.some((r) => r.ok)
if (!anyApplied) {
  console.error('Aborting — no passages matched. Body unchanged.')
  process.exit(1)
}

const { error: updErr } = await sb
  .from('content_ideas')
  .update({
    article_body: body,
    originality_pass: null,
    originality_checked_at: null,
    originality_notes: null,
    originality_confidence_score: null,
    originality_flagged_passages: null,
    updated_at: new Date().toISOString(),
  })
  .eq('id', id)

if (updErr) { console.error(updErr); process.exit(1) }
console.log('OK — body updated, originality state cleared. Re-run the check.')
