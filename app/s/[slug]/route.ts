import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

// Branded short link: /s/<slug> -> 302 -> the stored (UTM-tagged) target URL.
// The target keeps the UTMs, so analytics still attributes the click correctly
// even though the public link is short and clean.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('short_links')
    .select('target_url')
    .eq('slug', slug)
    .maybeSingle()

  if (!data?.target_url || !/^https?:\/\//i.test(data.target_url)) {
    // Unknown or malformed slug: send them to the homepage rather than error.
    return NextResponse.redirect(new URL('/', req.url), 302)
  }

  // Fire-and-forget click count; never block the redirect on it.
  supabase.rpc('bump_short_link', { p_slug: slug }).then(
    () => {},
    () => {},
  )

  return NextResponse.redirect(data.target_url, 302)
}
