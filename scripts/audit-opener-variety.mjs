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
  .select('id, title, summary, status')
  .eq('status', 'published')

const radar = (data ?? []).filter((a) => /on your radar/i.test(a.summary || ''))
const ifYou = (data ?? []).filter((a) => /^if /i.test((a.summary || '').trim()))
const gotA = (data ?? []).filter((a) => /^got a /i.test((a.summary || '').trim()))

console.log(`Total published: ${data?.length}`)
console.log(`"on your radar" anywhere: ${radar.length}`)
console.log(`Open with "If ...": ${ifYou.length}`)
console.log(`Open with "Got a ...": ${gotA.length}`)
console.log('')
console.log('Recent "on your radar" examples:')
for (const a of radar.slice(0, 8)) {
  console.log(`  - ${(a.summary || '').slice(0, 130)}`)
}
console.log('')
console.log('All "If ..." openers:')
for (const a of ifYou.slice(0, 12)) {
  console.log(`  - ${(a.summary || '').slice(0, 130)}`)
}
