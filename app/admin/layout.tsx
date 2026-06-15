import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminNav from '@/components/admin/AdminNav'
import ErrorsBanner from '@/components/admin/ErrorsBanner'
import SidebarShell from '@/components/admin/SidebarShell'
import { createAdminClient } from '@/utils/supabase/server'
import { getRefreshQueueCount } from '@/utils/supabase/queries'
import { isAdminRequest } from '@/lib/auth/admin'

async function loadNavBadges() {
  try {
    const supabase = createAdminClient()
    const refreshQueue = await getRefreshQueueCount(supabase)
    return { refreshQueue }
  } catch {
    // Don't block the whole admin layout on a stale view; just hide the badge.
    return {}
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Verifies the signed session cookie (not just its presence). This protects
  // page reads; server actions additionally re-check via assertAdmin() because
  // layouts do not run on every action invocation.
  if (!(await isAdminRequest())) {
    redirect('/admin/login')
  }

  const badges = await loadNavBadges()

  const sidebar = (
    <>
      <Link href="/admin" className="admin-brand">
        <span className="admin-brand-dot" />
        <span className="admin-brand-name">crazy4points</span>
        <span className="admin-brand-sub">admin</span>
      </Link>
      <AdminNav badges={badges} />
      <form action="/api/admin-logout" method="post" className="admin-sidebar-footer">
        <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm admin-sidebar-logout">
          <span className="admin-sidebar-label">Log out</span>
          <span className="admin-sidebar-icon" aria-hidden="true">⎋</span>
        </button>
      </form>
    </>
  )

  return (
    <SidebarShell sidebar={sidebar}>
      <ErrorsBanner />
      <main className="admin-main-inner">{children}</main>
    </SidebarShell>
  )
}
