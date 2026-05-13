import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data, error } = await sb
  .from('content_ideas')
  .select('id, slug, title, status, voice_pass, voice_notes, voice_checked_at, originality_pass, originality_notes, originality_checked_at, originality_confidence_score, originality_threshold, originality_flagged_passages, article_body, updated_at')
  .or('title.ilike.%spirit%,slug.ilike.%spirit%')
  .order('updated_at', { ascending: false })
  .limit(5)
if (error) { console.error(error); process.exit(1) }
for (const r of data) {
  console.log('---')
  console.log('id:', r.id, '| slug:', r.slug, '| status:', r.status)
  console.log('title:', r.title)
  console.log('voice_pass:', r.voice_pass, 'notes:', r.voice_notes)
  console.log('originality_pass:', r.originality_pass, 'score:', r.originality_confidence_score, 'threshold:', r.originality_threshold)
  console.log('originality_notes:', r.originality_notes)
  console.log('flagged_passages:', JSON.stringify(r.originality_flagged_passages, null, 2))
  console.log('body length:', r.article_body?.length || 0)
}
