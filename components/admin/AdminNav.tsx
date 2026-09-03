'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@/components/admin/preview/icons'

export type NavPerson = {
  id: string
  slug: string
  name: string
  role_title: string | null
  emoji: string | null
  image_url: string | null
  kind: 'owner' | 'chief' | 'agent'
  status: string
  reports_to_id: string | null
}

// Kept for API compatibility with the layout; tool badges are gone now that the
// nav is people-only, but the prop stays so the layout doesn't need changing.
export type AdminNavBadges = { refreshQueue?: number }

// ── Department colour families ──────────────────────────────────────────────
// Same hues the org chart uses (app/admin/(protected)/org/page.tsx) so a
// department reads as one family in both places: John green, Kesha rose, etc.
// Mixed into the theme surface/border tokens so the tints stay subtle and adapt
// to light/dark instead of hardcoding backgrounds.
const HEAD_HUE: Record<string, string> = {
  'bill-security': '#3F63C4',    // blue
  'priya-sources': '#2E9C9C',    // teal
  'john-content': '#3E9B57',     // green
  'kesha-social': '#C6457A',     // rose
  'janet-growth': '#C58A22',     // amber
  'devon-design': '#7A3FB0',     // violet
  'charlie-legal': '#8C6A3F',    // bronze
  'erica-finance': '#5B6B8C',    // slate
  'megan-partnerships': '#B04A86', // magenta
}
const FALLBACK_HUES = ['#4F8A8B', '#B5652A', '#6D6BC4', '#4E8C5A', '#B04A86', '#2F7DA6']

// Morning-meeting operational flow — the rhythm Jill knows. Heads render in
// this order; any head not listed falls through to the end (stable). Edit this
// one array to reorder the departments.
const DEPARTMENT_ORDER = [
  'bill-security',        // Security
  'priya-sources',        // Sources & Data Integrity
  'john-content',         // Content
  'kesha-social',         // Social
  'janet-growth',         // Growth & Revenue
  'devon-design',         // Design & UX
  'charlie-legal',        // Legal & Compliance
  'erica-finance',        // Finance & Accounting
  'megan-partnerships',   // Partnerships
]

type Tint = { ink: string; border: string; soft: string }
function tintFor(slug: string, idx: number): Tint {
  const hue = HEAD_HUE[slug] ?? FALLBACK_HUES[idx % FALLBACK_HUES.length]
  return {
    ink: hue,
    border: `color-mix(in srgb, ${hue} 55%, var(--admin-border))`,
    soft: `color-mix(in srgb, ${hue} 10%, transparent)`,
  }
}

// "Head of Design & UX" → "DESIGN & UX"
function deptName(roleTitle: string | null): string {
  const m = (roleTitle || '').match(/^head of\s+(.+)$/i)
  return (m ? m[1] : roleTitle || '').toUpperCase()
}

function Avatar({ p }: { p: NavPerson }) {
  return p.image_url ? (
    <span className="admin-nav-avatar">
      <Image src={p.image_url} alt={p.name} fill sizes="32px" style={{ objectFit: 'cover' }} />
    </span>
  ) : (
    <span className="admin-nav-avatar admin-nav-avatar-fallback">{p.emoji || '👤'}</span>
  )
}

function PersonLink({ p, active }: { p: NavPerson; active: boolean }) {
  return (
    <Link
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
}

function StaticLink({ href, icon, label, active }: { href: string; icon: IconName; label: string; active: boolean }) {
  return (
    <Link href={href} className={`admin-nav-link admin-nav-static${active ? ' is-active' : ''}`} title={label}>
      <span className="admin-nav-glyph"><Icon name={icon} size={18} /></span>
      <span className="admin-nav-label">{label}</span>
    </Link>
  )
}

// A small colour dot that precedes a department header, so departments stay
// distinct at a glance (and the tint carries the head's colour family).
function DeptHeader({ label, ink }: { label: string; ink?: string }) {
  return (
    <div className="admin-nav-section-label admin-nav-dept-label">
      <span
        aria-hidden="true"
        className="admin-nav-dept-dot"
        style={{ background: ink || 'var(--admin-accent)' }}
      />
      {label}
    </div>
  )
}

export default function AdminNav({ people = [] }: { badges?: AdminNavBadges; people?: NavPerson[] }) {
  const pathname = usePathname() ?? '/admin'
  const isActive = (slug: string) => pathname === `/admin/org/${slug}`

  // Build the org structure from the reporting edges — mirrors the org chart:
  // owner = Jill, chief = Morgan, heads report to the chief, specialists report
  // to a head.
  const owner = people.find((p) => p.kind === 'owner') || null
  const chief = people.find((p) => p.kind === 'chief') || null
  const leadership = [owner, chief].filter(Boolean) as NavPerson[]

  const statusRank: Record<string, number> = { active: 0, paused: 1, planned: 2, retired: 3 }
  const heads = people
    .filter((p) => p.kind === 'agent' && p.reports_to_id && p.reports_to_id === chief?.id)
    .sort((a, b) => {
      const ai = DEPARTMENT_ORDER.indexOf(a.slug)
      const bi = DEPARTMENT_ORDER.indexOf(b.slug)
      // Listed heads keep the morning-meeting order; unlisted heads sink to the
      // bottom, ordered by status then name so the list stays stable.
      if (ai !== bi) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      return ((statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9)) || a.name.localeCompare(b.name)
    })

  const specialistsByHead: Record<string, NavPerson[]> = {}
  for (const p of people) {
    if (p.kind !== 'agent' || !p.reports_to_id || p.reports_to_id === chief?.id) continue
    ;(specialistsByHead[p.reports_to_id] ||= []).push(p)
  }
  for (const id in specialistsByHead) {
    specialistsByHead[id].sort(
      (a, b) => ((statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9)) || a.name.localeCompare(b.name),
    )
  }

  return (
    <nav className="admin-nav admin-nav-people">
      <StaticLink href="/admin" icon="compass" label="Dashboard" active={pathname === '/admin'} />
      <StaticLink href="/admin/notepad" icon="note" label="Notepad" active={pathname.startsWith('/admin/notepad')} />

      <div className="admin-nav-divider" />

      {/* Leadership sits above every department. */}
      {leadership.length > 0 && (
        <>
          <DeptHeader label="LEADERSHIP" />
          {leadership.map((p) => (
            <PersonLink key={p.id} p={p} active={isActive(p.slug)} />
          ))}
        </>
      )}

      {/* Departments, in morning-meeting order: head on top, specialists tucked
          under, each tinted in the head's colour family. */}
      {heads.map((head, idx) => {
        const tint = tintFor(head.slug, idx)
        const specialists = specialistsByHead[head.id] || []
        return (
          <div key={head.id} className="admin-nav-dept">
            <DeptHeader label={deptName(head.role_title)} ink={tint.ink} />
            <PersonLink p={head} active={isActive(head.slug)} />
            {specialists.length > 0 && (
              <div className="admin-nav-dept-specialists" style={{ borderColor: tint.border }}>
                {specialists.map((s) => (
                  <PersonLink key={s.id} p={s} active={isActive(s.slug)} />
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="admin-nav-divider" />
      <StaticLink href="/admin/breakroom" icon="coffee" label="Breakroom" active={pathname.startsWith('/admin/breakroom')} />
      <StaticLink href="/admin/settings" icon="settings" label="Settings" active={pathname.startsWith('/admin/settings')} />
    </nav>
  )
}
