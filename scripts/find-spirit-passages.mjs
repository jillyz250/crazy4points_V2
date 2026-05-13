import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const id = '7dfe4dbb-0e68-4af9-b395-e9026e84d099'

const { data } = await sb.from('content_ideas').select('article_body').eq('id', id).single()
const body = data.article_body

// Find any line containing the keywords from the flagged passages
const needles = ['walk-up', 'Harteveldt', 'slim to none']
for (const n of needles) {
  console.log(`\n=== "${n}" ===`)
  const lines = body.split('\n')
  for (const line of lines) {
    if (line.toLowerCase().includes(n.toLowerCase())) {
      console.log(JSON.stringify(line))
    }
  }
}
