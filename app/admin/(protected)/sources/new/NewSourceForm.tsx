'use client'

import { createSourceAction } from './actions'
import TextField from '@/components/admin/form/TextField'
import TextAreaField from '@/components/admin/form/TextAreaField'
import SelectField from '@/components/admin/form/SelectField'
import CheckboxField from '@/components/admin/form/CheckboxField'
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

export default function NewSourceForm() {
  const { error, submitting, handleSubmit } = useActionForm({
    action: createSourceAction,
    redirectOnSuccess: '/admin/sources',
  })

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
      <TextField name="name" label="Name" required placeholder="One Mile at a Time" />
      <TextField name="url" label="URL" type="url" required placeholder="https://" />
      <SelectField name="type" label="Type" required defaultValue="blog" options={SOURCE_TYPES} />
      <SelectField name="tier" label="Tier" required defaultValue="3" options={TIERS} />
      <SelectField name="scrape_frequency" label="Scrape Frequency" defaultValue="daily" options={FREQUENCIES} />
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
