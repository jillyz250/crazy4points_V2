#!/usr/bin/env node
/**
 * scrape-properties.mjs - Walk a hotel program's destination tree on the
 * chain's official site and seed hotel_properties for the Decision Engine.
 *
 * USAGE:
 *   node scripts/scrape-properties.mjs --slug=marriott-bonvoy --block=1
 *   node scripts/scrape-properties.mjs --slug=marriott-bonvoy --block=1 --dry-run
 *
 * BLOCK 1 SCOPE (top 6 US states ~ 1500-2500 properties):
 *   california, florida, texas, new-york-state, georgia, nevada
 *
 * APPROACH:
 *   - Read block list from data/destinations/<slug>.json
 *   - For each destination URL, paginate via ?pg=N until 2 consecutive
 *     pages return 0 new property codes (server-side pagination on
 *     marriott.com sometimes returns "anchor" hotels twice)
 *   - Parse hotel cards from markdown using regex on the URL pattern
 *     /hotels/<5-letter-code>-<slug>/
 *   - Infer brand from name; extract city/region/country from URL
 *   - Upsert into hotel_properties on (program_id, property_code)
 *
 * RUNTIME:
 *   - 1 Firecrawl credit per page (basic markdown scrape, no LLM extract)
 *   - ~17 new + 12 carryover hotels per page; large states need 5-25 pages
 *   - Block 1 estimate: ~180 credits, ~10 min runtime including Firecrawl
 *     rate-limit waits between requests
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

function parseArgs() {
  const args = { slug: null, block: null, config: null, dryRun: false, waitMs: 12000, maxPages: 30 }
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--slug=')) args.slug = a.split('=')[1]
    else if (a.startsWith('--block=')) args.block = parseInt(a.split('=')[1], 10)
    else if (a.startsWith('--config=')) args.config = a.split('=')[1]
    else if (a === '--dry-run') args.dryRun = true
    else if (a.startsWith('--wait=')) args.waitMs = parseInt(a.split('=')[1], 10)
    else if (a.startsWith('--max-pages=')) args.maxPages = parseInt(a.split('=')[1], 10)
  }
  if (!args.slug || !args.block) {
    console.error('Usage: scrape-properties.mjs --slug=<slug> --block=<N> [--config=<path>] [--dry-run] [--wait=<ms>] [--max-pages=<N>]')
    process.exit(1)
  }
  return args
}

async function sb(path, options = {}) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: options.method === 'POST' ? 'return=representation,resolution=merge-duplicates' : 'return=minimal',
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Supabase ${options.method ?? 'GET'} ${path}: ${res.status} ${body.slice(0, 300)}`)
  }
  if (res.status === 204) return null
  return res.json()
}

async function firecrawlOnce(url, waitMs) {
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: false,
        waitFor: waitMs,
        timeout: Math.max(45000, waitMs + 15000),
      }),
      signal: AbortSignal.timeout(Math.max(60000, waitMs + 30000)),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      const isTimeout = res.status === 408 || body.includes('SCRAPE_TIMEOUT') || body.includes('timed out')
      return { ok: false, retryable: isTimeout, error: `Firecrawl ${res.status}: ${body.slice(0, 200)}`, credits: 0 }
    }
    const data = await res.json()
    return {
      ok: data?.success ?? false,
      retryable: false,
      markdown: data?.data?.markdown ?? '',
      credits: data?.data?.metadata?.creditsUsed ?? 0,
    }
  } catch (err) {
    // AbortError from AbortSignal.timeout, network errors, etc.
    const msg = String(err?.message || err)
    const isTimeout = msg.includes('aborted') || msg.includes('timeout') || msg.includes('timed out')
    return { ok: false, retryable: isTimeout, error: `fetch threw: ${msg.slice(0, 200)}`, credits: 0 }
  }
}

async function firecrawl(url, waitMs) {
  // Retry up to 2x on timeout (Firecrawl's edge sometimes flakes on
  // bigger pages). Subsequent attempts use a longer wait window.
  let lastErr = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await firecrawlOnce(url, attempt === 1 ? waitMs : waitMs + 5000)
    if (r.ok) return r
    lastErr = r
    if (!r.retryable) return r
    process.stderr.write(`(retry ${attempt}/3) `)
    await new Promise((res) => setTimeout(res, 2000 * attempt))
  }
  return lastErr
}

/**
 * Parse hotel cards from Marriott destination-page markdown.
 * Each card emits a /hotels/<5-letter>-<name-slug>/ URL plus a name line.
 */
