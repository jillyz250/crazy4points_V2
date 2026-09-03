#!/usr/bin/env node
/**
 * field-digest — each head's trade-news digest (Jill, 2026-09-02).
 *
 * Pulls a head's VERIFIED trade feeds (RSS), dedupes against what's already been
 * captured, has Haiku write a one-line "what changed + why it matters to YOU"
 * per item (and drop the irrelevant), and stores the keepers in `field_updates`.
 * The head reads their unread updates in their morning brief ("field this week").
 *
 * WHY this exists: AI agents don't persist knowledge between sessions, so a stored
 * feed IS how a head stays current. Field updates inform HOW a head works — they
 * are NEVER a citable source for a published fact (that stays official-only).
 *
 * Run: node scripts/field-digest.mjs kesha-social   (or a slug; default = all configured)
 * Productionize later: a weekly Vercel cron hitting an API route that calls this.
 */
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// ── verified trade feeds per head — shared with the app (lib/field-feeds.json) ──
// Single source of truth so each head's page can LIST the trades they read.
const FEEDS = JSON.parse(fs.readFileSync('lib/field-feeds.json', 'utf8'))

const DAYS = 10                       // only items published within this window
const PER_SOURCE = 8                  // cap items pulled per feed

const clean = (s) => (s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .trim()

function parseFeed(xml) {
  const blocks = xml.split(/<item[\s>]/).slice(1).concat(xml.split(/<entry[\s>]/).slice(1))
  const items = []
  for (const b of blocks) {
    const title = clean((b.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1])
    let link = clean((b.match(/<link>([\s\S]*?)<\/link>/) || [])[1])
    if (!link) link = (b.match(/<link[^>]*href="([^"]+)"/) || [])[1] || ''       // Atom
    const dateRaw = (b.match(/<(?:pubDate|published|updated|dc:date)>([\s\S]*?)<\/(?:pubDate|published|updated|dc:date)>/) || [])[1]
    const ts = dateRaw ? Date.parse(dateRaw.trim()) : NaN
    if (title && link) items.push({ title, link: link.trim(), ts: Number.isNaN(ts) ? null : ts })
  }
  return items
}

async function fetchFeed(src) {
  try {
    const res = await fetch(src.url, { headers: { 'User-Agent': 'Mozilla/5.0 (crazy4points field-digest)' } })
    if (!res.ok) { console.error(`  !! ${src.name}: HTTP ${res.status}`); return [] }
    const xml = await res.text()
    return parseFeed(xml).slice(0, PER_SOURCE).map((it) => ({ ...it, source_name: src.name }))
  } catch (e) { console.error(`  !! ${src.name}: ${e.message}`); return [] }
}

async function summarize(items, beat) {
  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) { console.error('  !! no ANTHROPIC_API_KEY — storing headlines without summaries'); return items.map((it) => ({ ...it, summary: null, relevance: 'normal' })) }
  const client = new Anthropic({ apiKey })
  const list = items.map((it, i) => `${i}. ${it.title} (${it.source_name})`).join('\n')
  const prompt = [
    `You brief ${beat}.`,
    `For each headline below, write ONE plain sentence: what changed + why it matters to them. Rate relevance to their day-to-day as "high", "normal", or "low". DROP anything off-topic or purely promotional (mark relevance "low").`,
    `Do NOT invent facts beyond the headline. This is awareness only — it will NEVER be published as fact.`,
    `Return ONLY a JSON array, one object per input index: [{"i":0,"summary":"...","relevance":"high|normal|low"}]. No prose.`,
    ``,
    list,
  ].join('\n')
  try {
    const msg = await client.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] })
    const text = msg.content.find((b) => b.type === 'text')?.text || '[]'
    const json = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1))
    const byI = new Map(json.map((r) => [r.i, r]))
    return items.map((it, i) => ({ ...it, summary: byI.get(i)?.summary ?? null, relevance: byI.get(i)?.relevance ?? 'normal' }))
  } catch (e) { console.error(`  !! Haiku: ${e.message}`); return items.map((it) => ({ ...it, summary: null, relevance: 'normal' })) }
}

async function runOne(slug) {
  const cfg = FEEDS[slug]
  if (!cfg) { console.error(`no feed config for "${slug}"`); return }
  console.log(`\n== ${slug} ==`)
  const cutoff = Date.now() - DAYS * 864e5
  // gather + window
  let items = (await Promise.all(cfg.sources.map(fetchFeed))).flat()
    .filter((it) => it.ts === null || it.ts >= cutoff)
  // dedupe within run + against DB
  const seen = new Set(); items = items.filter((it) => !seen.has(it.link) && seen.add(it.link))
  const { data: existing } = await db.from('field_updates').select('source_url').eq('employee_slug', slug).in('source_url', items.map((i) => i.link))
  const have = new Set((existing || []).map((r) => r.source_url))
  items = items.filter((it) => !have.has(it.link))
  if (!items.length) { console.log('  nothing new'); return }
  console.log(`  ${items.length} new item(s) → summarizing`)
  const summarized = await summarize(items, cfg.beat)
  const keep = summarized.filter((it) => it.relevance !== 'low')     // drop the noise
  let n = 0
  for (const it of keep) {
    const { error } = await db.from('field_updates').insert({
      employee_slug: slug, headline: it.title, summary: it.summary, relevance: it.relevance,
      source_name: it.source_name, source_url: it.link,
      published_at: it.ts ? new Date(it.ts).toISOString() : null, dedupe_key: it.link,
    })
    if (!error) n++
    else if (!/duplicate key/.test(error.message)) console.error(`  !! insert: ${error.message}`)
  }
  console.log(`  stored ${n} (dropped ${summarized.length - keep.length} low-relevance)`)
}

const arg = process.argv[2]
const slugs = arg ? [arg] : Object.keys(FEEDS)
for (const s of slugs) await runOne(s)
console.log('\ndone.')
