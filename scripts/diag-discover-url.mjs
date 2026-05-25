#!/usr/bin/env node
/**
 * Diagnose the Discover URL flow for a credit card.
 * Calls discoverCardSourceUrl() directly so we bypass the form/server-action
 * layer and see the actual error vs the silent "console.error and return"
 * that the server action does today.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const text = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
for (const line of text.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
}

const { discoverCardSourceUrl } = await import('../utils/cards/discoverCardSourceUrl.ts')

const slug = process.argv[2] ?? 'citi-strata-elite'
const startingUrl = process.argv[3] ?? 'https://www.citi.com'

const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const { data: card, error } = await supabase
  .from('credit_cards')
  .select('id, name, issuer:issuers(name)')
  .eq('slug', slug)
  .single()

if (error || !card) {
  console.error('Card lookup failed:', error?.message ?? 'not found')
  process.exit(1)
}

console.log('--- INPUTS ---')
console.log('slug         :', slug)
console.log('cardId       :', card.id)
console.log('cardName     :', card.name)
console.log('issuerName   :', card.issuer?.name ?? '(unknown)')
console.log('startingUrl  :', startingUrl)
console.log('')

const result = await discoverCardSourceUrl({
  cardId: card.id,
  cardName: card.name,
  issuerName: card.issuer?.name ?? '',
  startingUrl,
})

console.log('--- RESULT ---')
console.log(JSON.stringify(result, null, 2))
