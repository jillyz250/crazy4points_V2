'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@/components/admin/preview/icons'

export type NavPerson = {
  slug: string
  name: string
  role_title: string | null
  emoji: string | null
  image_url: string | null
  kind: 'owner' | 'chief' | 'agent'
  status: string
}

// Kept for API compatibility with the layout; tool badges are gone now that the
// nav is people-only, but the prop stays so the layout doesn't need changing.
export type AdminNavBadges = { refreshQueue?: number }

function Avatar({ p }: { p: NavPerson }) {
  return p.image_url ? (
    <span className="admin-nav-avatar">
      <Image src={p.image_url} alt={p.name} fill sizes="32px" style={{ objectFit: 'cover' }} />
    </span>
  ) : (
    <span className="admin-nav-avatar admin-nav-avatar-fallback">{p.emoji || '👤'}</span>
  )
}

function StaticLink({ href, icon, label, active }: { href: string; icon: IconName; label: string; active: boolean }) {
  return (
    <Link href={href} className={`admin-nav-link admin-nav-static${active ? ' is-active' : ''}`} title={label}>
      <span className="admin-nav-glyph"><Icon name={icon} size={18} /></span>
      <span className="admin-nav-label">{label}</span>
    </Link>
  )
}

export default function AdminNav({ people = [] }: { badges?: AdminNavBadges; people?: NavPerson[] }) {
  const pathname = usePathname() ?? '/admin'

  return (
    <nav className="admin-nav admin-nav-people">
      <StaticLink href="/admin" icon="compass" label="Dashboard" active={pathname === '/admin'} />
      <StaticLink href="/admin/notepad" icon="note" label="Notepad" active={pathname.startsWith('/admin/notepad')} />

      <div className="admin-nav-divider" />
      <div className="admin-nav-section-label">The team</div>

      {people.map((p) => {
        const active = pathname === `/admin/org/${p.slug}`
        return (
          <Link
            key={p.slug}
            href={`/admin/org/${p.slug}`}
            className={`admin-nav-link admin-nav-person${active ? ' is-active' : ''}`}
            title={`${p.name} — ${p.role_title || ''}`}
            style={{ opacity: p.status === 'planned' ? 0.6 : 1 }}
          >
            <Avatar p={p} />
            <span className="admin-nav-person-meta">
              <span className="admin-nav-person-name">{p.name}</span>
              <span className="admin-nav-person-role">{p.role_title || ''}</span>
            </span>
          </Link>
        )
      })}

      <div className="admin-nav-divider" />
      <StaticLink href="/admin/settings" icon="settings" label="Settings" active={pathname.startsWith('/admin/settings')} />
    </nav>
  )
}
