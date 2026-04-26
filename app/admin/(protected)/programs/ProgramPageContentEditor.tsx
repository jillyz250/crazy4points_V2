'use client'

import { useState, useTransition } from 'react'
import type { TransferPartnerRow, TierBenefitRow, Alliance } from '@/utils/supabase/queries'
import { ALLIANCE_OPTIONS } from '@/utils/supabase/queries'
import { updateProgramPageContentAction } from './actions'

const STALE_DAYS = 60

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function freshnessLabel(days: number | null): { text: string; stale: boolean } {
  if (days === null) return { text: 'Never', stale: true }
  if (days === 0) return { text: 'Today', stale: false }
  if (days === 1) return { text: '1 day ago', stale: false }
  return { text: `${days} days ago`, stale: days > STALE_DAYS }
}

const TRANSFER_PARTNERS_PLACEHOLDER = `[
  { "from_slug": "chase",  "ratio": "1:1", "notes": "Watch for 25-30% transfer bonuses", "bonus_active": false },
  { "from_slug": "amex",   "ratio": "1:1", "notes": null, "bonus_active": false },
  { "from_slug": "citi",   "ratio": "1:1", "notes": null, "bonus_active": false },
  { "from_slug": "bilt",   "ratio": "1:1", "notes": null, "bonus_active": false }
]`

function partnersToText(rows: TransferPartnerRow[] | null): string {
  if (!rows || rows.length === 0) return ''
  return JSON.stringify(rows, null, 2)
}

const TIER_BENEFITS_PLACEHOLDER = `[
  { "name": "Explorer",  "qualification": "Free signup",       "benefits": ["Earn miles", "Family pooling"] },
  { "name": "Silver",    "qualification": "100 XP per year",   "benefits": ["Lounge access on long-haul", "Priority check-in"] },
  { "name": "Gold",      "qualification": "180 XP per year",   "benefits": ["Lounge access most flights", "Extra baggage"] },
  { "name": "Platinum",  "qualification": "300 XP per year",   "benefits": ["Top-tier priority", "Free upgrades when available"] }
]`

function tiersToText(rows: TierBenefitRow[] | null): string {
  if (!rows || rows.length === 0) return ''
  return JSON.stringify(rows, null, 2)
}

function textToTiers(text: string): { rows: TierBenefitRow[] | null; error: string | null } {
  const trimmed = text.trim()
  if (!trimmed) return { rows: null, error: null }
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return { rows: null, error: 'Tier benefits: invalid JSON' }
  }
  if (!Array.isArray(parsed)) {
    return { rows: null, error: 'Tier benefits: must be a JSON array' }
  }
  const rows: TierBenefitRow[] = []
  for (const [i, raw] of parsed.entries()) {
    if (typeof raw !== 'object' || raw === null) {
      return { rows: null, error: `Tier benefits: row ${i} is not an object` }
    }
    const r = raw as Record<string, unknown>
    if (typeof r.name !== 'string' || !r.name) {
      return { rows: null, error: `Tier benefits: row ${i} missing string name` }
    }
    if (typeof r.qualification !== 'string') {
      return { rows: null, error: `Tier benefits: row ${i} missing string qualification (use empty string if free signup)` }
    }
    if (!Array.isArray(r.benefits) || !r.benefits.every((b) => typeof b === 'string')) {
      return { rows: null, error: `Tier benefits: row ${i} benefits must be an array of strings` }
    }
    rows.push({
      name: r.name,
      qualification: r.qualification,
      benefits: r.benefits as string[],
    })
  }
  return { rows, error: null }
}

function textToPartners(text: string): { rows: TransferPartnerRow[] | null; error: string | null } {
  const trimmed = text.trim()
  if (!trimmed) return { rows: null, error: null }
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return { rows: null, error: 'Transfer partners: invalid JSON' }
  }
  if (!Array.isArray(parsed)) {
    return { rows: null, error: 'Transfer partners: must be a JSON array' }
  }
  const rows: TransferPartnerRow[] = []
  for (const [i, raw] of parsed.entries()) {
    if (typeof raw !== 'object' || raw === null) {
      return { rows: null, error: `Transfer partners: row ${i} is not an object` }
    }
    const r = raw as Record<string, unknown>
    if (typeof r.from_slug !== 'string' || !r.from_slug) {
      return { rows: null, error: `Transfer partners: row ${i} missing string from_slug` }
    }
    if (typeof r.ratio !== 'string' || !r.ratio) {
      return { rows: null, error: `Transfer partners: row ${i} missing string ratio` }
    }
    rows.push({
      from_slug: r.from_slug,
      ratio: r.ratio,
      notes: typeof r.notes === 'string' ? r.notes : null,
      bonus_active: r.bonus_active === true,
    })
  }
  return { rows, error: null }
}

