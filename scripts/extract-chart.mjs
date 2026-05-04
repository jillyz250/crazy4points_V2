#!/usr/bin/env node
/**
 * extract-chart.mjs — Firecrawl structured-extract CLI
 *
 * Pulls clean JSON out of a published award chart (or any structured page)
 * by handing Firecrawl a JSON Schema describing what fields we want.
 *
 * Replaces the manual "read scraped markdown -> hand-write SQL" step that
 * was the bottleneck on partner_redemptions seeding.
 *
 * USAGE:
 *   node scripts/extract-chart.mjs --url=<page-url> --schema=schemas/<file>.json
 *   node scripts/extract-chart.mjs --url=<page-url> --schema=schemas/<file>.json --out=/tmp/result.json
 *
 *   # Re-runnable schemas live in scripts/schemas/.
 *   # Drop a new <type>-chart.json next to the existing ones for new program shapes.
 */

import { readFileSync, writeFileSync } from 'node:fs'
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

function parseArgs() {
  const args = { url: null, schema: null, out: null }
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--url=')) args.url = a.slice('--url='.length)
    else if (a.startsWith('--schema=')) args.schema = a.slice('--schema='.length)
    else if (a.startsWith('--out=')) args.out = a.slice('--out='.length)
  }
  if (!args.url || !args.schema) {
    console.error('Usage: extract-chart.mjs --url=<url> --schema=<path> [--out=<file>]')
    process.exit(1)
  }
  return args
}

async function extract({ url, schema }) {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['json'],
      jsonOptions: { schema },
      timeout: 45000,
    }),
    signal: AbortSignal.timeout(75000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Firecrawl ${res.status}: ${body.slice(0, 400)}`)
  }
  const data = await res.json()
  if (!data.success) throw new Error(`Firecrawl returned success=false: ${JSON.stringify(data).slice(0, 400)}`)
  return {
    json: data.data?.json,
    credits: data.data?.metadata?.creditsUsed,
    statusCode: data.data?.metadata?.statusCode,
  }
}

async function main() {
  loadEnv()
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error('FIRECRAWL_API_KEY missing from .env.local')
    process.exit(1)
  }

  const args = parseArgs()
  const schema = JSON.parse(readFileSync(args.schema, 'utf8'))

  console.error(`[extract] ${args.url}`)
  console.error(`[extract] schema: ${args.schema}`)
  const result = await extract({ url: args.url, schema })
  console.error(`[extract] credits=${result.credits} statusCode=${result.statusCode}`)

  const out = JSON.stringify(result.json, null, 2)
  if (args.out) {
    writeFileSync(args.out, out)
    console.error(`[extract] wrote ${args.out} (${out.length} bytes)`)
  } else {
    console.log(out)
  }
}

main().catch((err) => {
  console.error(`[extract] ${err.message}`)
  process.exit(1)
})
