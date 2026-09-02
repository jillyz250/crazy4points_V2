import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminNav, { type NavPerson } from '@/components/admin/AdminNav'
import ErrorsBanner from '@/components/admin/ErrorsBanner'
import SidebarShell from '@/components/admin/SidebarShell'
import { createAdminClient } from '@/utils/supabase/server'
import { isAdminRequest } from '@/lib/auth/admin'

// The nav is people-only: load the team, ordered owner → chief → heads
// (active first). Every tool stays reachable via each person's workspace page.
async function loadPeople(): Promise<NavPerson[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('employees')
      .select('slug, name, role_title, emoji, image_url, kind, status')
    const emps = (data ?? []) as NavPerson[]
    const kindRank = { owner: 0, chief: 1, agent: 2 } as const
    const statusRank: Record<string, number> = { active: 0, paused: 1, planned: 2, retired: 3 }
    return emps.sort((a, b) =>
      (kindRank[a.kind] - kindRank[b.kind]) ||
      ((statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9)) ||
      a.name.localeCompare(b.name),
    )
  } catch {
    return []
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Verifies the signed session cookie (not just its presence). This protects
  // page reads; server actions additionally re-check via assertAdmin() because
  // layouts do not run on every action invocation.
  if (!(await isAdminRequest())) {
    redirect('/admin/login')
  }

  const people = await loadPeople()

  const sidebar = (
    <>
      <Link href="/admin" className="admin-brand">
        <span className="admin-brand-dot" />
        <span className="admin-brand-name">crazy4points</span>
        <span className="admin-brand-sub">admin</span>
      </Link>
      <AdminNav people={people} />
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
