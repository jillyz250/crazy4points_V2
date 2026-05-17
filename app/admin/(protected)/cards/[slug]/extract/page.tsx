import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import ExtractionReview from '@/components/admin/cards/ExtractionReview'
import RunExtractionButton from '@/components/admin/cards/RunExtractionButton'
import ManualWelcomeBonusForm from '@/components/admin/cards/ManualWelcomeBonusForm'
import ExtractionActionButton from '@/components/admin/cards/ExtractionActionButton'
import ManualMarkdownInput from '@/components/admin/programs/ManualMarkdownInput'
import {
  runExtractionAndSave,
  resaveExtraction,
  rejectExtraction,
  saveManualWelcomeBonus,
  discoverCardUrlsAction,
  applyDiscoveredCardUrls,
} from './actions'

export const dynamic = 'force-dynamic'

/**
 * Admin extract route — kicks off a Firecrawl + Claude extraction for a
 * credit card and (in auto-approve mode) saves the result immediately.
 *
 * URL: /admin/cards/[slug]/extract?source_url=<chase product page>
 *
 * Auto-approve mode (current default): submitting the form runs the full
 * pipeline end-to-end. Past extractions are listed below for audit; each
 * has Re-save and Reject actions for manual recovery.
 */
export default async function CardExtractPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ source_url?: string }>
}) {
  const { slug } = await params
  const { source_url: sourceUrlParam } = await searchParams

  const supabase = createAdminClient()

  const { data: card, error } = await supabase
    .from('credit_cards')
    .select(`
      id, slug, name, card_type, card_tier, status,
      annual_fee_usd, foreign_transaction_fee_pct,
      official_url, guide_to_benefits_url,
      suggested_field_urls,
      intro, last_verified,
      issuer:issuers(slug, name, website_url)
    `)
    .eq('slug', slug)
    .single()

  if (error || !card) notFound()

  // Past extractions for this card (audit log).
  const { data: extractions } = await supabase
    .from('credit_card_extractions')
    .select('id, source_url, model, status, error_message, markdown_chars, input_tokens, output_tokens, created_at, saved_at')
    .eq('card_id', card.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Most recent extraction's full JSON (for inline review).
  const { data: latest } = await supabase
    .from('credit_card_extractions')
    .select('id, source_url, extraction, verifications, status, created_at, saved_at, error_message, raw_markdown, markdown_chars')
    .eq('card_id', card.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Current welcome bonus from the live table — may differ from extraction.welcome_bonus
  // if the editor entered it manually (Sonnet missed it on the page).
  // The displayed welcome bonus should always reflect what's actually saved
  // in credit_card_welcome_bonuses, not what was returned in the extraction JSONB.
  const { data: currentWelcomeBonus } = await supabase
    .from('credit_card_welcome_bonuses')
    .select('bonus_amount, bonus_currency, spend_required_usd, spend_window_months, baseline_bonus_amount, is_elevated, tiered_bonuses, extras')
    .eq('card_id', card.id)
    .eq('is_current', true)
    .maybeSingle()

  // If we have a saved welcome bonus (manual or auto-saved), merge it into the
  // extraction view so ExtractionReview renders the truth.
  type Wb = {
    main: { bonus_amount: number | null; bonus_currency: string | null; spend_required_usd: number | null; spend_window_months: number | null }
    baseline_bonus_amount: number | null
    is_elevated: boolean
    tiered: unknown[]
    extras: string | null
    source_quote: string | null
    confidence: 'high' | 'medium' | 'low'
  }
  const mergedExtraction = latest && currentWelcomeBonus
    ? {
        ...(latest.extraction as Record<string, unknown>),
        welcome_bonus: {
          main: {
            bonus_amount: currentWelcomeBonus.bonus_amount,
            bonus_currency: currentWelcomeBonus.bonus_currency,
            spend_required_usd: currentWelcomeBonus.spend_required_usd,
            spend_window_months: currentWelcomeBonus.spend_window_months,
          },
          baseline_bonus_amount: currentWelcomeBonus.baseline_bonus_amount,
          is_elevated: currentWelcomeBonus.is_elevated,
          tiered: currentWelcomeBonus.tiered_bonuses ?? [],
          extras: currentWelcomeBonus.extras,
          source_quote: null,
          confidence: 'high',
        } as Wb,
      }
    : latest?.extraction

  // Default source URL precedence: query param > stored official_url > empty.
  // The card's official_url is the source of truth — once set, the editor never
  // has to type it again. If the issuer page moves, update it on the card row
  // (admin → cards → edit) and every future extraction picks up the new URL.
  const issuerSite = Array.isArray(card.issuer) ? card.issuer[0]?.website_url : (card.issuer as { website_url?: string } | null)?.website_url
  const defaultSourceUrl = sourceUrlParam || card.official_url || ''

  return (
    <div className="rg-container px-6 py-10">
      <header className="mb-6">
        <p className="font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
          {Array.isArray(card.issuer) ? card.issuer[0]?.name : (card.issuer as { name?: string } | null)?.name}
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)]">
          {card.name}
        </h1>
        <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">
          {card.card_type} · {card.card_tier} · status: {card.status}
          {card.last_verified ? ` · last verified ${card.last_verified}` : ' · never verified'}
          {' · '}
          <a
            className="text-[var(--color-primary)] underline"
            href={`/cards/${card.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            view public page →
          </a>
          {issuerSite ? (
            <>
              {' · '}
              <a className="text-[var(--color-primary)] underline" href={issuerSite} target="_blank" rel="noreferrer">issuer site</a>
            </>
          ) : null}
        </p>
        {card.official_url ? (
          <p className="mt-1 font-body text-xs text-[var(--color-text-secondary)]">
            <span className="font-ui uppercase tracking-wide">Stored product URL:</span>{' '}
            <a className="text-[var(--color-primary)] underline" href={card.official_url} target="_blank" rel="noreferrer">{card.official_url}</a>
          </p>
        ) : (
          <p className="mt-1 font-body text-xs text-amber-700">
            No product URL stored for this card yet. Paste one in the form below — it will pre-fill on every future extraction once saved by the action.
          </p>
        )}
      </header>

      {/* 🔍 Discover issuer URLs (same flow as programs PR #543) */}
      <section className="mb-6 rounded-[var(--radius-card)] border border-amber-200 bg-amber-50/40 p-4">
        <h2 className="font-display text-lg font-semibold text-amber-900">
          🔍 Don&apos;t know the URLs? Discover them.
        </h2>
        <p className="mt-1 font-body text-sm text-amber-900">
          Paste the issuer&apos;s main marketing site (e.g. <code>https://www.chase.com</code>). Sonnet maps the site,
          identifies card-specific pages + the issuer&apos;s offers + newsroom, then recommends URLs.
          Click Apply to populate the Source URL below + auto-register Scout sources.
        </p>

        <form action={discoverCardUrlsAction} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="slug" value={card.slug} />
          <label className="flex flex-1 flex-col gap-1 min-w-[20rem]">
            <span className="font-ui text-[11px] uppercase tracking-wide text-amber-900">Starting URL</span>
            <input
              type="url"
              name="starting_url"
              defaultValue={(card.suggested_field_urls as { starting_url?: string } | null)?.starting_url ?? ''}
              placeholder="https://www.chase.com"
              className="rounded-[var(--radius-ui)] border border-amber-300 bg-white px-3 py-1.5 font-mono"
              style={{ fontSize: '0.875rem' }}
            />
          </label>
          <ExtractionActionButton variant="secondary" label="🔍 Discover URLs" pendingLabel="Mapping & classifying…" />
        </form>

        {(() => {
          const sugg = card.suggested_field_urls as Record<string, unknown> | null
          if (!sugg || !sugg.generated_at) return null
          type Pick = { url?: string; reason?: string; confidence?: string }
          const slots: Array<[string, string]> = [
            ['source_url', '🎯 Product page (source_url)'],
            ['guide_to_benefits_url', '📘 Guide to Benefits'],
            ['promo_source', '🎁 Issuer Offers (Scout)'],
            ['newsroom_source', '📰 Newsroom (Scout)'],
          ]
          const rows = slots
            .map(([k, label]) => [label, sugg[k] as Pick | null] as const)
            .filter(([, v]) => v && v.url)
          return (
            <div className="mt-3 rounded-[var(--radius-ui)] border border-amber-300 bg-white p-3">
              <p className="mb-2 font-ui text-[11px] font-bold uppercase tracking-wide text-amber-900">
                Suggestions ({rows.length} found) · {new Date(sugg.generated_at as string).toLocaleString()}
              </p>
              {rows.length === 0 ? (
                <p className="font-body text-xs text-amber-900">
                  No matches. Try a more specific starting URL (e.g. the issuer&apos;s credit cards landing page).
                </p>
              ) : (
                <>
                  <table className="w-full font-body text-xs">
                    <tbody>
                      {rows.map(([label, v], i) => (
                        <tr key={i} className="border-b border-amber-100 align-top">
                          <td className="py-1 pr-2 font-semibold whitespace-nowrap">{label}</td>
                          <td className="py-1 pr-2">
                            <a className="text-amber-900 underline" href={v!.url} target="_blank" rel="noreferrer">{v!.url}</a>
                            <p className="mt-0.5 text-[11px] text-amber-700">{v!.reason}</p>
                          </td>
                          <td className="py-1 pr-2 uppercase font-ui text-[10px]">{v!.confidence}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <form action={applyDiscoveredCardUrls} className="mt-3">
                    <input type="hidden" name="slug" value={card.slug} />
                    <ExtractionActionButton variant="primary" label="⬇ Apply: set product URL + register Scout sources" pendingLabel="Applying…" />
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
          Paste the issuer product page URL. Auto-approve mode: Firecrawl + Claude Sonnet run, results save immediately.
        </p>

        <form action={runExtractionAndSave} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="slug" value={card.slug} />
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
                placeholder="https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve"
                className="mt-1 w-full rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-3 py-2 font-body text-base"
              />
            </label>
            <RunExtractionButton />
          </div>
          {card.guide_to_benefits_url ? (
            <p className="font-body text-xs text-[var(--color-text-secondary)]">
              ✓ Will also scrape <a className="text-[var(--color-primary)] underline" href={card.guide_to_benefits_url} target="_blank" rel="noreferrer">guide_to_benefits</a> — combined markdown sent to Sonnet so insurance / protection details get captured alongside the product page.
            </p>
          ) : null}

          <label className="inline-flex items-center gap-2 font-body text-sm text-[var(--color-text-secondary)]">
            <input type="checkbox" name="interactive" value="on" className="h-4 w-4 rounded border-[var(--color-border-soft)]" />
            <span>
              <strong className="text-[var(--color-text-primary)]">Interactive mode</strong> — expand accordions, click &ldquo;Show more&rdquo;, open all <code className="font-mono text-xs">{`<details>`}</code>. Adds ~5 sec. Use for Citi, US Bank, Wells Fargo pages that hide benefits behind accordions.
            </span>
          </label>

          {/* Manual markdown upload / paste — for issuers Firecrawl can't reach */}
          <details className="rounded-[var(--radius-card)] border-2 border-red-200 bg-red-50/30 p-3">
            <summary className="cursor-pointer font-ui text-xs font-bold uppercase tracking-wide text-red-900">
              📋 Manual markdown upload / paste — bypass Firecrawl (for hostile sites)
            </summary>
            <div className="mt-3 flex flex-col gap-3">
              <p className="font-body text-xs text-red-900">
                Rare for card issuers, but if Firecrawl returns the wrong page or a captcha, use this fallback:
              </p>
              <ol className="ml-4 list-decimal font-body text-xs text-red-900 space-y-1">
                <li>Open <a className="underline" href="https://www.firecrawl.dev/playground" target="_blank" rel="noreferrer">Firecrawl playground</a> in a new tab</li>
                <li>Scrape the card&apos;s product page, click <strong>Markdown</strong> (or <strong>JSON</strong>) to download</li>
                <li>Click <strong>Upload markdown files</strong> below and select the downloaded file</li>
                <li>Click <strong>Run extraction</strong> — pipeline skips Firecrawl + uses your upload</li>
              </ol>
              <ManualMarkdownInput />
              <p className="font-body text-[11px] text-red-800">
                When this is filled, the Source URL is still used as a stored reference (and links from the review page) but the actual scrape is skipped.
                Auto-verify reconciles against the same uploaded markdown.
              </p>
            </div>
          </details>
        </form>
      </section>

      {/* Latest extraction review */}
      {latest ? (
        <>
          <ExtractionReview
            extractionId={latest.id}
            sourceUrl={latest.source_url}
            status={latest.status}
            extraction={mergedExtraction}
            verification={
              latest.verifications && typeof latest.verifications === 'object' && Object.keys(latest.verifications).length > 0
                ? (latest.verifications as Parameters<typeof ExtractionReview>[0]['verification'])
                : null
            }
            createdAt={latest.created_at}
            savedAt={latest.saved_at}
            errorMessage={latest.error_message}
            resaveAction={resaveExtraction}
            rejectAction={rejectExtraction}
          />

          {/* Manual welcome bonus entry — shown only when NO welcome bonus
              exists yet (neither from Sonnet's extraction nor from a prior
              manual entry). Once a welcome bonus is saved to the welcome_bonuses
              table, this form is hidden. */}
          {(() => {
            const wb = (latest.extraction as { welcome_bonus?: { main?: { bonus_amount?: number | null; bonus_currency?: string | null; spend_required_usd?: number | null; spend_window_months?: number | null } } } | null)?.welcome_bonus
            const hasExtractedWelcomeBonus = wb?.main?.bonus_amount != null
            const hasSavedWelcomeBonus = currentWelcomeBonus?.bonus_amount != null
            if (hasExtractedWelcomeBonus || hasSavedWelcomeBonus) return null
            return (
              <ManualWelcomeBonusForm
                cardSlug={card.slug}
                sourceUrl={latest.source_url}
                saveAction={saveManualWelcomeBonus}
                defaultCurrency={wb?.main?.bonus_currency ?? ''}
                defaultSpendUsd={wb?.main?.spend_required_usd ?? null}
                defaultWindowMonths={wb?.main?.spend_window_months ?? null}
              />
            )
          })()}

          {/* Raw scraped markdown — collapsed by default to keep the page lean.
              Useful when an extraction is wrong and you want to confirm whether
              Firecrawl actually saw the content, or when Sonnet missed something
              and you want to verify it was on the page. */}
          {latest.raw_markdown ? (
            <details className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-white p-4">
              <summary className="cursor-pointer font-ui text-sm font-medium text-[var(--color-primary)]">
                View raw scraped markdown ({latest.markdown_chars?.toLocaleString() ?? '?'} chars)
              </summary>
              <p className="mt-2 font-body text-xs text-[var(--color-text-secondary)]">
                This is the exact markdown Firecrawl pulled from the source URL and passed to Claude.
                If a benefit is missing from the extraction but appears here, the prompt needs tightening.
                If it's missing here, Firecrawl didn&rsquo;t see it — the page may have JS-rendered content
                or the URL is wrong.
              </p>
              <pre className="mt-3 max-h-[600px] overflow-auto whitespace-pre-wrap rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-3 font-mono text-xs text-[var(--color-text-primary)]">
                {latest.raw_markdown}
              </pre>
            </details>
          ) : null}
        </>
      ) : (
        <p className="font-body text-sm text-[var(--color-text-secondary)]">
          No extractions yet for this card.
        </p>
      )}

      {/* Audit log */}
      {extractions && extractions.length > 1 ? (
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
                  <th className="py-2 pr-3">Model</th>
                  <th className="py-2 pr-3">In / out tokens</th>
                  <th className="py-2 pr-3">Source URL</th>
                </tr>
              </thead>
              <tbody>
                {extractions.map((e) => (
                  <tr key={e.id} className="border-b border-[var(--color-border-soft)]">
                    <td className="py-2 pr-3">{new Date(e.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-3">{e.status}{e.error_message ? ` — ${e.error_message.slice(0, 60)}` : ''}</td>
                    <td className="py-2 pr-3">{e.model}</td>
                    <td className="py-2 pr-3">{e.input_tokens ?? '—'} / {e.output_tokens ?? '—'}</td>
                    <td className="py-2 pr-3 truncate max-w-md">{e.source_url}</td>
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
