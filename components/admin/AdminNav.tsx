'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = { href: string; label: string }
type NavGroup = { label: string | null; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ href: '/admin', label: 'Dashboard' }],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/alerts', label: 'Alerts' },
      { href: '/admin/intel', label: 'Intel' },
      { href: '/admin/programs', label: 'Programs' },
      { href: '/admin/sources', label: 'Sources' },
      { href: '/admin/content-ideas', label: 'Ideas' },
    ],
  },
  {
    label: 'Outbound',
    items: [
      { href: '/admin/newsletter', label: 'Newsletter' },
      { href: '/admin/subscribers', label: 'Subscribers' },
      { href: '/admin/briefs', label: 'Briefs' },
    ],
  },
  {
    label: 'Ops',
    items: [
      { href: '/admin/jobs', label: 'Jobs' },
      { href: '/admin/fact-checks', label: 'Fact Checks' },
      { href: '/admin/errors', label: 'Errors' },
    ],
  },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(href + '/')
}

export default function AdminNav() {
  const pathname = usePathname() ?? '/admin'

  return (
    <nav className="admin-nav">
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi} className="admin-nav-group">
          {group.label && <div className="admin-nav-group-label">{group.label}</div>}
          {group.items.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link${active ? ' is-active' : ''}`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
