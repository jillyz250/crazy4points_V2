import { NextResponse } from 'next/server'

/**
 * Authorize a Vercel-cron / automation route.
 *
 * Returns a NextResponse to return early when the request is NOT authorized,
 * or null when it is. Usage:
 *
 *   const denied = assertCron(request)
 *   if (denied) return denied
 *
 * Hard-requires CRON_SECRET — FAILS CLOSED. The previous per-route pattern was
 * `if (cronSecret) { ...check... }`, which silently allowed every request when
 * the env var was unset. Here a missing secret returns 500 instead.
 *
 * Accepts EITHER Vercel's `x-vercel-cron` header (set automatically on cron
 * invocations) OR `Authorization: Bearer <CRON_SECRET>` (for manual/curl runs).
 */
export function assertCron(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('CRON_SECRET is not set — refusing cron request')
    return NextResponse.json(
      { ok: false, error: 'server misconfiguration' },
      { status: 500 }
    )
  }

  const isVercelCron = request.headers.get('x-vercel-cron') != null
  const auth = request.headers.get('authorization')
  if (!isVercelCron && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  return null
}
