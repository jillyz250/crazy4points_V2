'use client'

import { useRouter } from 'next/navigation'

export default function ProgramStatusToggle({
  slug,
  status,
}: {
  slug: string
  status: 'active' | 'all'
}) {
  const router = useRouter()

  return (
    <div className="flex overflow-hidden rounded-[var(--radius-ui)] border border-[var(--color-border-soft)]">
      <button
        type="button"
        onClick={() => router.push(`/programs/${slug}?status=active`)}
        className={`px-4 py-2 font-ui text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
          status === 'active'
            ? 'bg-[var(--color-primary)] text-white'
            : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
        }`}
      >
        Active Only
      </button>
      <button
        type="button"
        onClick={() => router.push(`/programs/${slug}?status=all`)}
        className={`px-4 py-2 font-ui text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
          status === 'all'
            ? 'bg-[var(--color-primary)] text-white'
            : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
        }`}
      >
        All
      </button>
    </div>
  )
}
