#!/usr/bin/env node
/**
 * verify-chart-urls.mjs — Firecrawl-based chart URL verifier
 *
 * Fetches each candidate partner_chart_url via Firecrawl (which handles
 * anti-bot / JS rendering — built-in WebFetch can't) and checks whether
 * the returned markdown contains chart-like signals:
 *   - markdown tables
 *   - numbers in thousands paired with miles/Avios/points/zone keywords
 *
 * Outputs a yes / no / maybe verdict per URL so the curator only has
 * to manually spot-check the maybes.
 *
 * USAGE:
 *   node scripts/verify-chart-urls.mjs
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function loadEnv() {
  try {
    const text = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
    }
  } catch {}
}

// The 12 candidate URLs from yesterday's WebSearch round.
// Aer Lingus is already verified-yes by Jill (zone chart with Avios costs)
// — including it here as a control to confirm the script works.
const CANDIDATES = [
  { slug: 'aer-lingus',       url: 'https://www.aerlingus.com/media/pdfs/EI_routes_avios_amounts.pdf' },
  { slug: 'united',           url: 'https://www.united.com/en/us/fly/mileageplus/air-awards.html' },
  { slug: 'avianca',          url: 'https://www.avianca.com/us/en/experience/lifemiles-program/how-to-accumulate-redeem-lifemiles/' },
  { slug: 'aegean',           url: 'https://en.aegeanair.com/milesandbonus/how-to-spend/' },
  { slug: 'etihad',           url: 'https://www.etihadguest.com/en/spend-miles/new-redemption-tables.html' },
  { slug: 'finnair',          url: 'https://www.finnair.com/us-en/finnair-plus/collect-and-use-avios/use-avios-on-award-flights-with-partners' },
  { slug: 'eva-air',          url: 'https://www.evaair.com/en-us/infinity-mileagelands/mileage-award-program/mileage-redemption/' },
  { slug: 'virgin-australia', url: 'https://www.velocityfrequentflyer.com/flying-status/use-points-for-flights' },
  { slug: 'aeromexico',       url: 'https://www.aeromexico.com/en-us/aeromexico-rewards/award-ticket' },
  { slug: 'air-china',        url: 'https://www.airchina.us/US/GB/phoenix-miles/' },
  { slug: 'emirates',         url: 'https://www.emirates.com/us/english/skywards/spend-miles/' },
  { slug: 'latam',            url: 'https://latampass.latam.com/en_us/redeem-miles/redeem-your-latam-pass-miles' },
  { slug: 'saudia',           url: 'https://www.saudia.com/loyalty-program/about-alfursan-program/alfursan-miles/miles-redemption/skyteam-reward-table' },
  { slug: 'thai',             url: 'https://www.thaiairways.com/static/common/pdf/royal_orchid_plus/Redeeming/Star_Alliance_Chart2.pdf' },
  { slug: 'asiana',           url: 'https://flyasiana.com/C/US/EN/contents/star-alliance-mileage-tickets' },
]

async function scrape(url) {
  const body = {
    url,
    formats: ['markdown'],
    onlyMainContent: true,
    timeout: 60000,
  }
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(75000),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return { ok: false, error: `${res.status}: ${text.slice(0, 200)}` }
  }
  const data = await res.json()
  if (!data.success) return { ok: false, error: 'success=false' }
  return { ok: true, markdown: data.data?.markdown ?? '' }
}

function classify(markdown) {
  if (!markdown || markdown.length < 200) return { verdict: 'no', reason: 'page empty or too short' }

  const md = markdown.toLowerCase()

  // Signal 1: markdown table rows (multiple `|...|` lines)
  const tableRows = (markdown.match(/^\s*\|[^\n]+\|\s*$/gm) ?? []).length

  // Signal 2: chart-style numbers (4,000 / 25,000 / 60K / 80K)
  const milesNumbers = (markdown.match(/\b\d{1,3}[,.]?\d{3}\b/g) ?? []).length
  const kNumbers = (markdown.match(/\b\d{2,3}\s*[Kk]\b/g) ?? []).length

  // Signal 3: keyword density (miles, avios, points, zone, region, off-peak/peak, cabin classes)
  const kwHits =
    (md.match(/\bmiles\b/g) ?? []).length +
    (md.match(/\bavios\b/g) ?? []).length +
    (md.match(/\bpoints\b/g) ?? []).length +
    (md.match(/\bzone\b/g) ?? []).length +
    (md.match(/\bregion\b/g) ?? []).length +
    (md.match(/\boff[- ]peak\b/g) ?? []).length

  // Negative signals: dynamic-pricing / calculator-only language
  const dynamicHits =
    (md.match(/dynamic pricing/g) ?? []).length +
    (md.match(/varies/g) ?? []).length +
    (md.match(/calculator/g) ?? []).length +
    (md.match(/search for flights/g) ?? []).length +
    (md.match(/promo reward/g) ?? []).length

  const score =
    (tableRows >= 6 ? 4 : tableRows >= 3 ? 2 : 0) +
    (milesNumbers >= 10 ? 3 : milesNumbers >= 5 ? 1 : 0) +
    (kNumbers >= 5 ? 2 : 0) +
    (kwHits >= 8 ? 2 : kwHits >= 4 ? 1 : 0) -
    (dynamicHits >= 3 ? 2 : dynamicHits >= 1 ? 1 : 0)

  if (score >= 6) return { verdict: 'YES', reason: `tables:${tableRows} nums:${milesNumbers} k:${kNumbers} kw:${kwHits} dyn:${dynamicHits}` }
  if (score >= 3) return { verdict: 'MAYBE', reason: `tables:${tableRows} nums:${milesNumbers} k:${kNumbers} kw:${kwHits} dyn:${dynamicHits}` }
  return { verdict: 'NO', reason: `tables:${tableRows} nums:${milesNumbers} k:${kNumbers} kw:${kwHits} dyn:${dynamicHits}` }
}

async function main() {
  loadEnv()
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error('FIRECRAWL_API_KEY missing from .env.local')
    process.exit(1)
  }

  console.log(`Verifying ${CANDIDATES.length} chart URLs via Firecrawl…\n`)

  const results = []
  for (const c of CANDIDATES) {
    process.stdout.write(`  ${c.slug.padEnd(22)} `)
    try {
      const r = await scrape(c.url)
      if (!r.ok) {
        results.push({ ...c, verdict: 'ERROR', reason: r.error })
        console.log(`ERROR ${r.error}`)
        continue
      }
      const cls = classify(r.markdown)
      results.push({ ...c, verdict: cls.verdict, reason: cls.reason, length: r.markdown.length })
      console.log(`${cls.verdict.padEnd(6)} ${cls.reason}`)
    } catch (err) {
      results.push({ ...c, verdict: 'ERROR', reason: String(err).slice(0, 100) })
      console.log(`ERROR ${String(err).slice(0, 100)}`)
    }
  }

  console.log('\n=== Summary ===')
  for (const v of ['YES', 'MAYBE', 'NO', 'ERROR']) {
    const matches = results.filter((r) => r.verdict === v)
    if (matches.length === 0) continue
    console.log(`\n${v} (${matches.length}):`)
    for (const r of matches) {
      console.log(`  ${r.slug.padEnd(22)} ${r.url}`)
    }
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
