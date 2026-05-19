import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { verifyUnsubscribeToken } from '@/utils/email/unsubscribeToken'

/**
 * One-click unsubscribe. Requires a signed token in the URL so it can't be
 * abused to mass-unsubscribe arbitrary emails:
 *
 *   /api/unsubscribe?email=<addr>&token=<hmac>
 *
 * The token is generated at email-send time via signUnsubscribeToken(email)
 * and lives in every transactional + newsletter email footer.
 *
 * Legacy links without a token are redirected to a friendly page telling
 * the user to use the link in any recent email. We DO NOT silently
 * unsubscribe legacy links — that's the whole vulnerability we're fixing.
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  const token = req.nextUrl.searchParams.get('token')

  if (!email) {
    return NextResponse.redirect(new URL('/unsubscribe?status=error', req.url))
  }

  if (!token || !verifyUnsubscribeToken(email, token)) {
    console.warn(`[unsubscribe] rejected: invalid or missing token for email=${email}`)
    return NextResponse.redirect(new URL('/unsubscribe?status=invalid-link', req.url))
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
