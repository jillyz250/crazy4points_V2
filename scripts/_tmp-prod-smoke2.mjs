import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const t = readFileSync('.env.local','utf8')
for (const l of t.split('\n')){const m=l.match(/^([A-Z0-9_]+)=(.*)$/); if(m)process.env[m[1]]=m[2].replace(/^"(.*)"$/,'$1')}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const pad = '­​͏ '.repeat(120)
const text = `${pad}Weekly Points Digest
---------- Forwarded message ---------
From: AwardWallet <info@awardwallet.com>

ZZQAPROD Alpha Airlines 100% transfer bonus from Chase to Alpha Miles through September 30, 2026.

ZZQAPROD Beta Hotels devalues award chart October 1, 2026: top tier rises 40%, 60,000 to 84,000 points/night.

ZZQAPROD Gamma Bank Card elevated signup bonus of 90,000 points after $4,000 spend in 90 days.

Also: ZZQAPROD Delta Shopping Portal 5x points through August 31, 2026.
Unsubscribe | Privacy Policy`
const payload = { from:'testforward@gmail.com', to:['intel+test@in.crazy4points.com'], subject:'ZZQAPROD Weekly Points Digest', text, html:null }

async function post(){
  try {
    const res = await fetch('https://crazy4points.com/api/intel-email-inbound', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${process.env.RESEND_INBOUND_WEBHOOK_SECRET}`}, body:JSON.stringify(payload) })
    const raw = await res.text()
    let body=null; try { body=JSON.parse(raw) } catch {}
    return { status:res.status, body, raw:raw.slice(0,80) }
  } catch(e){ return { status:0, body:null, raw:'FETCH ERROR '+e.message } }
}

for (let a=1;a<=6;a++){
  const { status, body, raw } = await post()
  if (body && body.segments !== undefined){
    console.log(`✓ NEW CODE LIVE (attempt ${a}) HTTP ${status} — segments=${body.segments} inserted=${body.inserted} deduped=${body.deduped}`)
    const { data:items } = await sb.from('intel_items').select('headline,alert_type,programs,source_email_id').eq('source_email_id', body.source_email_id)
    items?.forEach(i=>console.log(`   [${i.alert_type}] ${i.headline} {${(i.programs||[]).join(',')}}`))
    await sb.from('intel_items').delete().eq('source_email_id', body.source_email_id)
    await sb.from('intel_source_emails').delete().eq('id', body.source_email_id)
    console.log('✓ cleaned up. PROD SMOKE TEST PASSED.')
    break
  } else if (body && body.classification !== undefined){
    console.log(`attempt ${a}: OLD code still live — retrying in 25s`)
    await sb.from('intel_items').delete().ilike('headline','%ZZQAPROD%')
    await sleep(25000)
  } else {
    console.log(`attempt ${a}: non-JSON/building (HTTP ${status}: ${raw}) — retrying in 25s`)
    await sleep(25000)
  }
  if (a===6) console.log('Not confirmed after retries.')
}
// final stray cleanup
const { data:strays } = await sb.from('intel_items').select('id').ilike('headline','%ZZQAPROD%')
if (strays?.length){ await sb.from('intel_items').delete().ilike('headline','%ZZQAPROD%'); console.log(`(removed ${strays.length} stray ZZQAPROD item(s))`) }
