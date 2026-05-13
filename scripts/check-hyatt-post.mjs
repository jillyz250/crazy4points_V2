import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data, error } = await sb
  .from('content_ideas')
  .select('id, slug, status, title, category, primary_program_slug, secondary_program_slugs, card_slugs, excerpt, pitch, written_at, fact_checked_at, voice_pass, originality_pass, override_reason, published_at, updated_at, article_body, type')
  .or('title.ilike.%hyatt%,title.ilike.%5 ways%,title.ilike.%five ways%,slug.ilike.%hyatt%')
  .order('updated_at', { ascending: false })
  .limit(5)
if (error) { console.error(error); process.exit(1) }
for (const r of data ?? []) {
  console.log('---')
  console.log(`id: ${r.id} | status: ${r.status} | slug: ${r.slug}`)
  console.log(`title: ${r.title}`)
  console.log(`category: ${r.category}`)
  console.log(`primary: ${r.primary_program_slug} | secondaries: ${JSON.stringify(r.secondary_program_slugs)} | cards: ${JSON.stringify(r.card_slugs)}`)
  console.log(`type: ${r.type} | pitch: ${(r.pitch ?? '').slice(0,80)}`)
  console.log(`excerpt: ${(r.excerpt ?? '').slice(0,80)}`)
  console.log(`written_at: ${r.written_at} | fact_checked_at: ${r.fact_checked_at}`)
  console.log(`voice_pass: ${r.voice_pass} | originality_pass: ${r.originality_pass}`)
  console.log(`override_reason: ${r.override_reason}`)
  console.log(`published_at: ${r.published_at} | updated_at: ${r.updated_at}`)
  console.log(`body length: ${(r.article_body ?? '').length}`)
}
