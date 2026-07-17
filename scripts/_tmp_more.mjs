import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}))
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
const FC = env.FIRECRAWL_API_KEY
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
// candidate programs (redeem/both mode) + their official experience URLs
const { data } = await db.from('experiences').select('parent_program_slug,slug,official_url,mode').in('parent_program_slug',['hyatt','capital-one','bilt','emirates','virgin-red','delta','ihg','accor'])
async function test(name,url){
  let md=''; try{const r=await fetch('https://api.firecrawl.dev/v2/scrape',{method:'POST',headers:{'Authorization':`Bearer ${FC}`,'Content-Type':'application/json'},body:JSON.stringify({url,formats:['markdown'],waitFor:9000})});md=((await r.json()).data||{}).markdown||''}catch(e){md='ERR'}
  if(md.length<1500) return `md ${md.length} (thin/blocked)`
  const m=await anthropic.messages.create({model:'claude-haiku-4-5-20251001',max_tokens:1500,messages:[{role:'user',content:`Count distinct experience/event listings a member can redeem points or bid on. ONLY {"count":int}.\n\n${md.slice(0,14000)}`}]})
  let t=m.content[0].text.trim().replace(/^```json?/,'').replace(/```$/,'').trim();let o={};try{o=JSON.parse(t)}catch{}
  return `md ${md.length} -> ~${o.count} listings`
}
for (const r of data||[]) console.log(`  ${r.parent_program_slug.padEnd(14)} [${r.mode}] ${await test(r.parent_program_slug, r.official_url)}  (${r.official_url})`)
