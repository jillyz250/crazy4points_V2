import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import RunExtractionButton from '@/components/admin/cards/RunExtractionButton'
import ProgramFieldDiff from '@/components/admin/programs/ProgramFieldDiff'
import ExtractionCopyButtons from '@/components/admin/programs/ExtractionCopyButtons'
import {
  runProgramExtraction,
  applyExtractedField,
  skipExtractedField,
  completeExtraction,
  mergeProgramField,
  verifyProgramField,
  discoverProgramSourceUrls,
  applyDiscoveredUrls,
} from './actions'

export const dynamic = 'force-dynamic'

/**
 * Per-field approval admin page for program extraction.
 *
 * Editor:
 *   1. Pastes source URL + clicks Run extraction
 *   2. Reviews each field's diff (current vs extracted)
 *   3. Per field: Apply / Skip
 *   4. Clicks Mark complete when done
 *
 * Never overwrites programs.* without explicit Apply per field.
 */
export default async function ProgramExtractPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createAdminClient()

  // Fetch the program row — every editable field we extract
  const { data: program, error } = await supabase
    .from('programs')
    .select(`
      id, slug, name, type,
      intro, sweet_spots, lounge_access, quirks, award_chart,
      tier_benefits, alliance, hubs, parent_program_slug,
      extraction_source_url, field_source_urls, suggested_field_urls,
      content_updated_at, last_verified
    `)
    .eq('slug', slug)
    .single()

  if (error || !program) notFound()

  // Latest extraction
  const { data: latest } = await supabase
    .from('program_extractions')
    .select('id, source_url, extraction, status, created_at, completed_at, applied_fields, merged_fields, verifications, used_interactive, raw_markdown, markdown_chars, review_pass_added_count, error_message')
    .eq('program_id', program.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Past extractions
  const { data: history } = await supabase
    .from('program_extractions')
    .select('id, status, created_at, completed_at, used_interactive, input_tokens, output_tokens')
    .eq('program_id', program.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const defaultSourceUrl = program.extraction_source_url ?? ''
  const storedFieldUrls = ((program.field_source_urls as Record<string, string | null> | null) ?? {})

  // Field metadata for the per-field URL inputs.
  // recommended=true means we suggest extraction; default URL hint shows
  // where this field typically lives.
  type FieldConfig = {
    key: string
    label: string
    hint: string
    recommended: boolean  // false for editorial fields (intro, sweet_spots)
  }
  const FIELD_CONFIGS: FieldConfig[] = [
    { key: 'intro', label: 'Intro', hint: 'Editorial — usually keep manual. Add URL only if you want a fresh extract.', recommended: false },
    { key: 'sweet_spots', label: 'Sweet spots', hint: 'Curated picks — usually keep manual.', recommended: false },
    { key: 'tier_benefits', label: 'Tier benefits', hint: 'Status tier table (Emerald/Sapphire/Ruby; Silver/Gold/Platinum).', recommended: true },
    { key: 'lounge_access', label: 'Lounge access', hint: 'Lounge access page — alliance rules, fees, exclusions.', recommended: true },
    { key: 'quirks', label: 'Quirks', hint: 'Fine print — RTW rules, surcharges, stopovers.', recommended: true },
    { key: 'award_chart', label: 'Award chart', hint: 'Award chart page with point amounts per region/cabin.', recommended: true },
    { key: 'alliance', label: 'Alliance', hint: 'About page or any page that names the alliance.', recommended: true },
    { key: 'hubs', label: 'Hubs', hint: 'About page or route map listing hub airports.', recommended: true },
    { key: 'parent_program_slug', label: 'Parent program', hint: 'Only for sub-programs (e.g., KLM under Flying Blue).', recommended: false },
  ]
  const extraction = (latest?.extraction as Record<string, unknown> | undefined) ?? null
  const appliedFields = ((latest?.applied_fields as Record<string, string> | null) ?? {})
  const mergedFields = ((latest?.merged_fields as Record<string, { value: string; generated_at: string; source?: string }> | null) ?? {})
  type VerificationRow = {
    verdict: 'confirmed' | 'corrected' | 'unverifiable'
    discrepancies: Array<{ claim: string; current_says: string; extracted_says: string; source_says: string; resolution: string }>
    corrected_value: string
    notes: string
    generated_at: string
  }
  const verifications = ((latest?.verifications as Record<string, VerificationRow> | null) ?? {})

  // The fields we extract, in display order
  const FIELDS: { key: 'intro' | 'sweet_spots' | 'lounge_access' | 'quirks' | 'award_chart' | 'tier_benefits' | 'alliance' | 'hubs' | 'parent_program_slug'; label: string; description: string }[] = [
    { key: 'intro', label: 'Intro', description: 'Short editorial paragraph (1-3 sentences, brand voice).' },
    { key: 'sweet_spots', label: 'Sweet spots', description: 'Best redemption picks with point amounts.' },
    { key: 'lounge_access', label: 'Lounge access', description: 'Who can access which lounges, fees, conditions.' },
    { key: 'tier_benefits', label: 'Tier benefits', description: 'Status tier table with qualification + benefits.' },
    { key: 'quirks', label: 'Quirks', description: 'Fine print, surcharges, stopover rules, gotchas.' },
    { key: 'award_chart', label: 'Award chart', description: 'Verified prose with redemption costs per region/cabin.' },
    { key: 'alliance', label: 'Alliance', description: 'Global alliance membership (oneworld / SkyTeam / Star Alliance).' },
    { key: 'hubs', label: 'Hubs', description: 'Primary hub airport IATA codes.' },
    { key: 'parent_program_slug', label: 'Parent program', description: 'Slug of the parent loyalty program (most are null).' },
  ]

  return (
    <div className="rg-container px-6 py-10">
      <header className="mb-6">
        <p className="font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
          {program.type} · /programs/{program.slug}
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)]">
          {program.name}
        </h1>
        <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">
          {program.content_updated_at ? `Last updated ${new Date(program.content_updated_at).toLocaleDateString()}` : 'Never updated'}
          {' · '}
          <a className="text-[var(--color-primary)] underline" href={`/programs/${program.slug}`} target="_blank" rel="noreferrer">
            view public page →
          </a>
        </p>
        {(() => {
          // Show all unique URLs across configured fields (multi-URL aware).
          const allUrls = new Set<string>()
          for (const val of Object.values(storedFieldUrls)) {
            if (Array.isArray(val)) val.forEach((u) => u && allUrls.add(u))
            else if (typeof val === 'string' && val) allUrls.add(val)
          }
          if (program.extraction_source_url) allUrls.add(program.extraction_source_url)
          if (allUrls.size === 0) {
            return (
              <p className="mt-1 font-body text-xs text-amber-700">
                No URLs configured yet. Set per-field URLs below — they pre-fill on every future extraction.
              </p>
            )
          }
          return (
            <details className="mt-1">
              <summary className="cursor-pointer font-body text-xs text-[var(--color-text-secondary)]">
                <span className="font-ui uppercase tracking-wide">Configured URLs ({allUrls.size}):</span>{' '}
                click to expand
              </summary>
              <ul className="mt-1 ml-4 list-disc font-body text-xs text-[var(--color-text-secondary)]">
                {Array.from(allUrls).map((u) => (
                  <li key={u}>
                    <a className="text-[var(--color-primary)] underline" href={u} target="_blank" rel="noreferrer">{u}</a>
                  </li>
                ))}
              </ul>
            </details>
          )
        })()}
      </header>

      {/* 🔍 Discover source URLs — Sonnet recommends URLs per field */}
      <section className="mb-8 rounded-[var(--radius-card)] border border-amber-200 bg-amber-50/40 p-5">
        <h2 className="font-display text-lg font-semibold text-amber-900">
          🔍 Don&apos;t know the URLs? Discover them.
        </h2>
        <p className="mt-1 font-body text-sm text-amber-900">
          Paste the program&apos;s main marketing site (e.g. <code>https://www.united.com</code>) and Sonnet will map the site,
          identify candidate pages, and recommend a URL for each extraction field. Review the suggestions,
          then click Apply to populate the per-field textareas below.
        </p>

        <form action={discoverProgramSourceUrls} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="slug" value={program.slug} />
          <label className="flex flex-1 flex-col gap-1 min-w-[20rem]">
            <span className="font-ui text-[11px] uppercase tracking-wide text-amber-900">Starting URL</span>
            <input
              type="url"
              name="starting_url"
              defaultValue={(program.suggested_field_urls as { starting_url?: string } | null)?.starting_url ?? ''}
              placeholder="https://www.united.com"
              className="rounded-[var(--radius-ui)] border border-amber-300 bg-white px-3 py-1.5 font-mono text-sm"
              style={{ fontSize: '0.875rem' }}
            />
          </label>
          <button type="submit" className="rg-btn-primary" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
            🔍 Discover URLs
          </button>
        </form>

        {(() => {
          const suggRaw = program.suggested_field_urls as Record<string, unknown> | null
          if (!suggRaw || !suggRaw.generated_at) return null
          type FieldSug = { urls?: string[]; reason?: string; confidence?: string }
          const metaKeys = new Set(['generated_at', 'starting_url', 'total_urls_seen', 'candidates_sent'])
          const populated: Array<[string, FieldSug]> = []
          for (const [k, v] of Object.entries(suggRaw)) {
            if (metaKeys.has(k)) continue
            if (v && typeof v === 'object' && !Array.isArray(v)) {
              const fs = v as FieldSug
              if (Array.isArray(fs.urls) && fs.urls.length > 0) populated.push([k, fs])
            }
          }
          const totalUrlsSeen = typeof suggRaw.total_urls_seen === 'number' ? suggRaw.total_urls_seen : null
          const candidatesSent = typeof suggRaw.candidates_sent === 'number' ? suggRaw.candidates_sent : null
          const generatedAt = typeof suggRaw.generated_at === 'string' ? suggRaw.generated_at : null
          return (
            <div className="mt-4 rounded-[var(--radius-ui)] border border-amber-300 bg-white p-3">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="font-ui text-xs font-bold uppercase tracking-wide text-amber-900">
                  Suggestions — {populated.length} field{populated.length === 1 ? '' : 's'} matched
                </p>
                <p className="font-ui text-[10px] text-amber-700">
                  Mapped {totalUrlsSeen ?? '?'} URLs · sent {candidatesSent ?? '?'} to Sonnet ·{' '}
                  {generatedAt ? new Date(generatedAt).toLocaleString() : ''}
                </p>
              </div>
              {populated.length === 0 ? (
                <p className="font-body text-xs text-amber-900">
                  No fields matched. Try a more specific starting URL (e.g. the loyalty program&apos;s landing page).
                </p>
              ) : (
                <>
                  <table className="w-full font-body text-xs">
                    <thead className="border-b border-amber-200 font-ui text-[10px] uppercase tracking-wide text-amber-900">
                      <tr>
                        <th className="py-1 pr-2 text-left">Field</th>
                        <th className="py-1 pr-2 text-left">Suggested URL(s)</th>
                        <th className="py-1 pr-2 text-left">Reason</th>
                        <th className="py-1 pr-2 text-left">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {populated.map(([field, s]) => (
                        <tr key={field} className="border-b border-amber-100 align-top">
                          <td className="py-1 pr-2 font-semibold">{field}</td>
                          <td className="py-1 pr-2">
                            {(s.urls ?? []).map((u: string, i: number) => (
                              <div key={i}>
                                <a className="text-amber-900 underline" href={u} target="_blank" rel="noreferrer">{u}</a>
                              </div>
                            ))}
                          </td>
                          <td className="py-1 pr-2 text-amber-900">{s.reason}</td>
                          <td className="py-1 pr-2 uppercase">{s.confidence}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <form action={applyDiscoveredUrls} className="mt-3">
                    <input type="hidden" name="slug" value={program.slug} />
                    <button type="submit" className="rg-btn-primary" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
                      ⬇ Apply suggestions to field URLs below
                    </button>
                    <span className="ml-2 font-body text-[11px] text-amber-700">
                      Overwrites the per-field textareas — review them after.
                    </span>
                  </form>
                </>
              )}
            </div>
          )
        })()}
      </section>

      {/* Run extraction form */}
      <section className="mb-8 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-5">
        <h2 className="font-display text-xl font-semibold text-[var(--color-primary)]">
          Run extraction
        </h2>
        <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">
          Paste the program's official page URL. Pass 1 + review pass run automatically.
          Nothing is saved to the live program row until you Apply per field below.
        </p>

        <form action={runProgramExtraction} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="slug" value={program.slug} />

          <p className="font-body text-sm text-[var(--color-text-secondary)]">
            Assign a URL to each field you want extracted. Leave a field blank to skip extraction
            and keep the current manually-authored value. Each unique URL is scraped once and
            extracted with a focused Sonnet call for its mapped fields only.
          </p>

          <p className="font-body text-xs text-[var(--color-text-secondary)]">
            <strong>Multi-URL per field:</strong> add multiple URLs (one per line) to combine content
            from several pages for a single field. Useful for quirks (RTW + about page) and other
            fields where the source spans multiple pages.
          </p>

          <div className="grid gap-3">
            {FIELD_CONFIGS.map((f) => {
              // storedFieldUrls value may be string OR string[] — normalize to one-per-line
              const stored = storedFieldUrls[f.key as keyof typeof storedFieldUrls]
              let storedAsText = ''
              if (Array.isArray(stored)) {
                storedAsText = stored.join('\n')
              } else if (typeof stored === 'string') {
                storedAsText = stored
              }
              return (
                <label key={f.key} className="grid grid-cols-1 gap-1 sm:grid-cols-[10rem_1fr] sm:items-start">
                  <span className="font-ui text-xs sm:pt-2">
                    <strong className="text-[var(--color-text-primary)]">{f.label}</strong>
                    {!f.recommended ? (
                      <span className="ml-1 font-normal italic text-[var(--color-text-secondary)]">(editorial)</span>
                    ) : null}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <textarea
                      name={`field_url_${f.key}`}
                      rows={2}
                      defaultValue={storedAsText}
                      placeholder={f.recommended ? 'Source URL(s) for this field — one per line' : '(leave blank to keep manual)'}
                      className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-3 py-1.5 font-mono text-sm"
                      style={{ fontSize: '0.875rem', resize: 'vertical' }}
                    />
                    <span className="font-body text-[11px] text-[var(--color-text-secondary)]">{f.hint}</span>
                  </div>
                </label>
              )
            })}
          </div>

          {/* Legacy single-URL fallback (only used if no per-field URLs configured) */}
          <details className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] p-2">
            <summary className="cursor-pointer font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
              Legacy single-URL fallback (advanced)
            </summary>
            <div className="mt-2">
              <input
                name="source_url"
                type="url"
                defaultValue={defaultSourceUrl}
                placeholder="One URL to extract everything from (used only if no per-field URLs above)"
                className="w-full rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-3 py-1.5 font-mono text-sm"
                style={{ fontSize: '0.875rem' }}
              />
              <p className="mt-1 font-body text-[11px] text-[var(--color-text-secondary)]">
                Used only when no per-field URLs are set. Backward-compat with the original
                single-URL pipeline.
              </p>
            </div>
          </details>

          <label className="inline-flex items-center gap-2 font-body text-sm text-[var(--color-text-secondary)]">
            <input type="checkbox" name="interactive" value="on" className="h-4 w-4 rounded border-[var(--color-border-soft)]" />
            <span>
              <strong className="text-[var(--color-text-primary)]">Interactive mode</strong> — expand accordions. Adds ~5 sec per URL.
            </span>
          </label>

          <div>
            <RunExtractionButton />
          </div>
        </form>
      </section>

      {/* Latest extraction error */}
      {latest && latest.status === 'failed' ? (
        <div className="mb-4 rounded-[var(--radius-ui)] border border-red-300 bg-red-50 p-3">
          <p className="font-ui text-xs uppercase tracking-wide text-red-800">Extraction failed</p>
          <p className="mt-1 font-body text-sm text-red-900">{latest.error_message}</p>
        </div>
      ) : null}

      {/* Per-field diff review */}
      {latest && extraction && latest.status !== 'failed' ? (
        <section className="mb-6">
          <header className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold text-[var(--color-primary)]">
              Field-by-field review
            </h2>
            <p className="font-body text-xs text-[var(--color-text-secondary)]">
              Extraction: {new Date(latest.created_at).toLocaleString()} · {latest.markdown_chars?.toLocaleString() ?? 0} chars
              {latest.review_pass_added_count > 0 ? ` · review pass added ${latest.review_pass_added_count}` : ''}
            </p>
          </header>

          {/* Workflow callout — simpler flow now that auto-verify ships */}
          <div className="mb-4 rounded-[var(--radius-card)] border border-[var(--color-primary)] bg-[var(--color-background-soft)] p-4">
            <p className="font-ui text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
              How to review an extraction (3 steps per field)
            </p>
            <ol className="mt-2 ml-4 list-decimal space-y-1 font-body text-sm text-[var(--color-text-primary)]">
              <li>
                <strong>🔍 Verify &amp; merge with source</strong> — Sonnet reads the scraped page, reconciles every disputed fact, and produces a final version that keeps the current voice with verified facts swapped in. Returns a discrepancy log so you can see exactly what changed and why.
              </li>
              <li>
                <strong>Apply verified [field]</strong> — writes the verified text to the live program page. The prior value is snapshotted to <code>program_field_history</code> first; any field can be rolled back later.
              </li>
              <li>
                <strong>Skip</strong> — if the field doesn&apos;t need updating, mark it reviewed and move on.
              </li>
            </ol>
            <p className="mt-2 font-body text-xs text-[var(--color-text-secondary)]">
              When every field is Applied or Skipped, click <strong>Mark review complete</strong> at the bottom.
              Structured fields (tier_benefits, hubs, alliance) use Apply / Skip directly (no Verify — they&apos;re JSON shape, not narrative text).
              The <strong>📋 Copy review prompt</strong> button is now a manual fallback for cases where you want Claude&apos;s eye on the whole extraction at once instead of per-field auto-verify.
            </p>
          </div>

          <ExtractionCopyButtons
            programName={program.name}
            programType={program.type}
            programSlug={program.slug}
            currentValues={{
              intro: program.intro,
              sweet_spots: program.sweet_spots,
              lounge_access: program.lounge_access,
              tier_benefits: program.tier_benefits,
              quirks: program.quirks,
              award_chart: program.award_chart,
              alliance: program.alliance,
              hubs: program.hubs,
              parent_program_slug: program.parent_program_slug,
            }}
            extraction={extraction as Record<string, unknown>}
            appliedFields={appliedFields}
            mergedFields={mergedFields}
            fieldSourceUrls={storedFieldUrls as Record<string, string | string[] | null>}
          />

          <div className="space-y-4">
            {FIELDS.map((f) => {
              const currentValue = (program as unknown as Record<string, unknown>)[f.key]
              const extractedField = (extraction as Record<string, unknown>)[f.key]
              return (
                <ProgramFieldDiff
                  key={f.key}
                  field={f.key}
                  label={f.label}
                  description={f.description}
                  programSlug={program.slug}
                  extractionId={latest.id}
                  currentValue={currentValue}
                  extractedField={extractedField}
                  appliedStatus={appliedFields[f.key] ?? null}
                  mergedValue={mergedFields[f.key]?.value ?? null}
                  mergedSource={mergedFields[f.key]?.source ?? null}
                  verification={verifications[f.key] ?? null}
                  applyAction={applyExtractedField}
                  skipAction={skipExtractedField}
                  mergeAction={mergeProgramField}
                  verifyAction={verifyProgramField}
                />
              )
            })}
          </div>

          {/* Mark complete */}
          {latest.status === 'extracted' ? (
            <form action={completeExtraction} className="mt-6">
              <input type="hidden" name="slug" value={program.slug} />
              <input type="hidden" name="extraction_id" value={latest.id} />
              <button type="submit" className="rg-btn-secondary text-xs">
                Mark review complete
              </button>
            </form>
          ) : (
            <p className="mt-6 font-body text-sm text-emerald-700">
              ✓ Review marked complete on {new Date(latest.completed_at ?? '').toLocaleString()}
            </p>
          )}

          {/* Raw markdown viewer */}
          {latest.raw_markdown ? (
            <details className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-white p-4">
              <summary className="cursor-pointer font-ui text-sm font-medium text-[var(--color-primary)]">
                View raw scraped markdown ({latest.markdown_chars?.toLocaleString() ?? '?'} chars)
              </summary>
              <pre className="mt-3 max-h-[600px] overflow-auto whitespace-pre-wrap rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-3 font-mono text-xs text-[var(--color-text-primary)]">
                {latest.raw_markdown}
              </pre>
            </details>
          ) : null}
        </section>
      ) : null}

      {/* History */}
      {history && history.length > 1 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-[var(--color-primary)]">
            Extraction history
          </h2>
          <div className="mt-3 overflow-x-auto rg-table-scroll">
            <table className="w-full text-left font-body text-sm">
              <thead className="border-b border-[var(--color-border-soft)] font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                <tr>
                  <th className="py-2 pr-3">When</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Tokens (in/out)</th>
                  <th className="py-2 pr-3">Interactive</th>
                </tr>
              </thead>
              <tbody>
                {history.map((e) => (
                  <tr key={e.id} className="border-b border-[var(--color-border-soft)]">
                    <td className="py-2 pr-3">{new Date(e.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-3">{e.status}</td>
                    <td className="py-2 pr-3">{e.input_tokens ?? '—'} / {e.output_tokens ?? '—'}</td>
                    <td className="py-2 pr-3">{e.used_interactive ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
