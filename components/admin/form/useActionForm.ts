'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ActionResult } from '@/lib/admin/actionResult'
import { isRedirectError } from '@/lib/admin/actionResult'

type Action = (formData: FormData) => Promise<ActionResult<unknown> | void>

interface Options {
  action: Action
  redirectOnSuccess?: string
}

interface State {
  error: string | null
  submitting: boolean
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
}

export function useActionForm({ action, redirectOnSuccess }: Options): State {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const result = await action(new FormData(e.currentTarget))
      if (result && !result.ok) {
        setError(result.error)
        setSubmitting(false)
      }
    } catch (err) {
      if (isRedirectError(err)) {
        if (redirectOnSuccess) router.push(redirectOnSuccess)
        return
      }
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSubmitting(false)
    }
  }

  return { error, submitting, handleSubmit }
}
