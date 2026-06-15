/**
 * Admin authorization data-access layer (DAL).
 *
 * Per the official Next.js auth guidance, layout/proxy checks are NOT a
 * sufficient gate for Server Actions — actions are independently-callable POST
 * endpoints, so each one must verify authorization close to the data. These
 * helpers are that gate.
 *
 * Usage:
 *   - Server actions / server components:  await assertAdmin()  (redirects if not)
 *   - Actions that need the privileged DB client:
 *         const supabase = await requireAdminClient()
 *   - Route handlers (return a Response, don't redirect):
 *         if (!(await isAdminRequest())) return new NextResponse('Unauthorized', { status: 401 })
 */

import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createAdminClient } from '@/utils/supabase/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/auth/session'

/**
 * Read + verify the admin session from the request cookies.
 * Returns true when a valid, unexpired, correctly-signed session exists.
 * Memoized per render pass so repeated checks in one request are cheap.
 */
export const isAdminRequest = cache(async (): Promise<boolean> => {
  const store = await cookies()
  const token = store.get(ADMIN_SESSION_COOKIE)?.value
  const payload = await verifyAdminSession(token)
  return payload != null
})

/**
 * Hard gate for server actions and protected server components.
 * Redirects to the login page when the session is missing/invalid.
 * Throws NEXT_REDIRECT (the documented control-flow), so it must be the first
 * `await` in the action before any mutation.
 */
export async function assertAdmin(): Promise<void> {
  if (!(await isAdminRequest())) {
    redirect('/admin/login')
  }
}

/**
 * Convenience: assert admin, then return the service-role client. Use this in
 * place of `createAdminClient()` at the top of admin server actions so the
 * authorization check is co-located with privilege acquisition.
 */
export async function requireAdminClient() {
  await assertAdmin()
  return createAdminClient()
}
