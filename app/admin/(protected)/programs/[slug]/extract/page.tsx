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
      extraction_source_url, field_source_urls,
      content_updated_at, last_verified
    `)
    .eq('slug', slug)
    .single()

  if (error || !program) notFound()

  // Latest extraction
  const { data: latest } = await supabase
    .from('program_extractions')
    .select('id, source_url, extraction, status, created_at, completed_at, applied_fields, merged_fields, used_interactive, raw_markdown, markdown_chars, review_pass_added_count, error_message')
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
  const mergedFields = ((latest?.merged_fields as Record<string, { value: string; generated_at: string }> | null) ?? {})

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
                  applyAction={applyExtractedField}
                  skipAction={skipExtractedField}
                  mergeAction={mergeProgramField}
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