function parseHotels(markdown, urlContext) {
  // Marriott's hotel card pattern in markdown:
  //   ![image alt](image url)
  //   <Hotel Display Name>
  //   (<N> reviews)](https://www.marriott.com/en-US/hotels/<code>-<slug>/reviews/ "rating")
  //   <Description>
  // We regex out the property code + URL slug, then look up the display
  // name by walking back from the URL line.
  // Two-pass extraction:
  //   1. Loose regex catches every property code referenced anywhere in
  //      the markdown (URL paths, image alt, raw refs).
  //   2. For each code, search for a bracket-name match `[Name](...code-slug.../overview)`
  //      to grab the human-readable display name. Fall back to URL-slug
  //      title-casing if no bracket match.
  const codeRegex = /\bhotels\/([a-z]{5})-([a-z0-9-]+)\/(?:overview|reviews)\b/g
  const codeMap = new Map() // code -> urlSlug
  let cm
  while ((cm = codeRegex.exec(markdown)) !== null) {
    const code = cm[1].toUpperCase()
    if (!codeMap.has(code)) codeMap.set(code, cm[2])
  }

  const seen = new Map()
  for (const [code, urlSlug] of codeMap) {
    // Look up name by searching for `[Name](...code-slug.../`
    const nameRegex = new RegExp(`\\[([^\\]]+)\\]\\(https?:\\/\\/[^)]*hotels\\/${code.toLowerCase()}-${urlSlug}\\/(?:overview|reviews)`, 'i')
    const nameMatch = markdown.match(nameRegex)
    let name = nameMatch ? nameMatch[1].trim() : null

    // Skip non-hotel matches (sometimes brackets contain "reviews", "view rates", etc.)
    if (name) {
      const lower = name.toLowerCase()
      if (lower.length < 5) name = null
      else if (lower.includes('view rates') || lower.includes('view all') || lower.match(/^\(?\d+ reviews?\)?$/) || lower.startsWith('book ')) name = null
    }

    if (!name) {
      // Fallback: derive from URL slug (e.g. "ac-hotel-tokyo-ginza" -> "AC Hotel Tokyo Ginza")
      name = urlSlug
        .split('-')
        .map((w) => {
          // Common abbreviations that should stay uppercase
          if (['ac','jw','st','w','bvlgari','edition','dc','la','ny','sf','nyc'].includes(w)) return w.toUpperCase()
          return w.charAt(0).toUpperCase() + w.slice(1)
        })
        .join(' ')
    }

    seen.set(code, {
      property_code: code,
      name: cleanName(name),
      brand: inferBrand(name),
      hotel_url: `https://www.marriott.com/en-US/hotels/${code.toLowerCase()}-${urlSlug}/`,
      city: urlContext.city || null,
      state_or_province: urlContext.state_or_province || null,
      region: urlContext.region || null,
      country: urlContext.country || null,
      all_inclusive: name.toLowerCase().includes('all-inclusive') || name.toLowerCase().includes('all inclusive'),
    })
  }
  return [...seen.values()]
}

/**
 * Map ISO country code to the 4-bucket region the hotel_properties.region
 * CHECK constraint accepts: americas / europe / asia_pacific / middle_east_africa.
 */
function regionForCountry(country) {
  if (!country) return null
  const c = country.toUpperCase()
  if (['US','CA','MX','BR','AR','CL','CO','PE','UY','VE','EC','BO','PY','GT','HN','SV','NI','CR','PA','DO','BB','BS','JM','TT','PR','VI','GD','LC','VC','BZ','GY','SR','GF','MQ','GP','HT','CU','AW','CW','BM','KY'].includes(c)) return 'americas'
  if (['GB','IE','FR','DE','IT','ES','PT','NL','BE','LU','CH','AT','PL','CZ','SK','HU','RO','BG','GR','HR','SI','RS','BA','MK','AL','MT','CY','SE','NO','DK','FI','IS','EE','LV','LT','UA','BY','MD','RU','TR','VA','MC','SM','LI','AD','GI','FO'].includes(c)) return 'europe'
  if (['JP','CN','KR','TW','HK','MO','MN','VN','TH','MY','SG','PH','ID','MM','KH','LA','BD','LK','NP','BT','MV','PK','IN','AF','KZ','UZ','TM','KG','TJ','AU','NZ','FJ','PG','SB','WS','TO','VU','NC','PF','GU','MP','MH','FM','PW','KI','TV','NR','CK','NU'].includes(c)) return 'asia_pacific'
  if (['AE','SA','QA','BH','KW','OM','YE','IQ','IR','IL','PS','JO','LB','SY','EG','LY','TN','DZ','MA','EH','SD','SS','ET','ER','DJ','SO','KE','TZ','UG','RW','BI','MZ','ZW','MW','ZM','BW','NA','ZA','LS','SZ','MG','MU','SC','KM','SH','AO','CD','CG','CF','CM','GA','GQ','TD','NG','NE','BF','ML','SN','GM','GN','GW','SL','LR','CI','GH','TG','BJ','CV','ST','MR'].includes(c)) return 'middle_east_africa'
  return null
}

