'use client'

import { useMemo, useState, useTransition } from 'react'
import type { HotelProperty } from '@/utils/supabase/queries'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import {
  importPropertiesCsvAction,
  deletePropertyAction,
} from './actions'

const CSV_TEMPLATE = `name,brand,city,country,region,category,off_peak_points,standard_points,peak_points,hotel_url,all_inclusive,notes,last_verified
Park Hyatt Tokyo,Park Hyatt,Tokyo,Japan,asia_pacific,7,25000,30000,40000,https://www.hyatt.com/park-hyatt/tyoph,false,Aspirational flagship,2026-04-26
Hyatt Place Austin Downtown,Hyatt Place,Austin,USA,americas,2,6500,9000,12000,,false,,2026-04-26`

export default function PropertiesAdmin({
  programId,
  programSlug,
  initialProperties,
}: {
  programId: string
  programSlug: string
  initialProperties: HotelProperty[]
}) {
  const [csvText, setCsvText] = useState('')
  const [importResult, setImportResult] = useState<{
    inserted: number
    updated: number
    skipped: number
    errors: string[]
  } | null>(null)
  const [importPending, startImport] = useTransition()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return initialProperties
    return initialProperties.filter((p) => {
      const hay = [p.name, p.brand, p.city, p.country, p.region, p.category, p.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [initialProperties, search])

  function onImport() {
    setImportResult(null)
    startImport(async () => {
      const res = await importPropertiesCsvAction(programId, programSlug, csvText)
      setImportResult(res)
      if (res.inserted + res.updated > 0) setCsvText('')
    })
  }

  function onLoadTemplate() {
    setCsvText(CSV_TEMPLATE)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Card>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                Bulk import — paste CSV
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
                Header row required. Existing properties (matched by name, case-insensitive) are updated; new ones are inserted.
              </p>
            </div>
            <button
              type="button"
              onClick={onLoadTemplate}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              Load template
            </button>
          </div>

          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={10}
            placeholder="Paste CSV with columns: name,brand,city,country,region,category,off_peak_points,standard_points,peak_points,hotel_url,all_inclusive,notes,last_verified"
            className="admin-input"
            style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: '0.75rem' }}
          />

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onImport}
              disabled={importPending || !csvText.trim()}
              className="admin-btn admin-btn-primary admin-btn-sm"
            >
              {importPending ? 'Importing…' : 'Import'}
            </button>
            {importResult && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
                <strong>{importResult.inserted}</strong> inserted, <strong>{importResult.updated}</strong> updated
                {importResult.skipped > 0 ? `, ${importResult.skipped} skipped` : null}
              </span>
            )}
          </div>

          {importResult && importResult.errors.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--admin-danger, #b91c1c)' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Errors:</div>
              <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                {importResult.errors.slice(0, 10).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {importResult.errors.length > 10 && (
                  <li>…and {importResult.errors.length - 10} more</li>
                )}
              </ul>
            </div>
          )}

          <details style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 500 }}>Column reference</summary>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1rem', lineHeight: 1.6 }}>
              <li><code>name</code> (required) — must be unique within this program</li>
              <li><code>brand</code> — Park Hyatt, Andaz, Hyatt Place, etc.</li>
              <li><code>city</code>, <code>country</code></li>
              <li><code>region</code> — americas, europe, asia_pacific, middle_east_africa (aliases accepted: mea, apac, caribbean, etc.)</li>
              <li><code>category</code> — &quot;1&quot;-&quot;8&quot; for Hyatt; flexible for other programs</li>
              <li><code>off_peak_points</code>, <code>standard_points</code>, <code>peak_points</code> — integers, blank for null</li>
              <li><code>hotel_url</code></li>
              <li><code>all_inclusive</code> — true / false (defaults false)</li>
              <li><code>notes</code> — flagship, M&amp;MS, brand-explorer eligible, etc.</li>
              <li><code>last_verified</code> — YYYY-MM-DD; defaults to today</li>
            </ul>
          </details>
        </div>
      </Card>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties by name, brand, city, region, category…"
            className="admin-input"
            style={{ flex: '1 1 18rem', minWidth: '14rem', fontSize: '0.875rem' }}
            aria-label="Search properties"
          />
          <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8125rem' }}>
            {filtered.length} of {initialProperties.length}
          </span>
        </div>

        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>City</th>
                  <th>Region</th>
                  <th style={{ textAlign: 'center' }}>Cat</th>
                  <th style={{ textAlign: 'right' }}>Off-peak</th>
                  <th style={{ textAlign: 'right' }}>Standard</th>
                  <th style={{ textAlign: 'right' }}>Peak</th>
                  <th>AI</th>
                  <th>Verified</th>
                  <th style={{ width: '2rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <PropertyRow key={p.id} property={p} programSlug={programSlug} />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--admin-text-muted)' }}>
                      {initialProperties.length === 0
                        ? 'No properties yet. Import a CSV above to get started.'
                        : `No properties match "${search}".`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

function PropertyRow({ property: p, programSlug }: { property: HotelProperty; programSlug: string }) {
  const [pending, startTransition] = useTransition()

  function onDelete() {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deletePropertyAction(p.id, programSlug)
    })
  }

  return (
    <tr style={pending ? { opacity: 0.4 } : undefined}>
      <td style={{ fontWeight: 500 }}>
        {p.hotel_url ? (
          <a href={p.hotel_url} target="_blank" rel="noopener noreferrer">{p.name}</a>
        ) : (
          p.name
        )}
        {p.notes && (
          <div style={{ fontSize: '0.6875rem', color: 'var(--admin-text-muted)', marginTop: '0.125rem' }}>
            {p.notes}
          </div>
        )}
      </td>
      <td style={{ color: 'var(--admin-text-muted)' }}>{p.brand ?? '—'}</td>
      <td style={{ color: 'var(--admin-text-muted)' }}>
        {p.city ?? '—'}{p.country ? `, ${p.country}` : ''}
      </td>
      <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.75rem' }}>
        {p.region ? p.region.replace(/_/g, ' ') : '—'}
      </td>
      <td style={{ textAlign: 'center' }}>
        {p.category ? <Badge tone="accent">{p.category}</Badge> : '—'}
      </td>
      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.off_peak_points?.toLocaleString() ?? '—'}</td>
      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.standard_points?.toLocaleString() ?? '—'}</td>
      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.peak_points?.toLocaleString() ?? '—'}</td>
      <td>{p.all_inclusive ? <Badge tone="success">AI</Badge> : null}</td>
      <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.75rem' }}>
        {p.last_verified ?? '—'}
      </td>
      <td style={{ textAlign: 'right' }}>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="admin-btn admin-btn-ghost admin-btn-sm"
          style={{ color: 'var(--admin-danger, #b91c1c)' }}
          title="Delete property"
          aria-label={`Delete ${p.name}`}
        >
          ×
        </button>
      </td>
    </tr>
  )
}
