import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data } = await sb.from('content_ideas').select('article_body').eq('id','7dfe4dbb-0e68-4af9-b395-e9026e84d099').single()
const body = data.article_body
for (const needle of ['stop honoring', 'rewards, coupons', 'cease operations', 'doors close']) {
  console.log(`\n=== "${needle}" ===`)
  for (const line of body.split('\n')) {
    if (line.toLowerCase().includes(needle.toLowerCase())) console.log(JSON.stringify(line.slice(0,200)))
  }
}
