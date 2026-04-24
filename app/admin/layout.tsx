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
    <div className="admin">
      <header
        style={{
          borderBottom: '1px solid var(--admin-border)',
          background: 'var(--admin-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: '90rem',
            margin: '0 auto',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
          }}
        >
          <Link
            href="/admin"
            style={{
              color: 'var(--admin-text)',
              fontWeight: 600,
              fontSize: '0.9375rem',
              letterSpacing: '-0.01em',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ color: 'var(--admin-accent)' }}>●</span>
            crazy4points
            <span style={{ color: 'var(--admin-text-subtle)', fontWeight: 400 }}>/ admin</span>
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <AdminNav />
          </div>
        </div>
      </header>
      <ErrorsBanner />
      <main
        style={{
          maxWidth: '90rem',
          margin: '0 auto',
          padding: '1.75rem 1.5rem',
        }}
      >
        {children}
      </main>
    </div>
  )
}
