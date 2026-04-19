import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Serve robots.txt and sitemap.xml directly on apex — don't redirect
  const botFiles = ['/robots.txt', '/sitemap.xml']
  if (botFiles.includes(pathname)) {
    return NextResponse.next()
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
