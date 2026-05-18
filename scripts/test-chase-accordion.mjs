#!/usr/bin/env node
/**
 * test-chase-accordion.mjs — Sleuth investigation harness.
 *
 * Tries multiple Firecrawl strategies against the Chase Ink Business Cash
 * product page to find one that successfully extracts the Travel & purchase
 * coverage section (Auto Rental CDW, Purchase Protection, Extended Warranty).
 *
 * Run:
 *   node scripts/test-chase-accordion.mjs [test=A|B|C|D|E|all]
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

function loadEnv() {
  // Try worktree-local first, then parent project root.
  const candidates = [
    join(process.cwd(), '.env.local'),
    '/Users/jillzeller/Desktop/Github/crazy4points_V2/.env.local',
  ]
  for (const p of candidates) {
    try {
      const text = readFileSync(p, 'utf8')
      for (const line of text.split('\n')) {
        const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
      }
      return p
    } catch {}
  }
  return null
}
const envFile = loadEnv()
console.log('env loaded from:', envFile)

const apiKey = process.env.FIRECRAWL_API_KEY
if (!apiKey) {
  console.error('FIRECRAWL_API_KEY missing')
  process.exit(1)
}

const URL = 'https://creditcards.chase.com/business-credit-cards/ink/cash'
const OUT = '/tmp/chase-sleuth'
mkdirSync(OUT, { recursive: true })

const INSURANCE_MARKERS = [
  /auto\s*rental/i,
  /purchase\s*protection/i,
  /extended\s*warranty/i,
  /roadside/i,
  /travel\s*(and|&)\s*emergency/i,
]

function score(text) {
  if (!text) return { count: 0, found: [], chars: 0 }
  const found = INSURANCE_MARKERS.filter((re) => re.test(text)).map((re) => re.source)
  return { count: found.length, found, chars: text.length }
}

async function callFirecrawl(label, body) {
  console.log(`\n=== ${label} ===`)
  const start = Date.now()
  let res
  try {
    res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    })
  } catch (err) {
    console.error(`  ! fetch error: ${err.message}`)
    return null
  }
  const ms = Date.now() - start
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    console.error(`  ! HTTP ${res.status} in ${ms}ms: ${t.slice(0, 300)}`)
    return null
  }
  const json = await res.json()
  const md = json?.data?.markdown || ''
  const html = json?.data?.rawHtml || json?.data?.html || ''
  const mdScore = score(md)
  const htmlScore = score(html)
  console.log(`  ms=${ms}  md=${mdScore.chars}ch markers=${mdScore.count}/${INSURANCE_MARKERS.length}  html=${htmlScore.chars}ch markers=${htmlScore.count}/${INSURANCE_MARKERS.length}`)
  if (mdScore.count) console.log('  md hits:', mdScore.found.join(', '))
  if (htmlScore.count) console.log('  html hits:', htmlScore.found.join(', '))
  const safe = label.replace(/[^a-z0-9]+/gi, '_').toLowerCase()
  if (md) writeFileSync(`${OUT}/${safe}.md`, md)
  if (html) writeFileSync(`${OUT}/${safe}.html`, html)
  return { label, mdScore, htmlScore, ms }
}

const EXPAND_SCRIPT = `
  (() => {
    document.querySelectorAll('details').forEach(d => { d.open = true });
    const revealRegex = /show\\s*more|view\\s*all|see\\s*all|expand|read\\s*more|view\\s*details|travel|purchase|coverage|protection/i;
    document.querySelectorAll('button, [role=button], a[aria-expanded], [aria-controls]').forEach(el => {
      try {
        const t = (el.textContent||'').trim();
        const exp = el.getAttribute('aria-expanded');
        if (exp === 'false' || revealRegex.test(t)) el.click();
      } catch(e){}
    });
    document.querySelectorAll('[aria-hidden=true], [hidden]').forEach(el => {
      try {
        el.removeAttribute('aria-hidden');
        el.removeAttribute('hidden');
        el.style.display = 'block';
        el.style.visibility = 'visible';
        el.style.height = 'auto';
        el.style.maxHeight = 'none';
      } catch(e){}
    });
  })();
`

const tests = {
  A_rawHtml: {
    url: URL,
    formats: ['rawHtml', 'markdown'],
    onlyMainContent: true,
    waitFor: 4000,
    maxAge: 0,
  },
  B_onlyMainContentFalse: {
    url: URL,
    formats: ['markdown', 'rawHtml'],
    onlyMainContent: false,
    waitFor: 4000,
    maxAge: 0,
  },
  C_stealth: {
    url: URL,
    formats: ['markdown', 'rawHtml'],
    onlyMainContent: false,
    waitFor: 4000,
    proxy: 'stealth',
    maxAge: 0,
  },
  D_aggressiveExpand: {
    url: URL,
    formats: ['markdown', 'rawHtml'],
    onlyMainContent: false,
    waitFor: 3000,
    maxAge: 0,
    timeout: 90_000,
    actions: [
      { type: 'wait', milliseconds: 2000 },
      { type: 'scroll', direction: 'down' },
      { type: 'scroll', direction: 'down' },
      { type: 'scroll', direction: 'down' },
      { type: 'wait', milliseconds: 1000 },
      { type: 'executeJavascript', script: EXPAND_SCRIPT },
      { type: 'wait', milliseconds: 2500 },
      { type: 'executeJavascript', script: EXPAND_SCRIPT },
      { type: 'wait', milliseconds: 2000 },
    ],
  },
  E_screenshot: {
    url: URL,
    formats: ['markdown', 'screenshot'],
    onlyMainContent: false,
    waitFor: 8000,
    maxAge: 0,
  },
}

const which = (process.argv[2] || 'all').replace(/^test=/, '')
const order = which === 'all' ? Object.keys(tests) : [Object.keys(tests).find(k => k.startsWith(which.toUpperCase() + '_')) || which]
const results = []
for (const key of order) {
  const body = tests[key]
  if (!body) { console.error('unknown test', key); continue }
  const r = await callFirecrawl(key, body)
  if (r) results.push(r)
}

console.log('\n=== SUMMARY ===')
for (const r of results) {
  console.log(`${r.label.padEnd(28)} md=${r.mdScore.count}/${INSURANCE_MARKERS.length}  html=${r.htmlScore.count}/${INSURANCE_MARKERS.length}  (md ${r.mdScore.chars}ch, html ${r.htmlScore.chars}ch)`)
}
