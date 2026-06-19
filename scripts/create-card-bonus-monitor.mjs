#!/usr/bin/env node
/**
 * Create (or preview) the Firecrawl Monitor that watches each card's welcome-bonus
 * source page and pings our webhook on change. Cheap MARKDOWN mode (1 credit/
 * scrape) + a goal-judge detects bonus-relevant changes; the webhook then
 * re-extracts only the changed page and writes card_bonus_signals.
 *
 * Monitored set mirrors scanCardBonuses: active cards with a current welcome bonus
 * and a source_url, EXCLUDING URLs shared by 2+ cards (comparison pages).
 *
 * Cadence: every 3 days (~880 credits/mo for ~80 cards). Pilot runs PARALLEL to
 * the daily scanCardBonuses cron; same content_hash means no duplicate signals.
 *
 * Run:
 *   set -a; . ./.env.local; set +a
 *   node scripts/create-card-bonus-monitor.mjs --dry-run   # print payload only
 *   node scripts/create-card-bonus-monitor.mjs             # actually create it
 */
import { createClient } from '@supabase/supabase-js'

const DRY = process.argv.includes('--dry-run')
const FC_KEY = process.env.FIRECRAWL_API_KEY
const WEBHOOK_SECRET = process.env.FIRECRAWL_WEBHOOK_SECRET
const WEBHOOK_URL = 'https://www.crazy4points.com/api/webhooks/firecrawl-monitor'

if (!FC_KEY) { console.error('Missing FIRECRAWL_API_KEY'); process.exit(1) }
if (!WEBHOOK_SECRET) { console.error('Missing FIRECRAWL_WEBHOOK_SECRET (set it in .env.local AND Vercel prod)'); process.exit(1) }

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const GOAL =
  'Alert only when the card\'s sign-up/welcome bonus amount or its minimum required spend changes. Ignore design, marketing, legal, navigation, and any unrelated page changes.'

async function getMonitoredUrls() {
  const { data, error } = await sb
    .from('credit_card_welcome_bonuses')
    .select('source_url, credit_cards!inner(is_active, status)')
    .eq('is_current', true)
    .not('source_url', 'is', null)
  if (error) throw error
  // Active cards only, and drop URLs shared by 2+ current cards (comparison pages).
  const counts = new Map()
  for (const r of data) counts.set(r.source_url, (counts.get(r.source_url) ?? 0) + 1)
  const urls = new Set()
  for (const r of data) {
    const c = Array.isArray(r.credit_cards) ? r.credit_cards[0] : r.credit_cards
    if (!c || !c.is_active || c.status !== 'active') continue
    if ((counts.get(r.source_url) ?? 0) > 1) continue
    urls.add(r.source_url)
  }
  return [...urls]
}

function chunk(arr, n) {
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

async function main() {
  const urls = await getMonitoredUrls()
  console.log(`Monitored URLs: ${urls.length}`)

  // MARKDOWN mode (1 credit/scrape). The goal-judge runs on changed pages and
  // tells us a bonus-relevant change happened; the webhook then re-extracts that
  // one page. JSON-mode changeTracking would extract every page every check
  // (~5 credits/page => ~5k/mo) and is intentionally avoided.
  const targets = chunk(urls, 50).map((group) => ({
    type: 'scrape',
    urls: group,
    scrapeOptions: { maxAge: 0, formats: ['markdown'] },
  }))

  const payload = {
    name: 'crazy4points welcome-bonus monitor',
    schedule: { cron: '0 13 */3 * *', timezone: 'UTC' }, // every 3 days, 13:00 UTC
    goal: GOAL,
    targets,
    webhook: {
      url: WEBHOOK_URL,
      headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
      events: ['monitor.page'],
    },
  }

  if (DRY) {
    console.log('\n--- DRY RUN: payload (webhook secret redacted) ---')
    console.log(JSON.stringify({ ...payload, webhook: { ...payload.webhook, headers: { Authorization: 'Bearer ***' } } }, null, 2))
    console.log(`\nWould create 1 monitor, ${targets.length} target(s), ${urls.length} URLs, every 3 days.`)
    return
  }

  const res = await fetch('https://api.firecrawl.dev/v2/monitor', {
    method: 'POST',
    headers: { Authorization: `Bearer ${FC_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok || !json.success) {
    console.error(`Firecrawl error (${res.status}):`, JSON.stringify(json))
    process.exit(1)
  }
  const m = json.data
  console.log(`\nCreated monitor ${m.id}`)
  console.log(`  schedule: ${JSON.stringify(m.schedule)}  nextRunAt: ${m.nextRunAt}`)
  console.log(`  estimatedCreditsPerMonth: ${m.estimatedCreditsPerMonth}`)
  console.log(`  judgeEnabled: ${m.judgeEnabled}`)
  console.log('\nSave this monitor id. To trigger a check now: POST /v2/monitor/<id>/run')
}
main().catch((e) => { console.error(e); process.exit(1) })
