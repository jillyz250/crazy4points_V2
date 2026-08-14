import Link from 'next/link'
import { Card } from '@/components/admin/ui/Card'
import { listTakes, addTakeAction, setTakeStatusAction } from '@/app/admin/(protected)/takes/actions'

/**
 * "Jill's Takes" — zero-friction capture inbox for real-life travel
 * experiences that feed the biweekly newsletter. Jot one the moment it
 * happens; it waits in the backlog until the next issue. Dashboard card
 * shows the add box + the backlog; /admin/takes is the full manager.
 */
function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function JillsTakesCard() {
  const backlog = await listTakes('new')

  const inputStyle: React.CSSProperties = {
    width: '100%', fontSize: '0.9rem', padding: '0.5rem 0.6rem', borderRadius: 'var(--admin-radius)',
    border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text)',
    fontFamily: 'inherit', resize: 'vertical',
  }

  return (
    <Card style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.6rem' }}>
        <h2 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--admin-text)' }}>
          Jill&apos;s Takes{' '}
          <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-subtle)', fontWeight: 500 }}>
            · {backlog.length} in backlog
          </span>
        </h2>
        <Link href="/admin/takes" style={{ fontSize: '0.8125rem', color: 'var(--admin-link)' }}>Manage all →</Link>
      </div>

      <p style={{ margin: '0 0 0.6rem', fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
        A real experience worth a newsletter mention? Jot it here so it&apos;s waiting when you write the next issue.
      </p>

      {/* Add box */}
      <form action={addTakeAction} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: backlog.length ? '0.9rem' : 0 }}>
        <textarea
          name="note"
          rows={3}
          required
          placeholder="e.g. Broke my own rule and transferred Amex to Air France for a bonus — worked out for Brandon's Ohio trip..."
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input name="program_slug" placeholder="program (optional, e.g. flying-blue)" style={{ ...inputStyle, width: 'auto', flex: 1 }} />
          <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">Add take</button>
        </div>
      </form>

      {/* Backlog list */}
      {backlog.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--admin-border)', paddingTop: '0.7rem' }}>
          {backlog.slice(0, 6).map((t) => (
            <li key={t.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--admin-text)', lineHeight: 1.4 }}>
                {t.note}
                <span style={{ display: 'block', marginTop: '0.15rem', fontSize: '0.7rem', color: 'var(--admin-text-subtle)' }}>
                  {formatDate(t.created_at)}{t.program_slug ? ` · ${t.program_slug}` : ''}
                </span>
              </span>
              <span style={{ display: 'flex', gap: '0.3rem', flex: '0 0 auto' }}>
                <form action={setTakeStatusAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="status" value="used" />
                  <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm" title="Mark used in a newsletter">Used</button>
                </form>
                <form action={setTakeStatusAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="status" value="archived" />
                  <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm" title="Archive (not using)">✕</button>
                </form>
              </span>
            </li>
          ))}
          {backlog.length > 6 && (
            <li style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)' }}>
              <Link href="/admin/takes" style={{ color: 'var(--admin-link)' }}>+ {backlog.length - 6} more in the backlog →</Link>
            </li>
          )}
        </ul>
      )}
    </Card>
  )
}
