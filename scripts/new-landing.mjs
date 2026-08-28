#!/usr/bin/env node
/**
 * new-landing — spin up an ad-campaign landing page (/go/<slug>) from an existing
 * experience listing, in one command. This is the reusable rail: the NEXT
 * experience ad is `node scripts/new-landing.mjs ...`, not a rebuilt page.
 *
 * Auto-fills headline / image / deadline / outbound URL from the experience row;
 * override any field with a flag. Upserts by slug (safe to re-run to tweak).
 *
 * Usage:
 *   node scripts/new-landing.mjs \
 *     --experience "https://moments.marriottbonvoy.com/en-us/moments/22215/auction/116654" \
 *     --slug nd-unc-marriott-moment \
 *     --campaign nd-unc-marriott-moment \
 *     --eyebrow "College Football" \
 *     --headline "Get on the field at Notre Dame vs North Carolina" \
 *     --subhead "Bid Marriott points for tickets, a tailgate, and pregame field access." \
 *     --deadline-label "Bidding closes September 18" \
 *     --outbound-label "Bid on Marriott Bonvoy Moments" \
 *     --body "Two tickets at Kenan Memorial Stadium (Oct 3)|Two tailgate passes|Pregame field access for two|Swag bag"
 *
 * --experience accepts the experience_listings detail_url OR its id. Flags win
 * over auto-derived values; omit them to take the experience's own data.
 */
import { db, must } from './lib/db.mjs'

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const slug = arg('slug')
if (!slug) { console.error('Missing --slug'); process.exit(1) }
const expRef = arg('experience')

let exp = null
if (expRef) {
  const col = expRef.startsWith('http') ? 'detail_url' : 'id'
  const rows = await must(db.from('experience_listings').select('*').eq(col, expRef).limit(1))
  exp = rows[0] || null
  if (!exp) { console.error(`No experience found for ${col}=${expRef}`); process.exit(1) }
}

const bodyFlag = arg('body') // pipe-separated "what's included" lines
const row = {
  slug,
  eyebrow: arg('eyebrow', exp?.category ? exp.category[0].toUpperCase() + exp.category.slice(1) : null),
  headline: arg('headline', exp?.title || slug),
  subhead: arg('subhead', null),
  body_md: bodyFlag ? bodyFlag.split('|').map((s) => s.trim()).filter(Boolean).join('\n') : null,
  image_url: arg('image', exp?.image_url || null),
  deadline: arg('deadline', exp?.close_date || null),
  deadline_label: arg('deadline-label', null),
  outbound_url: arg('outbound', exp?.detail_url || null),
  outbound_label: arg('outbound-label', 'See the full offer'),
  utm_campaign: arg('campaign', slug),
  experience_id: exp?.id || null,
  active: true,
  updated_at: new Date().toISOString(),
}
if (!row.outbound_url) { console.error('Missing outbound URL (pass --outbound or an --experience with a detail_url)'); process.exit(1) }

const saved = await must(db.from('campaign_landings').upsert(row, { onConflict: 'slug' }).select('slug, utm_campaign'))
const s = saved[0]
const base = 'https://www.crazy4points.com'
console.log(`\n✅ Landing ready: ${base}/go/${s.slug}`)
console.log(`\nPaste THIS UTM'd URL into your Meta ad (Traffic objective):`)
console.log(`${base}/go/${s.slug}?utm_source=facebook&utm_medium=paid_social&utm_campaign=${s.utm_campaign}`)
console.log(`\nSignups from it are tagged source='campaign_landing', referrerPath='/go/${s.slug}'.`)
process.exit(0)
