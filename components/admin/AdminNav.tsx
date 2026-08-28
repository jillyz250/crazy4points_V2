'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

type NavItem = {
  href: string
  label: string
  abbr: string
  /** Optional match override. `search` is the current query string (without the `?`). */
  match?: (pathname: string, search?: string) => boolean
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
      { href: '/admin/triage', label: 'Triage', abbr: 'Tr' },
    ],
  },
  {
    label: 'Writing',
    items: [
      { href: '/admin/drafts', label: 'Drafts', abbr: 'Dr' },
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
      { href: '/admin/topics', label: 'Topics', abbr: 'Tp' },
      { href: '/admin/question-radar', label: 'Question Radar', abbr: 'QR' },
      { href: '/admin/experiences', label: 'Experiences', abbr: 'Xp' },
      { href: '/admin/creatives', label: 'Creatives', abbr: 'Cr' },
      { href: '/admin/short-links', label: 'Short links', abbr: 'Sl' },
    ],
  },
  {
    label: 'Reference',
    items: [
      { href: '/admin/programs', label: 'Programs', abbr: 'Pr' },
      {
        href: '/admin/programs?type=loyalty_program',
        label: 'Currencies',
        abbr: 'Cu',
        match: (p, search) => p === '/admin/programs' && (search ?? '').includes('type=loyalty_program'),
      },
      {
        href: '/admin/programs?type=hotel',
        label: 'Hotels',
        abbr: 'Ho',
        match: (p, search) => p === '/admin/programs' && (search ?? '').includes('type=hotel'),
      },
      {
        href: '/admin/programs?type=ota',
        label: 'OTAs',
        abbr: 'Ot',
        match: (p, search) => p === '/admin/programs' && (search ?? '').includes('type=ota'),
      },
      { href: '/admin/issuers', label: 'Issuers', abbr: 'Is' },
      { href: '/admin/cards', label: 'Cards', abbr: 'Cd' },
      { href: '/admin/tokens', label: 'Tokens', abbr: 'Tk' },
      { href: '/admin/partner-redemptions', label: 'Partner Redemptions', abbr: 'PR' },
      { href: '/admin/scrapes', label: 'Scrapes', abbr: 'Sc' },
    ],
  },
  {
    label: 'Audience',
    items: [{ href: '/admin/subscribers', label: 'Subscribers', abbr: 'Su' }],
  },
  {
    label: 'Ops',
    items: [
      { href: '/admin/extractions', label: 'Extractions', abbr: 'Ex', badgeKey: 'refreshQueue' },
      { href: '/admin/manual-overrides', label: 'Manual overrides', abbr: 'Mo' },
      { href: '/admin/jobs', label: 'Jobs', abbr: 'Jo' },
      { href: '/admin/briefs', label: 'Briefs', abbr: 'Br' },
      { href: '/admin/fact-checks', label: 'Fact Checks', abbr: 'Fc' },
      { href: '/admin/errors', label: 'Errors', abbr: 'Er' },
      { href: '/admin/ai-usage', label: 'AI Usage', abbr: 'Ai' },
      { href: '/admin/backups', label: 'Backups', abbr: 'Bk' },
    ],
  },
]

export type AdminNavBadges = {
  refreshQueue?: number
}

function defaultIsActive(pathname: string, href: string, search?: string): boolean {
  const [justPath, hrefQuery] = href.split('?')
  if (justPath === '/admin') return pathname === '/admin'
  const pathMatches = pathname === justPath || pathname.startsWith(justPath + '/')
  if (!pathMatches) return false
  // When the href carries a query (e.g. ?type=hotel), require it to be active.
  // When the href has no query, only highlight when no recognized filter is
  // active — so /admin/programs doesn't co-light with /admin/programs?type=hotel.
  if (hrefQuery) {
    return (search ?? '').includes(hrefQuery)
  }
  return !(search ?? '').includes('type=')
}

export default function AdminNav({ badges = {} }: { badges?: AdminNavBadges }) {
  const pathname = usePathname() ?? '/admin'
  const searchParams = useSearchParams()
  const search = searchParams?.toString() ?? ''

  return (
    <nav className="admin-nav">
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi} className="admin-nav-group">
          {group.label && <div className="admin-nav-group-label">{group.label}</div>}
          {group.items.map((item) => {
            const active = item.match
              ? item.match(pathname, search)
              : defaultIsActive(pathname, item.href, search)
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
