import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { countUnresolvedSystemErrors } from '@/utils/supabase/queries'

export default async function ErrorsBanner() {
  const supabase = createAdminClient()
  const count = await countUnresolvedSystemErrors(supabase)
  if (count === 0) return null

  return (
    <Link
      href="/admin/errors"
      style={{
        display: 'block',
        borderBottom: '1px solid var(--admin-danger-soft)',
        background: 'var(--admin-danger-soft)',
        color: 'var(--admin-danger)',
        padding: '0.5rem 1.5rem',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.8125rem',
        fontWeight: 500,
        textDecoration: 'none',
      }}
    >
      <span style={{ maxWidth: '90rem', margin: '0 auto', display: 'block' }}>
        ⚠ {count} unresolved background error{count !== 1 ? 's' : ''} — review →
      </span>
    </Link>
  )
}
