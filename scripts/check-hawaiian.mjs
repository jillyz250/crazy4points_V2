import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data, error } = await sb
  .from('programs')
  .select('slug, name, type, alliance, hubs, intro, lounge_access, transfer_partners, sweet_spots, tier_benefits, quirks, updated_at')
  .or('slug.ilike.%hawaiian%,slug.ilike.%atmos%,name.ilike.%hawaiian%,name.ilike.%atmos%')
if (error) { console.error(error); process.exit(1) }
for (const r of data ?? []) {
  console.log('---')
  console.log(`slug: ${r.slug} | type: ${r.type} | alliance: ${r.alliance}`)
  console.log(`name: ${r.name}`)
  console.log(`hubs: ${JSON.stringify(r.hubs)}`)
  console.log(`intro: ${r.intro ? r.intro.slice(0,80) + '...' : '(empty)'}`)
  console.log(`lounge_access: ${r.lounge_access ? r.lounge_access.slice(0,80) + '...' : '(empty)'}`)
  console.log(`updated_at: ${r.updated_at}`)
  console.log(`populated: intro=${!!r.intro} lounge=${!!r.lounge_access} tps=${Array.isArray(r.transfer_partners)?r.transfer_partners.length:0} ss=${!!r.sweet_spots} tiers=${Array.isArray(r.tier_benefits)?r.tier_benefits.length:0} quirks=${!!r.quirks}`)
}