function cleanName(s) {
  // Strip ASCII-incompatible chars that break Supabase paste pipeline
  // per feedback_ascii_only_in_sql_data
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–|—/g, ' - ')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Infer Marriott brand from a property name. Returns the canonical brand
 * label or null if unknown (caller should leave brand null and tag).
 */
function inferBrand(name) {
  const n = name.toLowerCase()
  // Order matters: more specific patterns first
  const patterns = [
    [/ritz[- ]carlton.*reserve/, 'Ritz-Carlton Reserve'],
    [/ritz[- ]carlton/, 'Ritz-Carlton'],
    [/st\.? regis/, 'St. Regis'],
    [/jw marriott/, 'JW Marriott'],
    [/^the.*edition|edition,/, 'EDITION'],
    [/bvlgari/, 'Bvlgari'],
    [/luxury collection/, 'The Luxury Collection'],
    [/autograph collection/, 'Autograph Collection'],
    [/tribute portfolio/, 'Tribute Portfolio'],
    [/design hotels/, 'Design Hotels'],
    [/^w \w|w hotels|w hotel\b/, 'W Hotels'],
    [/marriott vacation club/, 'Marriott Vacation Club'],
    [/marriott resort|marriott hotel|^marriott\b/, 'Marriott'],
    [/postcard cabins/, 'Postcard Cabins'],
    [/\bstudiores\b/, 'StudioRes'],
    [/citizenm/, 'citizenM'],
    [/walt disney world (dolphin|swan)/, 'Walt Disney World'],
    [/sheraton grand/, 'Sheraton Grand'],
    [/sheraton/, 'Sheraton'],
    [/le m[ée]ridien/, 'Le Meridien'],
    [/westin/, 'Westin'],
    [/renaissance/, 'Renaissance'],
    [/delta hotels/, 'Delta Hotels'],
    [/gaylord/, 'Gaylord'],
    [/courtyard/, 'Courtyard'],
    [/four points flex/, 'Four Points Flex'],
    [/four points/, 'Four Points'],
    [/springhill suites/, 'SpringHill Suites'],
    [/protea hotels?/, 'Protea Hotels'],
    [/fairfield/, 'Fairfield'],
    [/towneplace suites/, 'TownePlace Suites'],
    [/residence inn/, 'Residence Inn'],
    [/element/, 'Element'],
    [/aloft/, 'Aloft'],
    [/moxy/, 'Moxy'],
    [/ac hotel/, 'AC Hotels'],
    [/city express/, 'City Express'],
    [/ac by marriott/, 'AC Hotels'],
    [/apartments by marriott bonvoy/, 'Apartments by Marriott Bonvoy'],
  ]
  for (const [re, brand] of patterns) {
    if (re.test(n)) return brand
  }
  // Generic catch: any name containing "Marriott" (e.g. "San Diego Marriott
  // Gaslamp", "Anaheim Marriott") that wasn't matched by a more specific
  // pattern above. Treat as Premium-tier.
  if (/\bmarriott\b/.test(n)) return 'Marriott'
  return null
}

/**
 * Walk pagination for a single destination URL. Returns a deduped list
 * of hotels and total credits consumed.
 *
 * Calls onCheckpoint(currentBatch) every 5 pages so caller can persist
 * mid-state — a single bad page won't lose all the work. onCheckpoint
 * may be undefined for dry-runs.
 */
