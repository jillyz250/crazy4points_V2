import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data } = await sb
  .from('programs')
  .select('slug, name, type')
  .eq('type', 'airline')
  .or('name.ilike.%jetblue%,name.ilike.%united%,name.ilike.%southwest%,name.ilike.%american%,name.ilike.%frontier%,name.ilike.%spirit%')
  .order('name')
console.table(data)