export default function ProgramPageContentEditor({
  programId,
  programName,
  programType,
  initialIntro,
  initialTransferPartners,
  initialSweetSpots,
  initialQuirks,
  initialHowToSpend,
  initialTierBenefits,
  initialLoungeAccess,
  initialAlliance,
  initialHubs,
  initialUpdatedAt,
  alwaysOpen = false,
}: {
  programId: string
  programName: string
  programType?: string | null
  initialIntro: string | null
  initialTransferPartners: TransferPartnerRow[] | null
  initialSweetSpots: string | null
  initialQuirks: string | null
  initialHowToSpend: string | null
  initialTierBenefits: TierBenefitRow[] | null
  initialLoungeAccess: string | null
  initialAlliance: Alliance | null
  initialHubs: string[] | null
  initialUpdatedAt: string | null
  /** When true, render the form inline (no toggle button). Used by the
      dedicated /admin/programs/[slug]/edit route. */
  alwaysOpen?: boolean
}) {
  const [open, setOpen] = useState(alwaysOpen)
  const [intro, setIntro] = useState(initialIntro ?? '')
  const [partnersText, setPartnersText] = useState(partnersToText(initialTransferPartners))
  const [sweetSpots, setSweetSpots] = useState(initialSweetSpots ?? '')
  const [quirks, setQuirks] = useState(initialQuirks ?? '')
  const [howToSpend, setHowToSpend] = useState(initialHowToSpend ?? '')
  const [tiersText, setTiersText] = useState(tiersToText(initialTierBenefits))
  const [loungeAccess, setLoungeAccess] = useState(initialLoungeAccess ?? '')
  const [alliance, setAlliance] = useState<Alliance | ''>(initialAlliance ?? '')
  const [hubsText, setHubsText] = useState((initialHubs ?? []).join(', '))
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fresh = freshnessLabel(daysSince(updatedAt))
  const hasContent =
    !!(initialIntro ?? '').trim() ||
    (initialTransferPartners?.length ?? 0) > 0 ||
    !!(initialSweetSpots ?? '').trim() ||
    !!(initialQuirks ?? '').trim() ||
    !!(initialHowToSpend ?? '').trim() ||
    (initialTierBenefits?.length ?? 0) > 0 ||
    !!(initialLoungeAccess ?? '').trim() ||
    !!initialAlliance ||
    (initialHubs?.length ?? 0) > 0

  function save() {
    setError(null)
    const partners = textToPartners(partnersText)
    if (partners.error) {
      setError(partners.error)
      return
    }
    const tiers = textToTiers(tiersText)
    if (tiers.error) {
      setError(tiers.error)
      return
    }
    const hubsArray = hubsText
      .split(',')
      .map((h) => h.trim().toUpperCase())
      .filter((h) => h.length > 0)
    const input = {
      intro: intro.trim() ? intro : null,
      transfer_partners: partners.rows,
      sweet_spots: sweetSpots.trim() ? sweetSpots : null,
      quirks: quirks.trim() ? quirks : null,
      how_to_spend: howToSpend.trim() ? howToSpend : null,
      tier_benefits: tiers.rows,
      lounge_access: loungeAccess.trim() ? loungeAccess : null,
      alliance: alliance ? (alliance as Alliance) : null,
      hubs: hubsArray.length > 0 ? hubsArray : null,
    }
    const anyContent =
      !!input.intro ||
      (input.transfer_partners?.length ?? 0) > 0 ||
      !!input.sweet_spots ||
      !!input.quirks ||
      !!input.how_to_spend ||
      (input.tier_benefits?.length ?? 0) > 0 ||
      !!input.lounge_access ||
      !!input.alliance ||
      (input.hubs?.length ?? 0) > 0
    startTransition(async () => {
      const res = await updateProgramPageContentAction(programId, input)
      if (res?.error) {
        setError(res.error)
        return
      }
      setUpdatedAt(anyContent ? new Date().toISOString() : null)
      setOpen(false)
    })
  }

  function cancel() {
    setIntro(initialIntro ?? '')
    setPartnersText(partnersToText(initialTransferPartners))
    setSweetSpots(initialSweetSpots ?? '')
    setQuirks(initialQuirks ?? '')
    setHowToSpend(initialHowToSpend ?? '')
    setTiersText(tiersToText(initialTierBenefits))
    setLoungeAccess(initialLoungeAccess ?? '')
    setAlliance(initialAlliance ?? '')
    setHubsText((initialHubs ?? []).join(', '))
    setError(null)
    setOpen(false)
  }

  if (!open && !alwaysOpen) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
        <span
          style={{
            padding: '0.125rem 0.5rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            background: fresh.stale ? 'var(--admin-warning-bg, #fef3c7)' : 'var(--admin-bg-subtle, #f3f4f6)',
            color: fresh.stale ? 'var(--admin-warning, #92400e)' : 'var(--admin-text-muted)',
            fontWeight: 500,
          }}
          title={hasContent ? `Page content last updated ${fresh.text}` : 'No public page content yet'}
        >
          {fresh.stale ? '⚠ ' : ''}{fresh.text}
        </span>
        <button
          type="button"
          className="admin-btn admin-btn-ghost admin-btn-sm"
          onClick={() => setOpen(true)}
        >
          {hasContent ? 'Edit' : 'Add'}
        </button>
      </div>
    )
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--admin-text-muted)',
    fontWeight: 500,
    marginBottom: '0.25rem',
    display: 'block',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', minWidth: '24rem' }}>
      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
        Public page content — {programName}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: programType === 'hotel' ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle}>Alliance</label>
          <select
            value={alliance}
            onChange={(e) => setAlliance(e.target.value as Alliance | '')}
            className="admin-input"
            style={{ fontSize: '0.8125rem' }}
          >
            <option value="">— not set —</option>
            {ALLIANCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {programType !== 'hotel' && (
          <div>
            <label style={labelStyle}>Hubs (comma-separated airport codes)</label>
            <input
              type="text"
              value={hubsText}
              onChange={(e) => setHubsText(e.target.value)}
              placeholder="CDG, AMS"
              className="admin-input"
              style={{ fontSize: '0.8125rem' }}
            />
          </div>
        )}
      </div>

      <div>
        <label style={labelStyle}>Intro (1–2 voicey paragraphs)</label>
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          rows={4}
          placeholder="Why does this program matter? Who's it for? What's the personality?"
          className="admin-input"
          style={{ fontSize: '0.8125rem' }}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Transfer partners (JSON array — see placeholder for shape)
        </label>
        <textarea
          value={partnersText}
          onChange={(e) => setPartnersText(e.target.value)}
          rows={8}
          placeholder={TRANSFER_PARTNERS_PLACEHOLDER}
          className="admin-input"
          style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: '0.75rem' }}
        />
      </div>

      <div>
        <label style={labelStyle}>How to spend miles (markdown — redemption types)</label>
        <textarea
          value={howToSpend}
          onChange={(e) => setHowToSpend(e.target.value)}
          rows={5}
          placeholder="- Award flights on AF/KLM/Transavia and SkyTeam partners
