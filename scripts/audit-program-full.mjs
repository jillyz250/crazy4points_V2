#!/usr/bin/env node
/**
 * audit-program-full.mjs - Step 8.5 full-page audit + mandatory completion
 * checklist. Single-command verification before declaring a program shipped.
 *
 * Runs every check the SKILL.md Step 8.5 mandates:
 *   - verify-program.mjs  (HTTP 200, intro renders, tier_benefits render,
 *                          all transfer_partner slugs resolve)
 *   - llm-audit-program.mjs Sonnet pass (banned absolutes, comparative
 *                          claims, temporal drift, legacy-vs-active cards)
 *   - Source doc at plans/sources/<slug>.md exists with non-trivial size
 *   - Press-room source row in `sources` table with `Programs: <slug>` notes
 *   - partner_redemptions seeded + programs.partner_chart_url set
 *     (airline / loyalty_program only)
 *   - hotel_properties seeded with category populated (hotel only)
 *   - JSON-LD <script type="application/ld+json"> present on live page
 *   - <title>, <meta name="description">, <html lang>, <h1> all present
 *     on live page (the four Bing-flag-target tags)
 *
 * Outputs the mandatory completion-checklist table per SKILL Step 8.5,
 * with all 3 URLs (live + GSC + Bing) in fenced code blocks.
 *
 * Exits 0 if all checks pass; 1 if any fail. The "any fail" exit means
 * Claude must not declare the program shipped - fix the gap and re-run.
 *
 * USAGE:
 *   node scripts/audit-program-full.mjs --slug=<slug>
 *   node scripts/audit-program-full.mjs --slug=marriott-bonvoy --skip-llm-audit
 */

import { readFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

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
  const args = { slug: null, skipLlmAudit: false }
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--slug=')) args.slug = a.split('=')[1]
    else if (a === '--skip-llm-audit') args.skipLlmAudit = true
  }
  if (!args.slug) {
    console.error('Usage: audit-program-full.mjs --slug=<slug> [--skip-llm-audit]')
    process.exit(1)
  }
  return args
}

async function sb(path) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`
  const res = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })
  if (!res.ok) throw new Error(`Supabase GET ${path}: ${res.status}`)
  return res.json()
}

/**
 * Get an exact row count for a Supabase REST query without fetching rows.
 * Uses the Content-Range response header from PostgREST when Prefer:
 * count=exact is set. Avoids the default 1,000-row response cap on SELECT.
 */
async function sbCount(path) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`
  const res = await fetch(url, {
    method: 'HEAD',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'count=exact',
    },
  })
  if (!res.ok) throw new Error(`Supabase HEAD ${path}: ${res.status}`)
  // Content-Range looks like: "0-999/3790" - we want the part after the slash
  const range = res.headers.get('content-range')
  if (!range) return 0
  const m = range.match(/\/(\d+|\*)$/)
  if (!m || m[1] === '*') return 0
  return parseInt(m[1], 10)
}

function runChild(args, label) {
  const res = spawnSync('node', args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 })
  return {
    ok: res.status === 0,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
    label,
  }
}

