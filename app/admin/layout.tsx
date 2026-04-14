import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div style={{ fontFamily: 'var(--font-ui)' }}>
      <header style={{ borderBottom: '1px solid var(--color-border-soft)', padding: '1rem 2rem', background: 'var(--color-background-soft)' }}>
        <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '1.125rem' }}>
          crazy4points — Admin
        </span>
      </header>
      <main style={{ padding: '2rem' }}>
        {children}
      </main>
    </div>
  )
}
