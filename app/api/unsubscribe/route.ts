import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')

  if (!email) {
    return NextResponse.redirect(new URL('/unsubscribe?status=error', req.url))
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('subscribers')
    .update({ active: false })
    .eq('email', email.toLowerCase().trim())

  if (error) {
    console.error('[unsubscribe] DB error:', error)
    return NextResponse.redirect(new URL('/unsubscribe?status=error', req.url))
  }

  return NextResponse.redirect(new URL('/unsubscribe?status=success', req.url))
}
