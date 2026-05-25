'use client'

import { useState, useTransition } from 'react'
import { updateIssuerAction } from '../actions'
import { Card } from '@/components/admin/ui/Card'

type Initial = {
  name: string
  intro: string
  website_url: string
  logo_url: string
  notes: string
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--admin-text)',
  marginBottom: '0.375rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--admin-border)',
  borderRadius: '0.375rem',
  fontSize: '1rem',
  fontFamily: 'inherit',
  background: 'var(--admin-bg)',
}
const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '8rem',
  resize: 'vertical' as const,
  lineHeight: 1.5,
}

export default function IssuerEditorForm({ slug, initial }: { slug: string; initial: Initial }) {
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(initial.name)
  const [intro, setIntro] = useState(initial.intro)
  const [websiteUrl, setWebsiteUrl] = useState(initial.website_url)
  const [logoUrl, setLogoUrl] = useState(initial.logo_url)
  const [notes, setNotes] = useState(initial.notes)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  function handleSave() {
    setMessage(null)
    startTransition(async () => {
      const result = await updateIssuerAction(slug, {
        name,
        intro: intro || null,
        website_url: websiteUrl || null,
        logo_url: logoUrl || null,
        notes: notes || null,
      })
      if (result.error) setMessage({ kind: 'error', text: result.error })
      else setMessage({ kind: 'ok', text: 'Saved.' })
    })
  }

  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem' }}>
        <div>
          <label style={labelStyle} htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="intro">Intro</label>
          <textarea
            id="intro"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            style={textareaStyle}
            placeholder="1-2 voicey paragraphs about the issuer — brand position, ecosystem, who it's for. Same tone as program intros."
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="website_url">Website URL</label>
          <input
            id="website_url"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            style={inputStyle}
            placeholder="https://www.americanexpress.com"
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="logo_url">Logo URL (optional)</label>
          <input
            id="logo_url"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            style={inputStyle}
            placeholder="https://..."
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="notes">Notes (admin-only)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={textareaStyle}
            placeholder="Editor notes — disagreements with sources, things to revisit, etc."
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="admin-btn admin-btn-primary"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
          {message && (
            <span
              style={{
                fontSize: '0.875rem',
                color: message.kind === 'ok' ? 'var(--admin-success, #047857)' : 'var(--admin-danger, #b91c1c)',
              }}
            >
              {message.text}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
