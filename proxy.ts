import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/auth/session'

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Serve robots.txt and sitemap.xml directly on apex — don't redirect
  const botFiles = ['/robots.txt', '/sitemap.xml']
  if (botFiles.includes(pathname)) {
    return NextResponse.next()
  }

  // Defense-in-depth admin gate. The authoritative check is per-action
  // assertAdmin() (layouts/proxy don't run on every Server Action), but gating
  // /admin/** here blocks unauthenticated page loads and action POSTs early.
  // /admin/login must stay open so the user can authenticate.
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    const session = await verifyAdminSession(token)
    if (!session) {
      // Remember where they were headed so login lands them back there
      // (bookmark/deep-link to /admin/experiences works in one step) instead of
      // always dumping on /admin. The login page validates returnTo to a local
      // /admin path before using it. (Jill, 2026-09-05.)
      const returnTo = pathname + (request.nextUrl.search || '')
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.search = ''
      url.searchParams.set('returnTo', returnTo)
      return NextResponse.redirect(url)
    }
  }

  // Redirect apex domain to www
  if (host === 'crazy4points.com') {
    const url = request.nextUrl.clone()
    url.host = 'www.crazy4points.com'
    return NextResponse.redirect(url, { status: 301 })
  }

  return NextResponse.next()
}

export const proxyConfig = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
