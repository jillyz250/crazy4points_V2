'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  href: string
  label: string
  abbr: string
  match?: (pathname: string) => boolean
  /** Key into the `badges` prop (set by the parent layout). */
  badgeKey?: 'refreshQueue'
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
    items: [
      { href: '/admin/programs', label: 'Programs', abbr: 'Pr' },
      { href: '/admin/partner-redemptions', label: 'Partner Redemptions', abbr: 'PR' },
    ],
  },
  {
    label: 'Audience',
    items: [{ href: '/admin/subscribers', label: 'Subscribers', abbr: 'Su' }],
  },
  {
    label: 'Ops',
    items: [
      { href: '/admin/refresh-queue', label: 'Refresh queue', abbr: 'Rq', badgeKey: 'refreshQueue' },
      { href: '/admin/jobs', label: 'Jobs', abbr: 'Jo' },
      { href: '/admin/briefs', label: 'Briefs', abbr: 'Br' },
      { href: '/admin/fact-checks', label: 'Fact Checks', abbr: 'Fc' },
      { href: '/admin/errors', label: 'Errors', abbr: 'Er' },
      { href: '/admin/ai-usage', label: 'AI Usage', abbr: 'Ai' },
    ],
  },
]

export type AdminNavBadges = {
  refreshQueue?: number
}

function defaultIsActive(pathname: string, href: string): boolean {
  // Strip any query string from the href before comparing.
  const justPath = href.split('?')[0]
  if (justPath === '/admin') return pathname === '/admin'
  return pathname === justPath || pathname.startsWith(justPath + '/')
}

export default function AdminNav({ badges = {} }: { badges?: AdminNavBadges }) {
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
            const badgeCount = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link${active ? ' is-active' : ''}`}
                title={item.label}
              >
                <span className="admin-nav-label">
                  {item.label}
                  {badgeCount > 0 && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        display: 'inline-block',
                        minWidth: '1.25rem',
                        padding: '0.0625rem 0.375rem',
                        borderRadius: '9999px',
                        background: 'var(--admin-warning, #d97706)',
                        color: '#fff',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        lineHeight: '1.1',
                      }}
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </span>
                <span className="admin-nav-abbr" aria-hidden="true">{item.abbr}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
