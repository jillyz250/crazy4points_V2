import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <ul style={{ marginTop: '1.5rem', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <li>
          <Link href="/admin/alerts" className="rg-btn-primary" style={{ display: 'inline-block' }}>
            Manage Alerts
          </Link>
        </li>
      </ul>
    </div>
  )
}
