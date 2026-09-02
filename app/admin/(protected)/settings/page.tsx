import Link from 'next/link'
import { Icon, type IconName } from '@/components/admin/preview/icons'

export const dynamic = 'force-dynamic'

const DISPLAY = 'var(--font-display)'

const LINKS: { href: string; icon: IconName; title: string; desc: string }[] = [
  { href: '/admin/org', icon: 'users', title: 'The team', desc: 'Org chart, roster, and the Breakroom.' },
  { href: '/admin/glossary', icon: 'palette', title: 'Design system', desc: 'The admin visual vocabulary — chips, tokens, statuses.' },
  { href: '/admin/notepad', icon: 'note', title: 'Notepad', desc: 'Your quick-capture jots.' },
]

export default function SettingsPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.6rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, color: 'var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 8%, #fff)', border: '1px solid color-mix(in srgb, var(--color-primary) 12%, var(--admin-border))' }}>
          <Icon name="settings" size={20} />
        </span>
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--color-primary)', margin: 0, lineHeight: 1.05 }}>Settings</h1>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-muted)' }}>Admin conveniences + where to find things.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '.8rem', marginBottom: '2rem' }}>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', textDecoration: 'none', borderRadius: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 11, flexShrink: 0, color: 'var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 8%, #fff)', border: '1px solid color-mix(in srgb, var(--color-primary) 12%, var(--admin-border))' }}>
              <Icon name={l.icon} size={19} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text)' }}>{l.title}</span>
              <span style={{ display: 'block', fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-muted)', marginTop: 2 }}>{l.desc}</span>
            </span>
            <Icon name="arrow" size={15} style={{ color: 'var(--admin-text-subtle)' }} />
          </Link>
        ))}
      </div>

      <form action="/api/admin-logout" method="post">
        <button type="submit" className="admin-btn admin-btn-secondary admin-btn-sm">Log out</button>
      </form>

      <p style={{ marginTop: '1.6rem', fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-subtle)' }}>
        Fast-follows: ⌘K global search, a favorites strip, and per-admin preferences will live here.
      </p>
    </div>
  )
}
