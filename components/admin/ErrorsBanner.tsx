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
        background: 'var(--admin-danger-soft)',
        color: 'var(--admin-danger)',
        borderBottom: '1px solid rgba(185, 28, 28, 0.15)',
        padding: '0.5rem 2rem',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.8125rem',
        fontWeight: 500,
        textDecoration: 'none',
      }}
    >
      ⚠ {count} unresolved background error{count !== 1 ? 's' : ''} — review →
    </Link>
  )
}
