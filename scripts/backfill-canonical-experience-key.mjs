// Backfill experience_listings.canonical_experience_key for grouping (Jill 2026-09-05).
import { createClient } from '@supabase/supabase-js'
import { canonicalKey } from '../lib/experiences/canonicalKey.ts'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data, error } = await db.from('experience_listings').select('id,title,program_slug,event_date')
if (error) { console.error(error); process.exit(1) }
let updated=0, groups=new Set()
for (const r of (data??[])) {
  const key = canonicalKey(r)
  groups.add(key)
  const { error: e } = await db.from('experience_listings').update({ canonical_experience_key: key }).eq('id', r.id)
  if (e) { console.error('update fail', r.id, e.message); continue }
  updated++
}
console.log(`Backfilled ${updated}/${data.length} listings into ${groups.size} distinct canonical groups.`)