- Seat upgrades from paid tickets
- Hotels and car rentals (poor value)
- Lounge access at Paris CDG and Amsterdam"
          className="admin-input"
          style={{ fontSize: '0.8125rem' }}
        />
      </div>

      <div>
        <label style={labelStyle}>Sweet spots (markdown — examples with mile cost)</label>
        <textarea
          value={sweetSpots}
          onChange={(e) => setSweetSpots(e.target.value)}
          rows={6}
          placeholder="- 50k each way to Tokyo in J on partner X
- 30k roundtrip US-Caribbean in Y on partner Z"
          className="admin-input"
          style={{ fontSize: '0.8125rem' }}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Tier benefits (JSON array — see placeholder for shape)
        </label>
        <textarea
          value={tiersText}
          onChange={(e) => setTiersText(e.target.value)}
          rows={10}
          placeholder={TIER_BENEFITS_PLACEHOLDER}
          className="admin-input"
          style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: '0.75rem' }}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Lounge access (markdown — own lounges, alliance access, eligibility, paid options)
        </label>
        <textarea
          value={loungeAccess}
          onChange={(e) => setLoungeAccess(e.target.value)}
          rows={7}
          placeholder="### Own-brand lounges
- Carrier operates X lounges across N airports — flagship at HUB

### Alliance / partner access
- SkyTeam Elite Plus members get worldwide SkyTeam lounge access on long-haul international flights

### Who gets in
- International business or first class ticket
- Top status tiers (Gold, Platinum, Ultimate)
- Paid day pass: $X (where applicable)

### Notable flagships
- La Première Lounge at CDG — invitation-only, private chefs, spa, direct-to-gate transfer"
          className="admin-input"
          style={{ fontSize: '0.8125rem' }}
        />
      </div>

      <div>
        <label style={labelStyle}>Tips & quirks (markdown — expiry, pooling, stopovers, etc.)</label>
        <textarea
          value={quirks}
          onChange={(e) => setQuirks(e.target.value)}
          rows={5}
          placeholder="- Miles expire after 24 months of inactivity
- Family pooling allowed up to 8 members"
          className="admin-input"
          style={{ fontSize: '0.8125rem' }}
        />
      </div>

      {error && (
        <div style={{ color: 'var(--admin-danger)', fontSize: '0.8125rem' }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="admin-btn admin-btn-primary admin-btn-sm"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={isPending}
          className="admin-btn admin-btn-ghost admin-btn-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
