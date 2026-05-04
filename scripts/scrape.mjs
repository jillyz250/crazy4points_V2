#!/usr/bin/env node
/**
 * scrape.mjs — Firecrawl CLI wrapper
 *
 * Hits Firecrawl's /v1/scrape endpoint with default page-friendly settings
 * (markdown output, main content only) and prints clean markdown to stdout.
 *
 * Usage:
 *   node scripts/scrape.mjs <url> [--wait=<ms>] [--click=<selector>]
 *
 * Examples:
 *   node scripts/scrape.mjs https://www.alaskaair.com/atmosrewards/content/partners/airlines/malaysia-airlines
 *   node scripts/scrape.mjs https://www.aa.com/i18n/aadvantage-program/miles/partners/partner-airlines.jsp > /tmp/aa-partners.md
 *   node scripts/scrape.mjs https://www.marriott.com/loyalty/redeem/travel.mi --wait=8000
 *   node scripts/scrape.mjs https://www.hilton.com/honors/points-explorer --wait=5000 --click="button[aria-label='View chart']"
 *
 * --wait=<ms>     ms to wait for JS render before scraping (max 30000). Use on SPA sites.
 * --click=<sel>   CSS selector to click before scraping. Combined with --wait it triggers
 *                 JS-rendered chart toggles, "Show more" buttons, etc.
 *
 * Prereqs:
 *   - .env.local has FIRECRAWL_API_KEY (already true on this project)
 *   - Run from the project root so the dotenv lookup works
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Lightweight .env.local loader (no dependency)
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local')
    const text = readFileSync(envPath, 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
    }
  } catch {
    // .env.local missing is fine if env vars are already set
  }
}

async function scrape(url, { waitMs, clickSelector } = {}) {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    console.error('ERROR: FIRECRAWL_API_KEY not set. Run from project root with .env.local present.')
    process.exit(1)
  }

  const body = {
    url,
    formats: ['markdown'],
    onlyMainContent: true,
    timeout: Math.max(25000, (waitMs ?? 0) + 15000),
  }
  if (waitMs) body.waitFor = waitMs
  if (clickSelector) {
    body.actions = [
      { type: 'wait', milliseconds: Math.min(waitMs ?? 3000, 8000) },
      { type: 'click', selector: clickSelector },
      { type: 'wait', milliseconds: 3000 },
    ]
  }

  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(body.timeout + 10000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error(`ERROR: Firecrawl returned ${res.status}: ${errText.slice(0, 500)}`)
    process.exit(1)
  }

  const data = await res.json()
  if (!data?.success) {
    console.error(`ERROR: Firecrawl returned success=false: ${JSON.stringify(data).slice(0, 500)}`)
    process.exit(1)
  }

  const md = data?.data?.markdown ?? ''
  if (!md) {
    console.error('ERROR: Firecrawl returned no markdown.')
    process.exit(1)
  }

  console.log(md)
}

loadEnv()
const args = process.argv.slice(2)
const url = args.find((a) => !a.startsWith('--'))
const waitArg = args.find((a) => a.startsWith('--wait='))
const clickArg = args.find((a) => a.startsWith('--click='))
const waitMs = waitArg ? parseInt(waitArg.slice('--wait='.length), 10) : undefined
const clickSelector = clickArg ? clickArg.slice('--click='.length) : undefined

if (!url) {
  console.error('Usage: node scripts/scrape.mjs <url> [--wait=<ms>] [--click=<selector>]')
  process.exit(1)
}

scrape(url, { waitMs, clickSelector }).catch((err) => {
  console.error(`ERROR: ${err.message}`)
  process.exit(1)
})
