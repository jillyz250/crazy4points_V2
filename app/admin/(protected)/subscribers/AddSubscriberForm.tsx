'use client'

import { useState, useTransition } from 'react'
import { addSubscriberAction } from './actions'

export default function AddSubscriberForm() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, start] = useTransition()

  function reset() {
    setEmail('')
    setFirstName('')
    setLastName('')
    setError(null)
    setMessage(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('email', email)
    fd.set('first_name', firstName)
    fd.set('last_name', lastName)
    start(async () => {
      const res = await addSubscriberAction(fd)
      if (res.ok) {
        setMessage(`Added ${res.subscriber?.email}.`)
        setError(null)
        setEmail('')
        setFirstName('')
        setLastName('')
      } else {
        setError(res.error ?? 'Add failed.')
        setMessage(null)
      }
    })
  }

  if (!open) {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => { setOpen(true); reset() }}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid var(--admin-accent)',
            borderRadius: 'var(--admin-radius)',
            background: '#fff',
            color: 'var(--admin-accent)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Add subscriber
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginBottom: '1rem',
        padding: '1rem 1.125rem',
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
        borderRadius: 'var(--admin-radius-lg)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.625rem' }}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          className="admin-input"
          style={{ flex: '2 1 240px' }}
          disabled={isPending}
          autoFocus
        />
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name (optional)"
          className="admin-input"
          style={{ flex: '1 1 140px' }}
          disabled={isPending}
        />
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name (optional)"
          className="admin-input"
          style={{ flex: '1 1 140px' }}
          disabled={isPending}
        />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="submit"
          disabled={isPending || !email.trim()}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: 'var(--admin-radius)',
            background: 'var(--admin-accent)',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: isPending ? 'wait' : 'pointer',
            opacity: isPending || !email.trim() ? 0.6 : 1,
          }}
        >
          {isPending ? 'Adding…' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); reset() }}
          disabled={isPending}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid var(--admin-border)',
            borderRadius: 'var(--admin-radius)',
            background: 'transparent',
            color: 'var(--admin-text-muted)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        {(message || error) && (
          <span style={{
            fontSize: '0.8125rem',
            color: error ? 'var(--admin-danger)' : 'var(--admin-success)',
            fontWeight: 500,
          }}>
            {error ?? message}
          </span>
        )}
      </div>
    </form>
  )
}
