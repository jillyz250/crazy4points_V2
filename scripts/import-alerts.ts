/**
 * One-time import script — seeds 8 alerts into Sanity.
 * All alerts are created with isApproved: false and require
 * manual approval in Sanity Studio before going live.
 *
 * Prerequisites:
 *   npm install @sanity/client dotenv
 *
 * Run:
 *   npx tsx scripts/import-alerts.ts
 */

import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

// Load from .env.local (Next.js convention)
dotenv.config({ path: '.env.local' })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const token     = process.env.SANITY_API_TOKEN

if (!projectId) {
  console.error('❌  NEXT_PUBLIC_SANITY_PROJECT_ID is not set in .env.local')
  process.exit(1)
}
if (!token) {
  console.error('❌  SANITY_API_TOKEN is not set in .env.local')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false, // writes must bypass CDN
})

// ── Slug generation ───────────────────────────────────────────────────────────

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Alert definitions ─────────────────────────────────────────────────────────

const PUBLISHED_AT = '2026-04-02T07:00:00.000Z'

const alerts = [
  {
    title: 'United MileagePlus Earn Rate Restructure',
    type: 'earn_rate_change',
    programs: ['united'],
    actionType: 'monitor',
    summary:
      'United MileagePlus cuts non-cardholder earn to 3 MPD, removes Basic Economy earning entirely, and launches Family Account Linking effective April 2, 2026.',
    impactScore: 4,
    impactJustification: 'Affects all United MileagePlus non-cardholder members immediately',
    valueScore: 4,
    confidenceLevel: 'high',
    startDate: '2026-04-02',
    endDate: null,
  },
  {
    title: 'Capital One Venture 75K + $250 Travel Credit',
    type: 'limited_time_offer',
    programs: ['capital_one'],
    actionType: 'apply',
    summary:
      'Capital One Venture offering 75,000 miles plus $250 travel credit for $4,000 spend in 3 months. Expires April 13, 2026.',
    impactScore: 4,
    impactJustification: 'Affects all Capital One Venture applicants — broad audience',
    valueScore: 4,
    confidenceLevel: 'high',
    startDate: '2026-04-02',
    endDate: '2026-04-13',
  },
  {
    title: 'Citi ThankYou iPrefer Transfer Rate Devaluation',
    type: 'devaluation',
    programs: ['citi'],
    actionType: 'transfer',
    summary:
      'Citi ThankYou cutting iPrefer transfer rate from 1:4 to 1:2 and Choice Privileges from 1:1 to 1:0.75 effective April 19, 2026.',
    impactScore: 4,
    impactJustification: 'Affects all Citi ThankYou cardholders who transfer to hotel partners',
    valueScore: 5,
    confidenceLevel: 'high',
    startDate: '2026-04-02',
    endDate: '2026-04-19',
  },
  {
    title: 'Citi ThankYou Transfer Bonus — Virgin Atlantic 30% + Avianca 25%',
    type: 'transfer_bonus',
    programs: ['citi'],
    actionType: 'transfer',
    summary:
      'Citi ThankYou offering 30% bonus to Virgin Atlantic Flying Club and 25% bonus to Avianca LifeMiles. Both expire April 18, 2026.',
    impactScore: 3,
    impactJustification:
      'Relevant to Citi ThankYou cardholders with Virgin Atlantic or Avianca redemptions planned',
    valueScore: 3,
    confidenceLevel: 'high',
    startDate: '2026-04-02',
    endDate: '2026-04-18',
  },
  {
    title: 'Cathay Pacific Asia Miles Devaluation — May 1',
    type: 'devaluation',
    programs: ['amex', 'chase', 'citi', 'capital_one'],
    actionType: 'book',
    summary:
      'Cathay Pacific increasing Asia Miles redemption rates for long-haul business class effective May 1, 2026. Book by April 30 at current rates.',
    impactScore: 3,
    impactJustification:
      'Affects anyone holding transferable points planning Cathay Pacific business class',
    valueScore: 4,
    confidenceLevel: 'high',
    startDate: '2026-04-02',
    endDate: '2026-04-30',
  },
  {
    title: 'Hyatt 5-Tier Category Change — May 2026',
    type: 'category_change',
    programs: ['hyatt'],
    actionType: 'book',
    summary:
      'World of Hyatt replacing 3-tier peak/off-peak pricing with a 5-tier model in May 2026. Category 8 top rate jumping from 45K to 75K points.',
    impactScore: 4,
    impactJustification: 'Affects all World of Hyatt members — major award chart restructure',
    valueScore: 5,
    confidenceLevel: 'high',
    startDate: '2026-04-02',
    endDate: null,
  },
  {
    title: 'AAdvantage Barclays to Citi Card Conversion',
    type: 'program_change',
    programs: ['aa'],
    actionType: 'monitor',
    summary:
      'Barclays AAdvantage Aviator cards converting to Citi on April 24, 2026. Cardholders should verify account details and update autopay before conversion.',
    impactScore: 3,
    impactJustification: 'Affects all Barclays AAdvantage Aviator cardholders',
    valueScore: 3,
    confidenceLevel: 'high',
    startDate: '2026-04-02',
    endDate: '2026-04-24',
  },
  {
    title: 'Choice Privileges 100% Transfer Bonus to Flying Blue',
    type: 'transfer_bonus',
    programs: ['flying_blue'],
    actionType: 'transfer',
    summary:
      'Choice Privileges offering 100% transfer bonus to Air France-KLM Flying Blue through April 24, 2026.',
    impactScore: 3,
    impactJustification:
      'Relevant to anyone holding Choice Privileges points with Flying Blue redemptions planned',
    valueScore: 5,
    confidenceLevel: 'high',
    startDate: '2026-04-02',
    endDate: '2026-04-24',
  },
]

// ── Import ────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n🚀  Importing ${alerts.length} alerts into Sanity`)
  console.log(`    Project: ${projectId}  |  Dataset: ${dataset}\n`)

  let created = 0
  let failed  = 0

  for (const alert of alerts) {
    const slug = slugify(alert.title)
    const doc = {
      _type: 'alert',
      title: alert.title,
      slug: { _type: 'slug', current: slug },
      summary: alert.summary,
      type: alert.type,
      programs: alert.programs,
      actionType: alert.actionType,
      startDate: alert.startDate,
      ...(alert.endDate ? { endDate: alert.endDate } : {}),
      publishedAt: PUBLISHED_AT,
      impactScore: alert.impactScore,
      impactJustification: alert.impactJustification,
      valueScore: alert.valueScore,
      confidenceLevel: alert.confidenceLevel,
      isApproved: false,
    }

    try {
      const result = await client.create(doc)
      console.log(`  ✅  ${alert.title}`)
      console.log(`      _id: ${result._id}  |  slug: ${slug}`)
      created++
    } catch (err) {
      console.error(`  ❌  ${alert.title}`)
      console.error(`      ${err instanceof Error ? err.message : String(err)}`)
      failed++
    }
  }

  console.log(`\n──────────────────────────────────────────`)
  console.log(`  Created: ${created}  |  Failed: ${failed}`)
  console.log(`\n  All alerts are isApproved: false.`)
  console.log(`  Approve them individually in Sanity Studio before they go live.\n`)
}

run()
