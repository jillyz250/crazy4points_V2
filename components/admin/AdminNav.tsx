'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  href: string
  label: string
  abbr: string
  match?: (pathname: string) => boolean
}
type NavGroup = { label: string | null; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ href: '/admin', label: 'Dashboard', abbr: 'Da' }],
  },
  {
    label: 'Pipeline',
    items: [
      { href: '/admin/sources', label: 'Sources', abbr: 'So' },
      { href: '/admin/intel', label: 'Intel', abbr: 'In' },
    ],
  },
  {
    label: 'Writing',
    items: [
      { href: '/admin/alerts', label: 'Alerts', abbr: 'Al' },
      {
        href: '/admin/content-ideas?type=blog',
        label: 'Blog',
        abbr: 'Bl',
        // Light up on the content-ideas page regardless of filter — bare
        // /admin/content-ideas (no nav target now that "Ideas" is gone)
        // should still highlight where the user is.
        match: (p) => p === '/admin/content-ideas',
      },
      { href: '/admin/newsletter', label: 'Newsletter', abbr: 'Nw' },
    ],
  },
  {
    label: 'Reference',
    items: [{ href: '/admin/programs', label: 'Programs', abbr: 'Pr' }],
  },
  {
    label: 'Audience',
    items: [{ href: '/admin/subscribers', label: 'Subscribers', abbr: 'Su' }],
  },
  {
    label: 'Ops',
    items: [
      { href: '/admin/jobs', label: 'Jobs', abbr: 'Jo' },
      { href: '/admin/briefs', label: 'Briefs', abbr: 'Br' },
      { href: '/admin/fact-checks', label: 'Fact Checks', abbr: 'Fc' },
      { href: '/admin/errors', label: 'Errors', abbr: 'Er' },
    ],
  },
]

function defaultIsActive(pathname: string, href: string): boolean {
  // Strip any query string from the href before comparing.
  const justPath = href.split('?')[0]
  if (justPath === '/admin') return pathname === '/admin'
  return pathname === justPath || pathname.startsWith(justPath + '/')
}

export default function AdminNav() {
  const pathname = usePathname() ?? '/admin'

  return (
    <nav className="admin-nav">
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi} className="admin-nav-group">
          {group.label && <div className="admin-nav-group-label">{group.label}</div>}
          {group.items.map((item) => {
            const active = item.match
              ? item.match(pathname)
              : defaultIsActive(pathname, item.href)
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
