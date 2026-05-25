#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const text = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
for (const line of text.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await supabase
  .from('alerts')
  .select('id, slug, title, summary, why_this_matters, description')
  .ilike('title', '%alaska%london%')
  .order('published_at', { ascending: false })
  .limit(1)
  .maybeSingle()

if (!data) { console.log('Not found by London — trying Alaska + Europe'); process.exit(0) }

console.log('SLUG:', data.slug)
console.log('TITLE:', data.title)
console.log('---')
console.log('SUMMARY:')
console.log(data.summary)
console.log('---')
console.log('WHY THIS MATTERS:')
console.log(data.why_this_matters)
console.log('---')
console.log('DESCRIPTION:')
console.log(data.description)
