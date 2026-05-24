#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const text = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
for (const line of text.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const { data, error } = await supabase
  .from('alerts')
  .select('id, slug, title, summary, status, published_at')
  .eq('status', 'published')
  .order('published_at', { ascending: false })

if (error) { console.error(error); process.exit(1) }

const bad = []
const urlRegex = /https?:\/\/|\]\(/i
const markdownRegex = /back to top|^\s*#{1,6}\s|^\s*[-*]\s{2,}|\bback to top\b/i

for (const a of data ?? []) {
  const s = a.summary ?? ''
  const issues = []
  if (urlRegex.test(s)) issues.push('contains URL or markdown link')
  if (markdownRegex.test(s)) issues.push('contains nav cruft / markdown')
  if (s.length > 600) issues.push(`very long (${s.length} chars)`)
  if (issues.length) bad.push({ id: a.id, slug: a.slug, title: (a.title || '').slice(0, 70), issues, snippet: s.slice(0, 140) })
}

console.log(`Total published alerts: ${data?.length ?? 0}`)
console.log(`Bad summaries: ${bad.length}`)
console.log('')
for (const b of bad) {
  console.log(`✗ ${b.slug}`)
  console.log(`  TITLE:    ${b.title}`)
  console.log(`  ISSUES:   ${b.issues.join('; ')}`)
  console.log(`  SNIPPET:  ${b.snippet}...`)
  console.log('')
}
