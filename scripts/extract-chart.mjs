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
  const args = { url: null, schema: null, out: null, waitMs: null, clickSelector: null }
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--url=')) args.url = a.slice('--url='.length)
    else if (a.startsWith('--schema=')) args.schema = a.slice('--schema='.length)
    else if (a.startsWith('--out=')) args.out = a.slice('--out='.length)
    else if (a.startsWith('--wait=')) args.waitMs = parseInt(a.slice('--wait='.length), 10)
    else if (a.startsWith('--click=')) args.clickSelector = a.slice('--click='.length)
  }
  if (!args.url || !args.schema) {
    console.error('Usage: extract-chart.mjs --url=<url> --schema=<path> [--out=<file>] [--wait=<ms>] [--click=<selector>]')
    process.exit(1)
  }
  return args
}

async function extract({ url, schema, waitMs, clickSelector }) {
  const body = {
    url,
    formats: ['json'],
    jsonOptions: { schema },
    timeout: Math.max(45000, (waitMs ?? 0) + 30000),
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
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(body.timeout + 15000),
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
  if (args.waitMs) console.error(`[extract] waitFor: ${args.waitMs}ms`)
  if (args.clickSelector) console.error(`[extract] click: ${args.clickSelector}`)
  const result = await extract({ url: args.url, schema, waitMs: args.waitMs, clickSelector: args.clickSelector })
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