async function paginateDestination(baseUrl, urlContext, maxPages, waitMs, onCheckpoint) {
  const all = new Map()
  let credits = 0
  let consecutiveEmpty = 0
  let lastCheckpointSize = 0
  for (let pg = 1; pg <= maxPages; pg++) {
    const pageUrl = pg === 1 ? baseUrl : `${baseUrl}?pg=${pg}`
    process.stderr.write(`  pg ${pg} ... `)
    const r = await firecrawl(pageUrl, waitMs)
    credits += r.credits || 0
    if (!r.ok) {
      process.stderr.write(`FAILED (${r.error})\n`)
      break
    }
    const found = parseHotels(r.markdown, urlContext)
    let newCount = 0
    for (const h of found) {
      if (!all.has(h.property_code)) {
        all.set(h.property_code, h)
        newCount++
      }
    }
    process.stderr.write(`+${newCount} new (${all.size} total, ${r.credits}cr)\n`)
    // Mid-pagination checkpoint every 5 pages
    if (onCheckpoint && pg % 5 === 0 && all.size > lastCheckpointSize) {
      const newRows = [...all.values()].slice(lastCheckpointSize)
      try {
        await onCheckpoint(newRows)
        process.stderr.write(`    [checkpoint: persisted ${newRows.length} new rows]\n`)
        lastCheckpointSize = all.size
      } catch (err) {
        process.stderr.write(`    [checkpoint FAILED: ${err.message?.slice(0, 100)}]\n`)
      }
    }
    if (newCount === 0) {
      consecutiveEmpty++
      // Don't terminate early if we haven't captured enough yet - state-
      // level pages routinely return 0 on a slow-load pg 1 OR on a transient
      // timeout-recovered page. Require either:
      //   - 3 consecutive empties when we've captured >= 50 hotels, OR
      //   - 5 consecutive empties when capturing < 50 (early-page slow loads)
      const threshold = all.size >= 50 ? 3 : 5
      if (consecutiveEmpty >= threshold) break
    } else {
      consecutiveEmpty = 0
    }
    // Polite delay between Firecrawl calls
    await new Promise((res) => setTimeout(res, 500))
  }
  // Return any rows not yet checkpointed
  const allRows = [...all.values()]
  return { hotels: allRows, credits, lastCheckpointSize }
}

async function main() {
  loadEnv()
  const args = parseArgs()

  // Load block config
  const configPath = args.config
    ? join(process.cwd(), args.config)
    : join(process.cwd(), `data/destinations/${args.slug}.json`)
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  const block = config.blocks?.[args.block - 1]
  if (!block) {
    console.error(`No block ${args.block} defined in ${configPath}`)
    process.exit(1)
  }
  console.log(`# Block ${args.block}: ${block.label}`)
  console.log(`# Destinations: ${block.destinations.length}`)
  console.log(`# Dry run: ${args.dryRun}`)

  // Look up program_id
  const programs = await sb(`programs?slug=eq.${args.slug}&select=id,name`)
  if (!programs || programs.length === 0) throw new Error(`No program with slug=${args.slug}`)
  const program = programs[0]
  console.log(`# Program: ${program.name} (${program.id})\n`)

  let totalCredits = 0
  let totalNew = 0
  let totalUpserts = 0

  for (const dest of block.destinations) {
    console.log(`## ${dest.url_path} (${dest.country}/${dest.region || dest.city || ''})`)
    const baseUrl = `https://www.marriott.com/en-us/destinations/${dest.url_path}.mi`
    // dest.region is the state/province from config; map country to the
    // 4-bucket continent that hotel_properties.region CHECK accepts
    const urlContext = {
      country: dest.country,
      region: regionForCountry(dest.country),
      state_or_province: dest.region || null,
      city: dest.city || null,
    }
    const upsertBatch = async (hotels) => {
      const rows = hotels.map((h) => ({
        program_id: program.id,
        property_code: h.property_code,
        name: h.name,
        brand: h.brand,
        city: h.city,
        state_or_province: h.state_or_province,
        region: h.region,
        country: h.country,
        hotel_url: h.hotel_url,
        all_inclusive: h.all_inclusive,
        last_verified: new Date().toISOString().slice(0, 10),
      }))
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100)
        const result = await sb('hotel_properties?on_conflict=program_id,property_code', {
          method: 'POST',
          body: JSON.stringify(batch),
        })
        totalUpserts += result?.length ?? batch.length
      }
      return rows.length
    }

    const checkpoint = args.dryRun ? undefined : upsertBatch

    const { hotels, credits, lastCheckpointSize } = await paginateDestination(baseUrl, urlContext, args.maxPages, args.waitMs, checkpoint)
    totalCredits += credits
    console.log(`  -> ${hotels.length} hotels, ${credits} credits`)

    if (args.dryRun) {
      console.log(`  [dry-run] would upsert ${hotels.length} rows`)
      totalNew += hotels.length
      continue
    }

    // Persist any rows not yet checkpointed (the last < 5 pages worth)
    const tail = hotels.slice(lastCheckpointSize)
    if (tail.length > 0) {
      await upsertBatch(tail)
      console.log(`  upserted (final batch): ${tail.length}`)
    }
    totalNew += hotels.length
  }

  console.log(`\n=== Block ${args.block} summary ===`)
  console.log(`Destinations crawled: ${block.destinations.length}`)
  console.log(`Hotels found: ${totalNew}`)
  console.log(`Rows upserted: ${totalUpserts}`)
  console.log(`Firecrawl credits consumed: ${totalCredits}`)
}

main().catch((err) => {
  console.error(`[scrape-properties] ${err.message}`)
  process.exit(1)
})
