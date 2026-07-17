import fs from 'fs'
for (const line of fs.readFileSync('.env.local','utf8').split('\n')) {
  if (!line.includes('=')||line.trim().startsWith('#')) continue
  const i=line.indexOf('='); const k=line.slice(0,i).trim()
  if (!process.env[k]) process.env[k]=line.slice(i+1).trim().replace(/^["']|["']$/g,'')
}
const { createAdminClient } = await import('@/utils/supabase/server')
const { runExperiencesWatch, EXPERIENCE_PROGRAMS } = await import('@/utils/experiences/runExperiencesWatch')
const db = createAdminClient()
const mar = EXPERIENCE_PROGRAMS.find(p=>p.program_slug==='marriott-bonvoy')
const t=Date.now(); const r=await runExperiencesWatch(db, mar); console.log('Marriott:', JSON.stringify(r), `(${((Date.now()-t)/1000).toFixed(0)}s)`)
const { count } = await db.from('experience_listings').select('*',{count:'exact',head:true}).eq('program_slug','marriott-bonvoy').eq('status','active')
console.log('Marriott active:', count)
