'use client'

import { useTransition } from 'react'

/**
 * Generic confirm-then-submit button. Used for irreversible-ish actions
 * (expire, reject, etc.) where a misclick is costly. Wraps a server action
 * call with a window.confirm() guard.
 */
export default function ConfirmButton({
  action,
  confirmMessage,
  children,
  variant = 'ghost',
}: {
  action: () => Promise<unknown>
  confirmMessage: string
  children: React.ReactNode
  variant?: 'ghost' | 'secondary' | 'primary' | 'danger'
}) {
  const [pending, startTransition] = useTransition()
  const cls = `admin-btn admin-btn-sm ${
    variant === 'danger' ? 'admin-btn-danger' : `admin-btn-${variant}`
  }`
  return (
    <button
      type="button"
      disabled={pending}
      className={cls}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return
        startTransition(async () => {
          await action()
        })
      }}
    >
      {pending ? '…' : children}
    </button>
  )
}
