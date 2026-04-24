'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = { href: string; label: string; abbr: string }
type NavGroup = { label: string | null; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ href: '/admin', label: 'Dashboard', abbr: 'Da' }],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/alerts', label: 'Alerts', abbr: 'Al' },
      { href: '/admin/intel', label: 'Intel', abbr: 'In' },
      { href: '/admin/programs', label: 'Programs', abbr: 'Pr' },
      { href: '/admin/sources', label: 'Sources', abbr: 'So' },
      { href: '/admin/content-ideas', label: 'Ideas', abbr: 'Id' },
    ],
  },
  {
    label: 'Outbound',
    items: [
      { href: '/admin/newsletter', label: 'Newsletter', abbr: 'Nw' },
      { href: '/admin/subscribers', label: 'Subscribers', abbr: 'Sb' },
      { href: '/admin/briefs', label: 'Briefs', abbr: 'Br' },
    ],
  },
  {
    label: 'Ops',
    items: [
      { href: '/admin/jobs', label: 'Jobs', abbr: 'Jo' },
      { href: '/admin/fact-checks', label: 'Fact Checks', abbr: 'Fc' },
      { href: '/admin/errors', label: 'Errors', abbr: 'Er' },
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
                title={item.label}
              >
                <span className="admin-nav-label">{item.label}</span>
                <span className="admin-nav-abbr" aria-hidden="true">{item.abbr}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
