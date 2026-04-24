'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/alerts', label: 'Alerts' },
  { href: '/admin/sources', label: 'Sources' },
  { href: '/admin/intel', label: 'Intel' },
  { href: '/admin/programs', label: 'Programs' },
  { href: '/admin/content-ideas', label: 'Ideas' },
  { href: '/admin/newsletter', label: 'Newsletter' },
  { href: '/admin/subscribers', label: 'Subscribers' },
  { href: '/admin/jobs', label: 'Jobs' },
  { href: '/admin/briefs', label: 'Briefs' },
  { href: '/admin/fact-checks', label: 'Fact Checks' },
  { href: '/admin/errors', label: 'Errors' },
] as const

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(href + '/')
}

const base: React.CSSProperties = {
  padding: '0.3125rem 0.625rem',
  borderRadius: 'var(--admin-radius)',
  fontSize: '0.8125rem',
  fontFamily: 'var(--font-ui)',
  fontWeight: 500,
  color: 'var(--admin-text-muted)',
  textDecoration: 'none',
  letterSpacing: '0',
  transition: 'background-color 0.12s ease, color 0.12s ease',
}

const active: React.CSSProperties = {
  ...base,
  background: 'var(--admin-surface-alt)',
  color: 'var(--admin-text)',
  fontWeight: 600,
}

export default function AdminNav() {
  const pathname = usePathname() ?? '/admin'

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', flexWrap: 'wrap' }}>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={isActive(pathname, item.href) ? active : base}
        >
          {item.label}
        </Link>
      ))}
      <form action="/api/admin-logout" method="post" style={{ marginLeft: 'auto' }}>
        <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm">
          Log out
        </button>
      </form>
    </nav>
  )
}
