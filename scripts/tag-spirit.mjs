import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data, error } = await sb
  .from('content_ideas')
  .update({
    secondary_program_slugs: ['jetblue', 'united', 'southwest', 'aa', 'frontier'],
    updated_at: new Date().toISOString(),
  })
  .eq('slug', 'spirit-airlines-has-shut-down-what-to-do-with-your-tickets-and-points')
  .select('slug, primary_program_slug, secondary_program_slugs')
if (error) { console.error(error); process.exit(1) }
console.log(data)
