import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminNav from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div style={{ fontFamily: 'var(--font-ui)' }}>
      <header
        style={{
          borderBottom: '1px solid var(--color-border-soft)',
          padding: '0.875rem 2rem',
          background: 'var(--color-background-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
        }}
      >
        <Link
          href="/admin"
          style={{
            color: 'var(--color-primary)',
            fontWeight: 700,
            fontSize: '1.125rem',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          crazy4points — Admin
        </Link>
        <div style={{ flex: 1 }}>
          <AdminNav />
        </div>
      </header>
      <main style={{ padding: '2rem' }}>
        {children}
      </main>
    </div>
  )
}
