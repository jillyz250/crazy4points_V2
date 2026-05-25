import { readFileSync } from 'node:fs'
const text = readFileSync('.env.local', 'utf8')
for (const line of text.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
}
const { checkUrl } = await import('../utils/admin/checkUrl.ts')

const urls = [
  'https://www.citi.com/credit-cards/citi-strata-elite-credit-card',
  'https://www.citi.com/credit-cards/citi-strata-elite-benefits',
  'https://www.citi.com/credit-cards/rewards',
  'https://online.citi.com/US/ag/cards/displayterms?app=UNSOL',
]
for (const u of urls) {
  const r = await checkUrl(u)
  console.log(r.ok ? '✅' : '❌', u, '→', r.status ?? '', r.error ?? '')
}