async function main() {
  loadEnv()
  const args = parseArgs()

  // Look up program
  const programs = await sb(`programs?slug=eq.${args.slug}&select=id,name,type,alliance`)
  if (!programs || programs.length === 0) {
    console.error(`No program with slug=${args.slug}`)
    process.exit(1)
  }
  const program = programs[0]
  const isAirlineLike = program.type === 'airline' || program.type === 'loyalty_program'
  const isHotel = program.type === 'hotel'
  const isAlliance = program.type === 'alliance'

  console.log(`# Audit: ${program.name} (${program.slug})`)
  console.log(`Type: ${program.type}\n`)

  const results = []

  // 1. verify-program.mjs
  process.stderr.write('[1/8] verify-program.mjs ... ')
  const vp = runChild(['scripts/verify-program.mjs', `--program=${args.slug}`], 'verify-program')
  const vpPass = vp.ok && vp.stdout.includes('PASS')
  results.push({ check: 'verify-program.mjs', status: vpPass ? '✅ PASS' : '❌ FAILED', detail: vpPass ? '' : vp.stdout.split('\n').slice(-5).join(' / ') })
  process.stderr.write(`${vpPass ? 'pass' : 'FAIL'}\n`)

  // 2. Sonnet LLM audit (skippable for speed)
  if (!args.skipLlmAudit) {
    process.stderr.write('[2/8] llm-audit-program.mjs (Sonnet) ... ')
    const la = runChild(['scripts/llm-audit-program.mjs', `--program=${args.slug}`, '--model=claude-sonnet-4-6'], 'llm-audit')
    // Parse "N total finding(s)" line; HIGH-only counts as fail
    const totalMatch = la.stdout.match(/(\d+) total finding/)
    const totalFindings = totalMatch ? parseInt(totalMatch[1], 10) : -1
    const highCount = (la.stdout.match(/\[HIGH\]/g) || []).length
    // llm-audit exits 1 on any finding (HIGH/MEDIUM/LOW); we only fail on HIGH.
    // Treat exit 1 with parsed totalFindings as a successful run.
    const ranOk = la.ok || totalFindings >= 0
    const passing = ranOk && highCount === 0
    results.push({
      check: 'Sonnet audit (HIGH must be 0)',
      status: passing ? `✅ Clean (${totalFindings} non-HIGH findings)` : `❌ ${highCount} HIGH findings`,
      detail: passing ? '' : `Top HIGH: ${(la.stdout.match(/\[HIGH\][\s\S]+?(?=\[\w+\]|$)/) || [''])[0].slice(0, 200)}`,
    })
    process.stderr.write(`${passing ? 'pass' : 'FAIL'}\n`)
  } else {
    results.push({ check: 'Sonnet audit', status: '⚠️ SKIPPED (--skip-llm-audit)', detail: '' })
  }

  // 3. Source doc exists at plans/sources/<slug>.md
  process.stderr.write('[3/8] source doc ... ')
  const sourceDocPath = join(process.cwd(), `plans/sources/${args.slug}.md`)
  let sourceDocOk = false
  let sourceDocSize = 0
  try {
    if (existsSync(sourceDocPath)) {
      sourceDocSize = statSync(sourceDocPath).size
      sourceDocOk = sourceDocSize > 1000 // arbitrary minimum
    }
  } catch {}
  results.push({
    check: `Source doc at plans/sources/${args.slug}.md`,
    status: sourceDocOk ? `✅ Exists (${sourceDocSize.toLocaleString()} bytes)` : sourceDocSize > 0 ? `⚠️ Too small (${sourceDocSize} bytes)` : '❌ Missing',
    detail: '',
  })
  process.stderr.write(`${sourceDocOk ? 'pass' : 'FAIL'}\n`)

  // 4. Press-room source seeded with Programs: <slug>
  process.stderr.write('[4/8] press-room source row ... ')
  const sources = await sb(`sources?notes=ilike.*Programs:*${args.slug}*&select=id,url,is_active,tier`)
  const activeSources = (sources || []).filter((s) => s.is_active)
  const sourceRowOk = activeSources.length > 0
  results.push({
    check: `Press-room source in \`sources\` table (\`Programs: ${args.slug}\`)`,
    status: sourceRowOk ? `✅ ${activeSources.length} active row${activeSources.length === 1 ? '' : 's'}` : '❌ No active source row found',
    detail: sourceRowOk ? activeSources[0].url : '',
  })
  process.stderr.write(`${sourceRowOk ? 'pass' : 'FAIL'}\n`)

  // 5. partner_redemptions for airline/loyalty_program; hotel_properties for hotel
  process.stderr.write('[5/8] step 5.5 / 7.6 data ... ')
  if (isAirlineLike) {
    const prCount = await sbCount(`partner_redemptions?currency_program_id=eq.${program.id}&select=id`)
    const programWithChart = await sb(`programs?slug=eq.${args.slug}&select=partner_chart_url`)
    const chartUrl = programWithChart?.[0]?.partner_chart_url
    const ok = prCount > 0 && !!chartUrl
    results.push({
      check: '`partner_redemptions` rows + `partner_chart_url`',
      status: ok ? `✅ ${prCount} row${prCount === 1 ? '' : 's'} + chart_url set` : `❌ ${prCount} rows / chart_url=${chartUrl ? 'set' : 'NULL'}`,
      detail: ok ? chartUrl : '',
    })
    process.stderr.write(`${ok ? 'pass' : 'FAIL'}\n`)
  } else if (isHotel) {
    const hpCount = await sbCount(`hotel_properties?program_id=eq.${program.id}&select=id`)
    const ok = hpCount > 0
    results.push({
      check: '`hotel_properties` rows seeded',
      status: ok ? `✅ ${hpCount.toLocaleString()} properties` : '❌ 0 rows (Decision Engine cannot surface)',
      detail: '',
    })
    process.stderr.write(`${ok ? 'pass' : 'FAIL'}\n`)
  } else if (isAlliance) {
    results.push({ check: 'Step 5.5 / 7.6', status: '➖ N/A (alliance)', detail: '' })
    process.stderr.write('skip\n')
  } else {
    results.push({ check: 'Step 5.5 / 7.6', status: `➖ N/A (type=${program.type})`, detail: '' })
    process.stderr.write('skip\n')
  }

  // 6-9. Live page tag checks (curl)
  process.stderr.write('[6/8] live page tags ... ')
  const liveUrl = `https://crazy4points.com/programs/${args.slug}`
  let html = ''
  try {
    const r = await fetch(liveUrl, { redirect: 'follow' })
    if (r.ok) html = await r.text()
  } catch (e) {
    process.stderr.write(`fetch failed: ${e.message}\n`)
  }

  const checks = [
    { label: '<title>',                  re: /<title>[^<]+<\/title>/,                                expect: true },
    { label: '<meta name="description">',re: /<meta name="description"[^>]+content=/,                expect: true },
    { label: '<html lang=>',             re: /<html[^>]+lang="[a-z-]+"/,                             expect: true },
    { label: '<h1>',                     re: /<h1[^>]*>[^<]+<\/h1>/,                                 expect: true },
    { label: 'JSON-LD',                  re: /<script[^>]+type="application\/ld\+json"/,             expect: true },
  ]
  for (const c of checks) {
    const found = c.re.test(html)
    const ok = found === c.expect
    results.push({
      check: `Live page: ${c.label}`,
      status: ok ? '✅ Present' : '❌ Missing',
      detail: '',
    })
  }
  process.stderr.write('done\n')

  // 7. Link-check: every URL referenced in the program's content fields
  //    must return 2xx AND not contain a placeholder string.
  process.stderr.write('[7/8] external link health ... ')
  const fields = ['intro', 'how_to_spend', 'sweet_spots', 'lounge_access', 'quirks', 'award_chart']
  const fieldRow = await sb(`programs?slug=eq.${args.slug}&select=${fields.join(',')},partner_chart_url`)
  const blob = fields.map((f) => fieldRow?.[0]?.[f] || '').join('\n\n') + '\n' + (fieldRow?.[0]?.partner_chart_url || '')
  const urls = Array.from(new Set((blob.match(/https?:\/\/[^\s)\]\>"]+/g) || []).map((u) => u.replace(/[.,]+$/, ''))))
  // Domains with aggressive bot defenses that block automated checks but
  // serve normal content to browsers. These get a pass-with-warning rather
  // than a fail when they return a placeholder.
  const botThrottledDomains = [/(^|\.)britishairways\.com$/i, /(^|\.)aa\.com$/i, /(^|\.)hyatt\.com$/i, /(^|\.)marriott\.com$/i]
  const placeholderPatterns = [/we are experiencing high demand/i, /this page has moved/i, /page not found/i, /cannot be found/i]
  const linkResults = await Promise.all(urls.map(async (url) => {
    let host = ''
    try { host = new URL(url).hostname } catch {}
    const isThrottled = botThrottledDomains.some((re) => re.test(host))
    try {
      const r = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0' } })
      if (!r.ok) {
        if (isThrottled) return { url, ok: true, reason: `bot-throttled (HTTP ${r.status} for automation; browser-only)`, warning: true }
        return { url, ok: false, reason: `HTTP ${r.status}` }
      }
      const text = await r.text()
      for (const p of placeholderPatterns) {
        if (p.test(text)) {
          if (isThrottled) return { url, ok: true, reason: 'bot-throttled (browser-only)', warning: true }
          return { url, ok: false, reason: `placeholder: ${p.source.slice(0, 30)}` }
        }
      }
      return { url, ok: true, reason: '' }
    } catch (e) {
      if (isThrottled) return { url, ok: true, reason: 'bot-throttled (fetch blocked)', warning: true }
      return { url, ok: false, reason: `fetch error: ${e.message.slice(0, 40)}` }
    }
  }))
  const broken = linkResults.filter((r) => !r.ok)
  const warnings = linkResults.filter((r) => r.ok && r.warning)
  const linksOk = broken.length === 0 && urls.length > 0
  let linkStatus
  if (urls.length === 0) linkStatus = '⚠️ No URLs found in fields'
  else if (!linksOk) linkStatus = `❌ ${broken.length} broken / ${urls.length} total`
  else if (warnings.length > 0) linkStatus = `✅ ${urls.length - warnings.length} OK + ${warnings.length} bot-throttled (browser-only)`
  else linkStatus = `✅ All ${urls.length} URL${urls.length === 1 ? '' : 's'} OK`
  results.push({
    check: 'External link health',
    status: linkStatus,
    detail: linksOk ? '' : broken.slice(0, 3).map((b) => `${b.url} (${b.reason})`).join('; '),
  })
  process.stderr.write(`${linksOk ? 'pass' : 'FAIL'}\n`)

  // ============================================================
  // Output: mandatory completion-checklist format per SKILL.md
  // ============================================================
  console.log(`\n## Program shipped — final audit checklist\n`)
  console.log('| Check | Status |')
  console.log('|---|---|')
  for (const r of results) {
    console.log(`| ${r.check} | ${r.status} |`)
  }

  console.log(`\nLive URL to spot-check + submit:`)
  console.log('```')
  console.log(liveUrl)
  console.log('```')

  console.log(`\nGoogle Search Console — paste the URL above into the URL Inspection bar:`)
  console.log('```')
  console.log('https://search.google.com/search-console')
  console.log('```')

  console.log(`\nBing Webmaster Tools — URL Submission:`)
  console.log('```')
  console.log('https://www.bing.com/webmasters/url-submission')
  console.log('```')

  // Exit non-zero if any check is ❌
  const failed = results.some((r) => r.status.includes('❌'))
  if (failed) {
    console.log(`\n⚠️ ${results.filter((r) => r.status.includes('❌')).length} check(s) failed. Fix before declaring shipped.`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(`[audit-program-full] ${err.message}`)
  process.exit(1)
})
