'use client'

import { useState, useMemo } from 'react'
import { createSourceAction } from './actions'
import TextField from '@/components/admin/form/TextField'
import TextAreaField from '@/components/admin/form/TextAreaField'
import SelectField from '@/components/admin/form/SelectField'
import CheckboxField from '@/components/admin/form/CheckboxField'
import Field from '@/components/admin/form/Field'
import { inputStyle } from '@/components/admin/form/styles'
import FormActions from '@/components/admin/form/FormActions'
import FormError from '@/components/admin/form/FormError'
import { useActionForm } from '@/components/admin/form/useActionForm'

const SOURCE_TYPES = [
  { value: 'official_partner', label: 'Official Partner' },
  { value: 'blog', label: 'Blog' },
  { value: 'community', label: 'Community' },
  { value: 'social', label: 'Social' },
  { value: 'email', label: 'Email' },
] as const

const TIERS = [
  { value: '1', label: '1 — Official / Highest Trust' },
  { value: '2', label: '2 — Known Reliable' },
  { value: '3', label: '3 — Standard' },
  { value: '4', label: '4 — Low Trust' },
  { value: '5', label: '5 — Experimental' },
] as const

const FREQUENCIES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
] as const

const INTAKE_METHODS = [
  { value: 'scrape', label: 'Scrape (Claude Scout via Firecrawl)' },
  { value: 'email', label: 'Email (forwarded to alias)' },
  { value: 'grok', label: 'Grok poller (deferred, Phase 2c)' },
  { value: 'x', label: 'X API direct (deferred, Phase 2d)' },
  { value: 'manual', label: 'Manual paste' },
]

// Resend sandbox domain. Switch to in.crazy4points.com if/when Resend Inbound
// is configured on a custom subdomain (Phase 2a.2 follow-up).
const INBOX_DOMAIN = 'ouarkiwhag.resend.app'

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 -]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 32)
}

export default function NewSourceForm() {
  const { error, submitting, handleSubmit } = useActionForm({
    action: createSourceAction,
    redirectOnSuccess: '/admin/sources',
  })

  const [name, setName] = useState('')
  const [intakeMethod, setIntakeMethod] = useState<string>('scrape')
  const [aliasTouched, setAliasTouched] = useState(false)
  const [inboxAddress, setInboxAddress] = useState('')

  const suggestedAlias = useMemo(() => {
    const slug = slugify(name) || 'source'
    return `intel+${slug}@${INBOX_DOMAIN}`
  }, [name])
  const displayedAlias = aliasTouched ? inboxAddress : suggestedAlias

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
      {/* Name — controlled so we can derive the inbox alias suggestion */}
      <Field label="Name" htmlFor="name" required>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Marriott Bonvoy promos"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
      </Field>

      <TextField name="url" label="URL" type="url" required placeholder="https://" />
      <SelectField name="type" label="Type" required defaultValue="blog" options={SOURCE_TYPES} />
      <SelectField name="tier" label="Tier" required defaultValue="3" options={TIERS} />

      {/* Intake method — controlled so we can conditionally show the email alias block */}
      <Field label="Intake method" htmlFor="intake_method" required>
        <select
          id="intake_method"
          name="intake_method"
          required
          value={intakeMethod}
          onChange={(e) => setIntakeMethod(e.target.value)}
          style={inputStyle}
        >
          {INTAKE_METHODS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>

      {intakeMethod === 'email' && (
        <div
          style={{
            padding: '0.875rem 1rem',
            marginBottom: '1rem',
            background: 'var(--color-chip-blue-bg)',
            border: '1px solid var(--color-chip-blue)',
            borderRadius: 'var(--admin-radius)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--color-chip-blue-fg)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontFamily: 'var(--font-ui)' }}>
            Email intake setup
          </div>
          <p style={{ margin: '0 0 0.75rem 0', lineHeight: 1.5 }}>
            The alias below is where forwarded emails should land. Set up a Gmail filter with this
            as the &quot;Forward to&quot; address; matching emails get auto-tagged with this source.
          </p>
          <Field label="Inbox alias" htmlFor="inbox_address" required>
            <input
              id="inbox_address"
              name="inbox_address"
              type="text"
              required
              value={displayedAlias}
              onChange={(e) => {
                setAliasTouched(true)
                setInboxAddress(e.target.value)
              }}
              placeholder={suggestedAlias}
              style={inputStyle}
            />
          </Field>
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.25rem' }}>
            Auto-suggested from the name. Must be unique and point at {INBOX_DOMAIN}.
          </div>
        </div>
      )}

      {intakeMethod !== 'email' && (
        <input type="hidden" name="inbox_address" value="" />
      )}

      <SelectField
        name="scrape_frequency"
        label="Scrape Frequency"
        defaultValue="daily"
        options={FREQUENCIES}
      />
      <TextAreaField name="notes" label="Notes" placeholder="Anything worth remembering about this source" />
      <CheckboxField name="use_firecrawl" label="Use Firecrawl for this source" />

      <FormError error={error} />
      <FormActions
        submitLabel="Create Source"
        submitting={submitting}
        cancelHref="/admin/sources"
      />
    </form>
  )
}
