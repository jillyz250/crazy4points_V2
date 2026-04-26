'use client'

import { updateAlertAction } from './actions'
import type { Alert, Program } from '@/utils/supabase/queries'
import FactCheckWarnings from '@/components/admin/FactCheckWarnings'
import RunAllChecksAlertButton from '@/components/admin/RunAllChecksAlertButton'
import { Badge } from '@/components/admin/ui/Badge'
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

      {/* Phase 5b — verification pills + one-click pipeline. Mirrors the blog
          drafts UI on /admin/content-ideas so the alert review workflow has
          parity. */}
      {(() => {
        const claims = Array.isArray(alert.fact_check_claims)
          ? (alert.fact_check_claims as { supported?: boolean; severity?: string; acknowledged?: boolean }[])
          : []
        const flagged = claims.some((c) => !c.supported && c.severity === 'high' && !c.acknowledged)
        const factOn = Boolean(alert.fact_check_at) && !flagged
        const voiceOn = Boolean(alert.voice_checked_at) && alert.voice_pass === true
        const origOn = Boolean(alert.originality_checked_at) && alert.originality_pass === true
        const pills: { label: string; on: boolean; hint: string }[] = [
          {
            label: 'Written',
            on: Boolean(alert.description) || Boolean(alert.summary),
            hint: alert.description ? 'Description present' : alert.summary ? 'Summary only' : 'Empty',
          },
          {
            label: 'Fact-checked',
            on: factOn,
            hint: alert.fact_check_at
              ? flagged
                ? 'Has unresolved high-severity flags'
                : `Fact-checked ${new Date(alert.fact_check_at).toLocaleDateString()}`
              : 'Not fact-checked',
          },
          {
            label: 'On-brand voice',
            on: voiceOn,
            hint: alert.voice_checked_at
              ? alert.voice_notes
                ? `${alert.voice_pass ? 'PASS' : 'FAIL'} — ${alert.voice_notes}`
                : `Voice-checked ${new Date(alert.voice_checked_at).toLocaleDateString()}`
              : 'Not voice-checked',
          },
          {
            label: 'Original',
            on: origOn,
            hint: alert.originality_checked_at
              ? alert.originality_notes
                ? `${alert.originality_pass ? 'PASS' : 'FAIL'} — ${alert.originality_notes}`
                : `Originality checked ${new Date(alert.originality_checked_at).toLocaleDateString()}`
              : 'Originality not checked',
          },
        ]
        return (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
              {pills.map((p) => (
                <span key={p.label} title={p.hint}>
                  <Badge tone={p.on ? 'success' : 'neutral'}>
                    {p.on ? '✓' : '○'} {p.label}
                  </Badge>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <RunAllChecksAlertButton alertId={alert.id} />
            </div>
          </div>
        )
      })()}

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
        name="why_this_matters"
        label="Why This Matters"
        rows={2}
        placeholder="One short editorial reason readers should care. Auto-filled from the daily brief; edit freely."
        defaultValue={alert.why_this_matters ?? ''}
      />
      <TextAreaField
        name="history_note"
        label="History Note"
        rows={2}
        placeholder="e.g. Last bonus was 50% in June 2025"
        defaultValue={alert.history_note ?? ''}
      />
      <TextAreaField
        name="override_reason"
        label="Override Reason (optional)"
        rows={2}
        placeholder="If publishing this despite a fact-check flag, soft source, or low confidence — note why."
        defaultValue={alert.override_reason ?? ''}
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

      <TagProgramsPicker
        programs={programs.filter((p) => p.id !== alert.primary_program_id)}
        defaultSelected={taggedProgramIds}
        label="Additional Tagged Programs"
        hint="Other programs this alert is relevant to. The primary program is set in the dropdown above."
      />

      <FormError error={error} />
      <FormActions submitLabel="Save Changes" submitting={submitting} cancelHref="/admin/alerts" />
    </form>
  )
}
