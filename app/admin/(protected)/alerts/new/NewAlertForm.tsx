'use client'

import { createAlertAction } from './actions'
import type { Program } from '@/utils/supabase/queries'
import { ALERT_TYPES, ACTION_TYPES } from '@/lib/admin/alertTypes'
import TextField from '@/components/admin/form/TextField'
import TextAreaField from '@/components/admin/form/TextAreaField'
import SelectField from '@/components/admin/form/SelectField'
import FormActions from '@/components/admin/form/FormActions'
import FormError from '@/components/admin/form/FormError'
import TagProgramsPicker from '@/components/admin/form/TagProgramsPicker'
import { useActionForm } from '@/components/admin/form/useActionForm'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
] as const

const CONFIDENCE_OPTIONS = [
  { value: 'high', label: 'High — Confirmed' },
  { value: 'medium', label: 'Medium — Probable' },
  { value: 'low', label: 'Low — Rumored' },
] as const

interface Props {
  programs: Pick<Program, 'id' | 'name' | 'type'>[]
}

export default function NewAlertForm({ programs }: Props) {
  const { error, submitting, handleSubmit } = useActionForm({
    action: createAlertAction,
    redirectOnSuccess: '/admin/alerts',
  })

  const programOptions = programs.map((p) => ({ value: p.id, label: p.name }))

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
      <TextField name="title" label="Title" required />
      <SelectField name="type" label="Alert Type" required options={ALERT_TYPES} />
      <SelectField name="status" label="Status" defaultValue="draft" options={STATUS_OPTIONS} />
      <SelectField
        name="primary_program_id"
        label="Program"
        options={programOptions}
        includeEmpty="— None —"
      />
      <SelectField name="action_type" label="Action Type" required options={ACTION_TYPES} />
      <TextAreaField name="description" label="Description" required rows={4} />
      <TextAreaField
        name="history_note"
        label="History Note"
        rows={2}
        placeholder="e.g. Last bonus was 50% in June 2025"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <TextField name="start_date" label="Start Date" type="date" required />
        <TextField name="end_date" label="End Date" type="date" />
      </div>

      <SelectField
        name="confidence_level"
        label="Confidence Level"
        required
        defaultValue="medium"
        options={CONFIDENCE_OPTIONS}
      />
      <TextField name="source_url" label="Source URL" type="url" placeholder="https://" />

      <TagProgramsPicker programs={programs} />

      <FormError error={error} />
      <FormActions submitLabel="Create Alert" submitting={submitting} cancelHref="/admin/alerts" />
    </form>
  )
}
