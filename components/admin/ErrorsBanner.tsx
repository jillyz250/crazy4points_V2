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
        padding: '0.625rem 2rem',
        background: '#7a1f1f',
        color: '#fff',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.875rem',
        fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      ⚠ {count} unresolved background error{count !== 1 ? 's' : ''} — review
    </Link>
  )
}
