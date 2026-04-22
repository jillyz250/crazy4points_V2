'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/alerts', label: 'Alerts' },
  { href: '/admin/sources', label: 'Sources' },
  { href: '/admin/programs', label: 'Programs' },
  { href: '/admin/content-ideas', label: 'Content Ideas' },
] as const

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(href + '/')
}

const linkStyle: React.CSSProperties = {
  padding: '0.375rem 0.75rem',
  borderRadius: 'var(--radius-ui)',
  fontSize: '0.875rem',
  fontFamily: 'var(--font-ui)',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textDecoration: 'none',
  letterSpacing: '0.02em',
}

const activeLinkStyle: React.CSSProperties = {
  ...linkStyle,
  background: 'var(--color-primary)',
  color: '#fff',
}

export default function AdminNav() {
  const pathname = usePathname() ?? '/admin'

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={isActive(pathname, item.href) ? activeLinkStyle : linkStyle}
        >
          {item.label}
        </Link>
      ))}
      <form action="/api/admin-logout" method="post" style={{ marginLeft: 'auto' }}>
        <button
          type="submit"
          style={{
            ...linkStyle,
            background: 'transparent',
            border: '1px solid var(--color-border-soft)',
            cursor: 'pointer',
          }}
        >
          Log out
        </button>
      </form>
    </nav>
  )
}
