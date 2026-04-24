import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminNav from '@/components/admin/AdminNav'
import ErrorsBanner from '@/components/admin/ErrorsBanner'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="admin admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand-dot" />
          <span className="admin-brand-name">crazy4points</span>
          <span className="admin-brand-sub">admin</span>
        </Link>
        <AdminNav />
        <form action="/api/admin-logout" method="post" className="admin-sidebar-footer">
          <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm" style={{ width: '100%' }}>
            Log out
          </button>
        </form>
      </aside>
      <div className="admin-main">
        <ErrorsBanner />
        <main className="admin-main-inner">{children}</main>
      </div>
    </div>
  )
}
