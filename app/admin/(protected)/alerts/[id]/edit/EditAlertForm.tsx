'use client'

import { updateAlertAction } from './actions'
import type { Alert, Program } from '@/utils/supabase/queries'
import FactCheckWarnings from '@/components/admin/FactCheckWarnings'
import { ALERT_TYPES, ACTION_TYPES } from '@/lib/admin/alertTypes'
import TextField from '@/components/admin/form/TextField'
import TextAreaField from '@/components/admin/form/TextAreaField'
import SelectField from '@/components/admin/form/SelectField'
import CheckboxField from '@/components/admin/form/CheckboxField'
import FormActions from '@/components/admin/form/FormActions'
import FormError from '@/components/admin/form/FormError'
import TagProgramsPicker from '@/components/admin/form/TagProgramsPicker'
import { useActionForm } from '@/components/admin/form/useActionForm'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
] as const

const CONFIDENCE_OPTIONS = [
  { value: 'high', label: 'High — Confirmed' },
  { value: 'medium', label: 'Medium — Probable' },
  { value: 'low', label: 'Low — Rumored' },
] as const

function toDateInputValue(iso: string | null): string {
  return iso ? iso.split('T')[0] : ''
}

interface Props {
  alert: Alert
  programs: Pick<Program, 'id' | 'name' | 'type'>[]
  taggedProgramIds: string[]
}

export default function EditAlertForm({ alert, programs, taggedProgramIds }: Props) {
  const { error, submitting, handleSubmit } = useActionForm({
    action: (fd) => updateAlertAction(alert.id, fd),
    redirectOnSuccess: '/admin/alerts',
  })

  const programOptions = programs.map((p) => ({ value: p.id, label: p.name }))

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
      {/* Preserve published_at so update action can keep it unchanged */}
      <input type="hidden" name="existing_published_at" value={alert.published_at ?? ''} />

      <div style={{ marginBottom: '1.25rem' }}>
        <FactCheckWarnings alertId={alert.id} claims={alert.fact_check_claims} />
      </div>

      <TextField name="title" label="Title" required defaultValue={alert.title} />
      <TextField name="summary" label="Summary" required defaultValue={alert.summary} />
      <SelectField name="type" label="Alert Type" required defaultValue={alert.type} options={ALERT_TYPES} />
      <SelectField name="status" label="Status" defaultValue={alert.status} options={STATUS_OPTIONS} />
      <SelectField
        name="primary_program_id"
        label="Program"
        defaultValue={alert.primary_program_id ?? ''}
        options={programOptions}
        includeEmpty="— None —"
      />
      <SelectField name="action_type" label="Action Type" required defaultValue={alert.action_type} options={ACTION_TYPES} />
      <TextAreaField name="description" label="Description" rows={4} defaultValue={alert.description ?? ''} />
      <TextAreaField
        name="history_note"
        label="History Note"
        rows={2}
        placeholder="e.g. Last bonus was 50% in June 2025"
        defaultValue={alert.history_note ?? ''}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <TextField name="start_date" label="Start Date" type="date" defaultValue={toDateInputValue(alert.start_date)} />
        <TextField name="end_date" label="End Date" type="date" defaultValue={toDateInputValue(alert.end_date)} />
      </div>

      <SelectField
        name="confidence_level"
        label="Confidence Level"
        required
        defaultValue={alert.confidence_level}
        options={CONFIDENCE_OPTIONS}
      />
      <TextField
        name="source_url"
        label="Source URL"
        type="url"
        placeholder="https://"
        defaultValue={alert.source_url ?? ''}
      />

      <CheckboxField
        name="is_hot"
        label="Feature in Hot Alerts bar (homepage)"
        defaultChecked={alert.is_hot}
      />

      <TagProgramsPicker programs={programs} defaultSelected={taggedProgramIds} />

      <FormError error={error} />
      <FormActions submitLabel="Save Changes" submitting={submitting} cancelHref="/admin/alerts" />
    </form>
  )
}
