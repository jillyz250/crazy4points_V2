#!/usr/bin/env node
/**
 * gsc-pull — first Search Console pull for the analytics dashboard (Jill, 2026-09-02).
 * Reads the service-account key by PATH from .env.local (GSC_KEY_FILE); the secret
 * value never appears in code or chat. Read-only scope. Prints top queries + top pages
 * for the last 28 days so we can eyeball that the numbers are sane before building tiles.
 */
import { JWT } from 'google-auth-library'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const keyPath = env.GSC_KEY_FILE
const site = env.GSC_PROPERTY_URL
if (!keyPath || !site) { console.log('missing GSC_KEY_FILE or GSC_PROPERTY_URL in .env.local'); process.exit(1) }

const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
const client = new JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
})

const d = (offset) => new Date(Date.now() - offset * 864e5).toISOString().slice(0, 10)
const endDate = d(3)   // GSC data lags ~2-3 days
const startDate = d(31)

async function query(dimensions, rowLimit = 15) {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`
  const res = await client.request({ url, method: 'POST', data: { startDate, endDate, dimensions, rowLimit } })
  return res.data.rows || []
}

try {
  console.log(`Search Console — ${site}\nwindow: ${startDate} to ${endDate} (28 days)\n`)
  const queries = await query(['query'])
  console.log('TOP SEARCH QUERIES (what people type to find you):')
  if (!queries.length) console.log('  (no query data yet — new/low-traffic property)')
  for (const r of queries) console.log(`  ${String(r.clicks).padStart(4)} clicks  ${String(r.impressions).padStart(6)} impr  pos ${r.position.toFixed(1).padStart(4)}   ${r.keys[0]}`)

  const pages = await query(['page'])
  console.log('\nTOP PAGES (which pages earn search traffic):')
  if (!pages.length) console.log('  (no page data yet)')
  for (const r of pages) console.log(`  ${String(r.clicks).padStart(4)} clicks  ${String(r.impressions).padStart(6)} impr   ${r.keys[0].replace('https://www.crazy4points.com', '')}`)

  // 28-day totals
  const totals = await query([], 1)
  const t = totals[0] || {}
  console.log(`\n28-DAY TOTALS: ${t.clicks || 0} clicks · ${t.impressions || 0} impressions · avg position ${t.position ? t.position.toFixed(1) : 'n/a'}`)
} catch (e) {
  const msg = e?.response?.data?.error?.message || e.message
  console.log('GSC API error:', msg)
  if (/permission|forbidden/i.test(msg)) console.log('\n-> Likely the property FORMAT. If your GSC property is a "Domain" property, set GSC_PROPERTY_URL=sc-domain:crazy4points.com instead of the https URL.')
}
