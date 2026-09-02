'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { getNavOwnerGroups, type AdminPage } from '@/lib/admin/registry'

export type AdminNavBadges = {
  refreshQueue?: number
}

// Built once at module load — the registry is static.
const OWNER_GROUPS = getNavOwnerGroups()

function isActive(page: AdminPage, pathname: string, search: string): boolean {
  if (page.match) return page.match(pathname, search)
  const [justPath, hrefQuery] = page.path.split('?')
  if (justPath === '/admin') return pathname === '/admin'
  const pathMatches = pathname === justPath || pathname.startsWith(justPath + '/')
  if (!pathMatches) return false
  // When the href carries a query (e.g. ?type=hotel), require it to be active.
  // When it doesn't, only highlight when no recognized filter is active — so
  // /admin/programs doesn't co-light with /admin/programs?type=hotel.
  if (hrefQuery) return search.includes(hrefQuery)
  return !search.includes('type=')
}

export default function AdminNav({ badges = {} }: { badges?: AdminNavBadges }) {
  const pathname = usePathname() ?? '/admin'
  const searchParams = useSearchParams()
  const search = searchParams?.toString() ?? ''

  return (
    <nav className="admin-nav">
      {OWNER_GROUPS.map(({ owner, sections }) => (
        <div key={owner.slug} className="admin-nav-owner">
          {/* Owner header: who owns this stretch of the panel. */}
          <div className="admin-nav-owner-header" title={`${owner.name} — ${owner.role}`}>
            <span className="admin-nav-owner-emoji" aria-hidden="true">{owner.emoji}</span>
            <span className="admin-nav-owner-meta">
              <span className="admin-nav-owner-name">{owner.name}</span>
              <span className="admin-nav-owner-role">{owner.role}</span>
            </span>
          </div>

          {sections.map((section) => (
            <div key={section.taskCategory} className="admin-nav-group">
              {/* Light task sub-label so the panel still reads task-first. */}
              <div className="admin-nav-group-label">{section.taskCategory}</div>
              {section.pages.map((page) => {
                const active = isActive(page, pathname, search)
                const badgeCount = page.badgeKey ? badges[page.badgeKey] ?? 0 : 0
                return (
                  <Link
                    key={page.id}
                    href={page.path}
                    className={`admin-nav-link${active ? ' is-active' : ''}`}
                    title={page.description || page.title}
                  >
                    <span className="admin-nav-icon" aria-hidden="true">{page.icon}</span>
                    <span className="admin-nav-label">
                      {page.title}
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
                    <span className="admin-nav-abbr" aria-hidden="true">{page.abbr}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      ))}
    </nav>
  )
}
