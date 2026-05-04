#!/usr/bin/env node
/**
 * scrape-all.mjs — Auto-refresh runner for program scrape_urls
 *
 * For each program (filtered by --tier or --program), iterates the URLs
 * in programs.scrape_urls, calls Firecrawl for each, hashes content,
 * compares against the most recent prior scrape, and inserts a new row
 * into the scrapes table.
 *
 * USAGE:
 *   node scripts/scrape-all.mjs --program=atmos       # one program
 *   node scripts/scrape-all.mjs --tier=1              # all monthly-tier programs
 *   node scripts/scrape-all.mjs --tier=1,2            # monthly + quarterly
 *   node scripts/scrape-all.mjs --all                 # everything (long tail incl.)
 *   node scripts/scrape-all.mjs --program=atmos --dry-run    # don't write to DB
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

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
  const args = { program: null, tier: null, all: false, dryRun: false }
  for (const a of process.argv.slice(2)) {
    if (a === '--all') args.all = true
    else if (a === '--dry-run') args.dryRun = true
    else if (a.startsWith('--program=')) args.program = a.split('=')[1]
    else if (a.startsWith('--tier=')) args.tier = a.split('=')[1].split(',').map((n) => Number(n))
  }
  if (!args.program && !args.tier && !args.all) {
    console.error('Usage: scrape-all.mjs --program=<slug> | --tier=1[,2] | --all  [--dry-run]')
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
      Prefer: options.method === 'POST' ? 'return=representation' : 'return=minimal',
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

async function firecrawl(url) {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true, timeout: 25000 }),
    signal: AbortSignal.timeout(35000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (body.includes('do not support this site')) {
      return { status: 'firecrawl_blocked', md: '', error: 'Firecrawl unsupported on this domain' }
    }
    return { status: 'http_error', md: '', error: `${res.status}: ${body.slice(0, 200)}` }
  }
  const data = await res.json()
  if (!data?.success) return { status: 'parse_error', md: '', error: JSON.stringify(data).slice(0, 300) }
  const md = data?.data?.markdown ?? ''
  if (!md) return { status: 'empty', md: '', error: 'no markdown returned' }
  return { status: 'success', md, error: null }
}

function hashContent(md) {
  return createHash('sha256').update(md).digest('hex')
}

async function main() {
  loadEnv()
  const args = parseArgs()

  let filter = 'select=slug,refresh_tier,scrape_urls&scrape_urls=neq.{}'
  if (args.program) {
    filter = `select=slug,refresh_tier,scrape_urls&slug=eq.${args.program}`
  } else if (args.tier) {
    filter += `&refresh_tier=in.(${args.tier.join(',')})`
  }

  const programs = await sb(`programs?${filter}`)
  if (!programs.length) {
    console.error('No programs match the filter (or scrape_urls is empty).')
    process.exit(1)
  }

  console.log(`[scrape-all] Targeting ${programs.length} program(s).${args.dryRun ? ' (dry run)' : ''}`)

  let totalUrls = 0, fetchedOk = 0, changed = 0, failed = 0

  for (const p of programs) {
    const urls = p.scrape_urls
    if (!urls || typeof urls !== 'object' || !Object.keys(urls).length) {
      console.log(`  [${p.slug}] no scrape_urls — skip`)
      continue
    }
    console.log(`\n[${p.slug}] tier=${p.refresh_tier}, ${Object.keys(urls).length} URLs`)
    const programTotal = Object.keys(urls).filter((k) => typeof urls[k] === 'string' && urls[k]).length
    let programOk = 0
    let programChanged = 0

    for (const [urlType, url] of Object.entries(urls)) {
      if (!url || typeof url !== 'string') continue
      totalUrls++
      process.stdout.write(`  ${urlType.padEnd(10)} → `)
      const result = await firecrawl(url)

      if (result.status !== 'success') {
        failed++
        console.log(`${result.status} (${result.error?.slice(0, 80)})`)
        if (!args.dryRun) {
          await sb('scrapes', {
            method: 'POST',
            body: JSON.stringify({
              program_slug: p.slug, url_type: urlType, url,
              content_md: '', content_hash: 'n/a',
              fetch_status: result.status, notes: result.error,
            }),
          })
        }
        continue
      }

      const newHash = hashContent(result.md)
      fetchedOk++
      programOk++
      const priors = await sb(
        `scrapes?select=content_hash&program_slug=eq.${p.slug}&url_type=eq.${urlType}&fetch_status=eq.success&order=scraped_at.desc&limit=1`
      )
      const prevHash = priors?.[0]?.content_hash ?? null
      const didChange = !!prevHash && prevHash !== newHash
      if (didChange) {
        changed++
        programChanged++
      }

      console.log(
        `success (${result.md.length} chars, hash ${newHash.slice(0, 8)})${
          didChange ? ' [CHANGED]' : prevHash ? ' [unchanged]' : ' [new]'
        }`
      )

      if (!args.dryRun) {
        await sb('scrapes', {
          method: 'POST',
          body: JSON.stringify({
            program_slug: p.slug, url_type: urlType, url,
            content_md: result.md, content_hash: newHash,
            prev_hash: prevHash, changed: didChange,
            fetch_status: 'success',
          }),
        })
      }
      await new Promise((r) => setTimeout(r, 500))
    }

    // Passive verification: if every URL fetched successfully AND nothing
    // changed, bump programs.last_verified. The act of confirming all
    // sources still hash-match prior counts as a refresh — same as a
    // human edit. Changed scrapes do NOT bump (those need human review
    // via /admin/scrapes Acknowledge action).
    if (programTotal > 0 && programOk === programTotal && programChanged === 0 && !args.dryRun) {
      const today = new Date().toISOString().slice(0, 10)
      await sb(`programs?slug=eq.${p.slug}`, {
        method: 'PATCH',
        body: JSON.stringify({ last_verified: today }),
      })
      console.log(`  [${p.slug}] all ${programTotal} URLs unchanged - bumped last_verified=${today}`)
    } else if (programChanged > 0) {
      console.log(`  [${p.slug}] ${programChanged} URLs CHANGED - last_verified NOT bumped (review at /admin/scrapes)`)
    }
  }

  console.log(
    `\n[scrape-all] Done. ${fetchedOk}/${totalUrls} fetched OK; ${changed} changed since last refresh; ${failed} failed.`
  )
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(`[scrape-all] ${err.message}`)
  process.exit(1)
})
