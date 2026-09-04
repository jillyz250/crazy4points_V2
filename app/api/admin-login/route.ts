import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, SESSION_TTL_MS, signAdminSession } from '@/lib/auth/session'
import { createAdminClient } from '@/utils/supabase/server'
import { isRateLimited, ipHashFromRequest } from '@/utils/security/rateLimit'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (!process.env.SESSION_SECRET) {
    console.error('SESSION_SECRET is not set — admin login disabled')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  // Brute-force guard: throttle password attempts per IP so nobody can hammer
  // ADMIN_PASSWORD. 8 tries / 15 min is generous for a real typo, hostile to a
  // bot. Fails open if the IP can't be read (same pattern as the signup form).
  const ipKey = ipHashFromRequest(request.headers)
  if (ipKey) {
    const blocked = await isRateLimited(createAdminClient(), {
      key: ipKey,
      kind: 'login',
      max: 8,
      windowMinutes: 15,
    })
    if (blocked) {
      console.warn(`[admin-login] rate-limited ip=${ipKey.slice(0, 8)}`)
      return NextResponse.json(
        { error: 'Too many attempts. Please wait a few minutes and try again.' },
        { status: 429 },
      )
    }
  }

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = await signAdminSession()

  const response = NextResponse.redirect(new URL('/admin', request.url))
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000, // 30 days
  })

  return response
}
