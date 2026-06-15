import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, SESSION_TTL_MS, signAdminSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (!process.env.SESSION_SECRET) {
    console.error('SESSION_SECRET is not set — admin login disabled')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
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
    maxAge: SESSION_TTL_MS / 1000, // 8 hours
  })

  return response
}
