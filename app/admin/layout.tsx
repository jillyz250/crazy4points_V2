import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminNav from '@/components/admin/AdminNav'
import ErrorsBanner from '@/components/admin/ErrorsBanner'
import SidebarShell from '@/components/admin/SidebarShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')

  if (!session) {
    redirect('/admin/login')
  }

  const sidebar = (
    <>
      <Link href="/admin" className="admin-brand">
        <span className="admin-brand-dot" />
        <span className="admin-brand-name">crazy4points</span>
        <span className="admin-brand-sub">admin</span>
      </Link>
      <AdminNav />
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
