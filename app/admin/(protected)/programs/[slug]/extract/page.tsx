import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import RunExtractionButton from '@/components/admin/cards/RunExtractionButton'
import ProgramFieldDiff from '@/components/admin/programs/ProgramFieldDiff'
import {
  runProgramExtraction,
  applyExtractedField,
  skipExtractedField,
  completeExtraction,
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
      extraction_source_url, additional_source_urls,
      content_updated_at, last_verified
    `)
    .eq('slug', slug)
    .single()

  if (error || !program) notFound()

  // Latest extraction
  const { data: latest } = await supabase
    .from('program_extractions')
    .select('id, source_url, extraction, status, created_at, completed_at, applied_fields, used_interactive, raw_markdown, markdown_chars, review_pass_added_count, error_message')
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
  const defaultAdditionalUrls = ((program.additional_source_urls as string[] | null) ?? []).join('\n')
  const extraction = (latest?.extraction as Record<string, unknown> | undefined) ?? null
  const appliedFields = ((latest?.applied_fields as Record<string, string> | null) ?? {})

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
        {program.extraction_source_url ? (
          <p className="mt-1 font-body text-xs text-[var(--color-text-secondary)]">
            <span className="font-ui uppercase tracking-wide">Stored source URL:</span>{' '}
            <a className="text-[var(--color-primary)] underline" href={program.extraction_source_url} target="_blank" rel="noreferrer">
              {program.extraction_source_url}
            </a>
          </p>
        ) : (
          <p className="mt-1 font-body text-xs text-amber-700">
            No source URL stored yet. Paste below — it pre-fills on every future extraction.
          </p>
        )}
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

        <form action={runProgramExtraction} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="slug" value={program.slug} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="block font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                Source URL
              </span>
              <input
                name="source_url"
                type="url"
                required
                defaultValue={defaultSourceUrl}
                placeholder="https://www.united.com/en/us/fly/mileageplus.html"
                className="mt-1 w-full rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-3 py-2 font-body text-base"
                style={{ fontSize: '1rem' }}
              />
            </label>
            <RunExtractionButton />
          </div>
          <label className="flex flex-col">
            <span className="block font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
              Additional URLs (optional, one per line)
            </span>
            <span className="mt-0.5 block font-body text-xs text-[var(--color-text-secondary)]">
              Supplemental pages scraped alongside the primary URL and merged into one extraction.
              Useful for alliances: e.g., add /airport-lounges, /round-the-world, /about pages.
              Each adds ~$0.001 in Firecrawl + ~$0.06 in Sonnet input tokens.
            </span>
            <textarea
              name="additional_urls"
              rows={4}
              defaultValue={defaultAdditionalUrls}
              placeholder="https://www.oneworld.com/airport-lounges
https://www.oneworld.com/round-the-world
https://www.oneworld.com/about-the-oneworld-alliance"
              className="mt-1 w-full rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-3 py-2 font-mono text-xs"
              style={{ fontSize: '0.875rem' }}
            />
          </label>
          <label className="inline-flex items-center gap-2 font-body text-sm text-[var(--color-text-secondary)]">
            <input type="checkbox" name="interactive" value="on" className="h-4 w-4 rounded border-[var(--color-border-soft)]" />
            <span>
              <strong className="text-[var(--color-text-primary)]">Interactive mode</strong> — expand accordions. Adds ~5 sec. Use for JS-heavy pages.
            </span>
          </label>
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
                  applyAction={applyExtractedField}
                  skipAction={skipExtractedField}
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
