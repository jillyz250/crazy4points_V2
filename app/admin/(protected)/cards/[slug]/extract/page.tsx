import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import ExtractionReview from '@/components/admin/cards/ExtractionReview'
import RunExtractionButton from '@/components/admin/cards/RunExtractionButton'
import ManualWelcomeBonusForm from '@/components/admin/cards/ManualWelcomeBonusForm'
import ExtractionActionButton from '@/components/admin/cards/ExtractionActionButton'
import GoodToKnowEditor from '@/components/admin/cards/GoodToKnowEditor'
import ManualMarkdownInput from '@/components/admin/programs/ManualMarkdownInput'
import {
  runExtractionAndSave,
  resaveExtraction,
  rejectExtraction,
  saveManualWelcomeBonus,
  discoverCardUrlsAction,
  applyDiscoveredCardUrls,
  setCardManualOverride,
  setCardUrlField,
  validateUrlAction,
} from './actions'
import { checkCardUrls, hasAnyBrokenUrl, type UrlChecks } from '@/utils/admin/checkUrl'
import { TestUrlButton, UrlStatusBadgeView } from '@/components/admin/cards/UrlStatusBadge'

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
      official_url, guide_to_benefits_url, pricing_terms_url, rotating_categories_url,
      suggested_field_urls, manual_overrides,
      intro, last_verified,
      requires_manual_paste, manual_paste_reason,
      benefits_human_curated,
      good_to_know,
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

  // Scout sources currently registered for this card — used to show "✓ already
  // registered" on Discover suggestions + in the Configured URLs summary.
  const { data: scoutSourcesRaw } = await supabase
    .from('sources')
    .select('name, url, scrape_frequency, is_active')
    .or(
      `name.ilike.${card.name.replace(/'/g, "''")} —%,name.ilike.${card.name.replace(/'/g, "''")} Newsroom%`,
    )
    .order('created_at', { ascending: false })
  const scoutSourcesForCard = (scoutSourcesRaw ?? []) as Array<{ name: string; url: string; scrape_frequency: string; is_active: boolean }>

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
    .select('bonus_amount, bonus_currency, spend_required_usd, spend_window_months, spend_window_days, baseline_bonus_amount, is_elevated, tiered_bonuses, extras')
    .eq('card_id', card.id)
    .eq('is_current', true)
    .maybeSingle()

  // If we have a saved welcome bonus (manual or auto-saved), merge it into the
  // extraction view so ExtractionReview renders the truth.
  type Wb = {
    main: { bonus_amount: number | null; bonus_currency: string | null; spend_required_usd: number | null; spend_window_months: number | null; spend_window_days: number | null }
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
            spend_window_days: currentWelcomeBonus.spend_window_days,
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
  const issuerSlug = Array.isArray(card.issuer)
    ? (card.issuer[0] as { slug?: string } | undefined)?.slug
    : (card.issuer as { slug?: string } | null)?.slug
  const isChaseBusinessCard = card.card_type === 'business' && issuerSlug === 'chase'
  const defaultSourceUrl = sourceUrlParam || card.official_url || ''

  // Pre-validate all four configured URLs on every page load so the editor
  // sees a green/yellow/red badge before clicking Run Extraction. Cached
  // in-memory for 5 min so re-renders are cheap. This is the fix for the
  // IHG / BA / Aer Lingus 404-extract loop.
  const urlChecks = await checkCardUrls({
    official_url: card.official_url as string | null,
    guide_to_benefits_url: card.guide_to_benefits_url as string | null,
    pricing_terms_url: card.pricing_terms_url as string | null,
    rotating_categories_url: card.rotating_categories_url as string | null,
  })
  const anyBroken = hasAnyBrokenUrl(urlChecks)

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
        {/* Human-curated benefits warning. Surfaces when this card's benefits
            were hand-authored (vs auto-extracted) so the editor knows that
            re-extraction risks downgrading polished content. saveExtractedBenefits
            uses delete-then-insert; any non-empty extraction REPLACES the existing
            set, and Firecrawl frequently can't expand JS accordions on Chase
            business pages. Per migration 309. */}
        {(card as { benefits_human_curated?: boolean }).benefits_human_curated && (
          <div
            role="alert"
            className="mt-4 rounded-[var(--radius-card)] border-l-4 border-l-amber-500 bg-amber-50 p-4"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg leading-none">🛡️</span>
              <div className="flex-1">
                <div className="font-ui text-xs font-bold uppercase tracking-wide text-amber-900">
                  Human-curated benefits — re-extraction discouraged
                </div>
                <div className="mt-1 font-body text-sm text-amber-900">
                  This card&apos;s benefit rows were hand-authored. Re-extraction risks
                  downgrading polished content, especially when Firecrawl can&apos;t
                  expand JS accordions (Chase business pages in particular). Prefer
                  per-field edits on the card&apos;s edit page. For semi-annual deep
                  refreshes, paste the accordion-expanded source into the Manual
                  Markdown box below.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual-paste required banner. Flipped on by editors after a failed
            Firecrawl scrape so the next person doesn't waste credits trying
            again. Stored in credit_cards.requires_manual_paste + reason. */}
        {(card as { requires_manual_paste?: boolean }).requires_manual_paste && (
          <div
            role="alert"
            className="mt-4 rounded-[var(--radius-card)] border-l-4 border-l-red-500 bg-red-50 p-4"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg leading-none">⚠️</span>
              <div className="flex-1">
                <div className="font-ui text-xs font-bold uppercase tracking-wide text-red-900">
                  Manual paste required — Firecrawl fails on this card
                </div>
                <div className="mt-1 font-body text-sm text-red-900">
                  {(card as { manual_paste_reason?: string | null }).manual_paste_reason ||
                    'Automatic extraction has failed on this card before. Use the Manual markdown textarea below — copy page content from the issuer URL and paste it in to bypass Firecrawl.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* URL reachability banner — surfaces 404/blocked URLs so the editor
            stops the "extract → thin result → chase URL → repeat" loop. */}
        {anyBroken && (
          <div
            role="alert"
            className="mt-4 rounded-[var(--radius-card)] border-l-4 border-l-amber-500 bg-amber-50 p-4"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg leading-none">⚠️</span>
              <div className="flex-1">
                <div className="font-ui text-xs font-bold uppercase tracking-wide text-amber-900">
                  One or more configured URLs are unreachable
                </div>
                <div className="mt-1 font-body text-sm text-amber-900">
                  Extraction may return thin results. Fix the broken URLs in the
                  Manual URL config section below before clicking Run Extraction —
                  otherwise Sonnet will waste a call on a 404 page.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configured URLs summary — what's currently in DB for this card */}
        <ConfiguredUrlsSummary
          officialUrl={card.official_url as string | null}
          guideUrl={card.guide_to_benefits_url as string | null}
          pricingUrl={card.pricing_terms_url as string | null}
          rotatingCategoriesUrl={card.rotating_categories_url as string | null}
          scoutSources={scoutSourcesForCard}
          urlChecks={urlChecks}
        />
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
            ['pricing_terms_url', '💲 Pricing & Terms'],
            ['promo_source', '🎁 Issuer Offers (Scout)'],
            ['newsroom_source', '📰 Newsroom (Scout)'],
          ]
          const rows = slots
            .map(([k, label]) => [k as string, label, sugg[k] as Pick | null] as const)
            .filter(([, , v]) => v && v.url)
          // Compute which suggestions are already in the DB so we can show a
          // "✓ already applied" badge per row.
          const scoutUrls = new Set(scoutSourcesForCard.map((s) => s.url))
          const currentOfficialUrl = card.official_url
          const currentGuideUrl = card.guide_to_benefits_url
          const currentPricingUrl = card.pricing_terms_url
          function isApplied(key: string, url: string): boolean {
            if (key === 'source_url') return currentOfficialUrl === url
            if (key === 'guide_to_benefits_url') return currentGuideUrl === url
            if (key === 'pricing_terms_url') return currentPricingUrl === url
            if (key === 'promo_source' || key === 'newsroom_source') return scoutUrls.has(url)
            return false
          }
          const allApplied = rows.length > 0 && rows.every(([k, , v]) => isApplied(k, v!.url!))
          return (
            <div className="mt-3 rounded-[var(--radius-ui)] border border-amber-300 bg-white p-3">
              <p className="mb-2 font-ui text-[11px] font-bold uppercase tracking-wide text-amber-900">
                Suggestions ({rows.length} found) · {new Date(sugg.generated_at as string).toLocaleString()}
                {allApplied ? (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-900">✓ all applied</span>
                ) : null}
              </p>
              {rows.length === 0 ? (
                <p className="font-body text-xs text-amber-900">
                  No matches. Try a more specific starting URL (e.g. the issuer&apos;s credit cards landing page).
                </p>
              ) : (
                <>
                  <table className="w-full font-body text-xs">
                    <tbody>
                      {rows.map(([key, label, v], i) => (
                        <tr key={i} className="border-b border-amber-100 align-top">
                          <td className="py-1 pr-2 font-semibold whitespace-nowrap">{label}</td>
                          <td className="py-1 pr-2">
                            <a className="text-amber-900 underline" href={v!.url} target="_blank" rel="noreferrer">{v!.url}</a>
                            <p className="mt-0.5 text-[11px] text-amber-700">{v!.reason}</p>
                          </td>
                          <td className="py-1 pr-2 uppercase font-ui text-[10px]">{v!.confidence}</td>
                          <td className="py-1 pr-2 whitespace-nowrap">
                            {isApplied(key, v!.url!) ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">✓ applied</span>
                            ) : (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">new</span>
                            )}
                          </td>
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

      {/* Manual URL config — set/edit any URL field directly */}
      <ManualUrlForm
        slug={card.slug}
        urls={{
          official_url: card.official_url as string | null,
          guide_to_benefits_url: card.guide_to_benefits_url as string | null,
          pricing_terms_url: card.pricing_terms_url as string | null,
          rotating_categories_url: card.rotating_categories_url as string | null,
        }}
        action={setCardUrlField}
      />

      {/* Chase business accordion note — surfaces the known issue so editors
          don't accept thin insurance data on these cards. Auto-retry already
          runs aggressive expansion in the pipeline; this is the manual escape
          hatch when even that fails. */}
      {isChaseBusinessCard ? (
        <section
          className="mb-6 rounded-[var(--radius-card)] border-l-4 border-l-blue-500 bg-blue-50 p-4"
          role="note"
        >
          <div className="flex items-start gap-2">
            <span className="text-lg leading-none">ℹ️</span>
            <div className="flex-1">
              <div className="font-ui text-xs font-bold uppercase tracking-wide text-blue-900">
                Chase business card — accordion-hidden insurance
              </div>
              <p className="mt-1 font-body text-sm text-blue-900">
                Chase business product pages hide the <em>Travel &amp; purchase
                coverage</em> section behind a JS accordion. The pipeline now
                auto-retries with aggressive scroll + multi-pass expansion if
                the first scrape misses it. If your extraction still has fewer
                than 4 insurance benefits after Run Extraction, the accordion
                didn&rsquo;t expand even on retry — use the{' '}
                <strong>Manual markdown upload / paste</strong> box below and
                paste the Travel &amp; purchase coverage section directly from
                the product page.
              </p>
            </div>
          </div>
        </section>
      ) : null}

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
              <div className="mt-1.5">
                <TestUrlButton inputName="source_url" action={validateUrlAction} />
              </div>
            </label>
            <RunExtractionButton />
          </div>
          {/* Opt-in: persist the typed Source URL as the card's canonical
              official_url. Default OFF so one-off extractions from a secondary
              URL (e.g. a benefits sub-page) don't silently corrupt the
              canonical product page. */}
          <label className="mt-2 flex items-start gap-2 font-body text-xs text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              name="save_source_url_as_canonical"
              className="mt-0.5"
            />
            <span>
              Save this Source URL as the card&rsquo;s canonical{' '}
              <code className="rounded bg-[var(--color-background-soft)] px-1 py-0.5 font-mono text-[10px]">official_url</code>
              . Leave unchecked for a one-off extraction (the saved URL stays
              the same).
            </span>
          </label>
          {(card.guide_to_benefits_url || card.pricing_terms_url) ? (
            <div className="rounded-[var(--radius-ui)] border border-emerald-200 bg-emerald-50/40 px-3 py-2 font-body text-xs text-emerald-800">
              <p className="mb-1 font-semibold">
                ✓ Multi-URL scrape active — exact URLs being sent to Sonnet:
              </p>
              <ul className="list-none space-y-1 pl-0">
                <li>
                  <span className="font-semibold">🎯 Product:</span>{' '}
                  <a
                    className="break-all text-emerald-900 underline"
                    href={defaultSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {defaultSourceUrl}
                  </a>
                </li>
                {card.guide_to_benefits_url ? (
                  <li>
                    <span className="font-semibold">📘 Guide to Benefits:</span>{' '}
                    <a
                      className="break-all text-emerald-900 underline"
                      href={card.guide_to_benefits_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {card.guide_to_benefits_url}
                    </a>
                  </li>
                ) : null}
                {card.pricing_terms_url ? (
                  <li>
                    <span className="font-semibold">$ Pricing &amp; Terms:</span>{' '}
                    <a
                      className="break-all text-emerald-900 underline"
                      href={card.pricing_terms_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {card.pricing_terms_url}
                    </a>
                  </li>
                ) : null}
              </ul>
              <p className="mt-1.5 italic">
                Combined markdown sent to Sonnet so insurance, FX fee, APR, and protection details all get captured.
              </p>
            </div>
          ) : null}

          <label className="inline-flex items-center gap-2 font-body text-sm text-[var(--color-text-secondary)]">
            {/* Default-checked for business cards. Chase business product pages
                hide travel/purchase insurance behind a JS accordion that plain
                Firecrawl can't crack. Confirmed gap on Southwest Premier Business
                + Ink trio on 2026-05-18. Editor can still uncheck for a faster
                scrape. */}
            <input
              type="checkbox"
              name="interactive"
              value="on"
              defaultChecked={card.card_type === 'business'}
              className="h-4 w-4 rounded border-[var(--color-border-soft)]"
            />
            <span>
              <strong className="text-[var(--color-text-primary)]">Interactive mode</strong> — expand accordions, click &ldquo;Show more&rdquo;, open all <code className="font-mono text-xs">{`<details>`}</code>. Adds ~5 sec. <strong>Auto-enabled for business cards</strong> (insurance hides behind accordions); also recommended for Citi, US Bank, Wells Fargo.
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

      {/* Manual override form — for fields the extraction pipeline can't reach */}
      <ManualOverrideForm
        slug={card.slug}
        currentValues={{
          foreign_transaction_fee_pct: card.foreign_transaction_fee_pct as number | null,
          credit_score_recommended: null,  // not stored on card row; lives in extractions
        }}
        manualOverrides={(card.manual_overrides as Record<string, { value: unknown; set_at: string; note: string }> | null) ?? {}}
        action={setCardManualOverride}
      />

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

          {/* Editorial layer — Sonnet-draft + manual edit of good_to_know.
              Lives below extraction review because curation comes after facts. */}
          <GoodToKnowEditor
            slug={card.slug}
            initialValue={(card as { good_to_know?: string | null }).good_to_know ?? null}
          />


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

/**
 * Configured URLs summary — shows what's currently stored on the card row +
 * which Scout sources are registered. Lives at the top of the extract page so
 * the editor knows at a glance what extraction will use and what alerts will
 * watch, without needing to click Discover or open the DB.
 */
function ConfiguredUrlsSummary({
  officialUrl,
  guideUrl,
  pricingUrl,
  rotatingCategoriesUrl,
  scoutSources,
  urlChecks,
}: {
  officialUrl: string | null
  guideUrl: string | null
  pricingUrl: string | null
  rotatingCategoriesUrl: string | null
  scoutSources: Array<{ name: string; url: string; scrape_frequency: string; is_active: boolean }>
  urlChecks?: UrlChecks
}) {
  const hasAny = officialUrl || guideUrl || pricingUrl || rotatingCategoriesUrl || scoutSources.length > 0
  if (!hasAny) {
    return (
      <p className="mt-2 font-body text-xs text-amber-700">
        No URLs configured yet. Use the Discover URLs panel below to find them automatically — Apply will set product URL + register Scout sources.
      </p>
    )
  }
  const anyBroken = urlChecks ? hasAnyBrokenUrl(urlChecks) : false
  return (
    <details open={anyBroken} className="mt-2 rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-2 py-1">
      <summary className="cursor-pointer font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
        ✓ Configured URLs ({(officialUrl ? 1 : 0) + (guideUrl ? 1 : 0) + (pricingUrl ? 1 : 0) + (rotatingCategoriesUrl ? 1 : 0) + scoutSources.length}) — click to expand
      </summary>
      <ul className="mt-2 ml-4 list-disc space-y-1 font-body text-xs">
        {officialUrl ? (
          <li>
            <span className="font-semibold">🎯 Product page:</span>{' '}
            <a className="text-[var(--color-primary)] underline" href={officialUrl} target="_blank" rel="noreferrer">{officialUrl}</a>
            <UrlStatusBadgeView result={urlChecks?.official_url ?? null} />
          </li>
        ) : null}
        {guideUrl ? (
          <li>
            <span className="font-semibold">📘 Guide to Benefits:</span>{' '}
            <a className="text-[var(--color-primary)] underline" href={guideUrl} target="_blank" rel="noreferrer">{guideUrl}</a>
            <UrlStatusBadgeView result={urlChecks?.guide_to_benefits_url ?? null} />
          </li>
        ) : null}
        {pricingUrl ? (
          <li>
            <span className="font-semibold">💲 Pricing &amp; Terms:</span>{' '}
            <a className="text-[var(--color-primary)] underline" href={pricingUrl} target="_blank" rel="noreferrer">{pricingUrl}</a>
            <UrlStatusBadgeView result={urlChecks?.pricing_terms_url ?? null} />
          </li>
        ) : null}
        {rotatingCategoriesUrl ? (
          <li>
            <span className="font-semibold">🔄 Rotating categories:</span>{' '}
            <a className="text-[var(--color-primary)] underline" href={rotatingCategoriesUrl} target="_blank" rel="noreferrer">{rotatingCategoriesUrl}</a>{' '}
            <span className="text-amber-700">(quarterly refresh)</span>
            <UrlStatusBadgeView result={urlChecks?.rotating_categories_url ?? null} />
          </li>
        ) : null}
        {scoutSources.map((s) => (
          <li key={s.url}>
            <span className="font-semibold">
              {s.name.toLowerCase().includes('newsroom') ? '📰' : '🎁'} {s.name}:
            </span>{' '}
            <a className="text-[var(--color-primary)] underline" href={s.url} target="_blank" rel="noreferrer">{s.url}</a>{' '}
            <span className="text-[var(--color-text-secondary)]">({s.scrape_frequency}{s.is_active ? '' : ', paused'})</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

/**
 * Manual override form — surfaces the small set of fields the extraction
 * pipeline can't reach (FX fee, credit_score_recommended, authorized_user
 * fields, referral bonus). Setting any of these writes BOTH the column
 * value AND the manual_overrides jsonb provenance entry so the staleness
 * report (/admin/manual-overrides) can flag them later for re-verification.
 */
function ManualOverrideForm({
  slug,
  currentValues,
  manualOverrides,
  action,
}: {
  slug: string
  currentValues: Record<string, unknown>
  manualOverrides: Record<string, { value: unknown; set_at: string; note: string }>
  action: (formData: FormData) => Promise<void>
}) {
  // Which fields support manual override + their display config
  const FIELDS: Array<{ key: string; label: string; hint: string; type: 'number' | 'enum'; enumOptions?: string[] }> = [
    {
      key: 'foreign_transaction_fee_pct',
      label: 'Foreign transaction fee (%)',
      hint: 'e.g., 0 for Sapphire Preferred/Reserve, 3 for Freedom Flex/Unlimited',
      type: 'number',
    },
    {
      key: 'credit_score_recommended',
      label: 'Credit score recommended',
      hint: 'fair / good / excellent',
      type: 'enum',
      enumOptions: ['fair', 'good', 'excellent'],
    },
    {
      key: 'annual_fee_usd',
      label: 'Annual fee (USD)',
      hint: 'Manually override if extraction missed it. e.g., 95 for Sapphire Preferred',
      type: 'number',
    },
  ]

  function ageDays(setAt: string): number {
    return Math.round((Date.now() - new Date(setAt).getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <section className="mb-8 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-5">
      <h2 className="font-display text-xl font-semibold text-[var(--color-primary)]">
        Manual field overrides
      </h2>
      <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">
        For fields the extraction pipeline can&apos;t reach (issuer doesn&apos;t publish a public Schumer-box, etc.).
        Setting a value here tracks <em>when</em> you set it so the{' '}
        <a className="underline text-[var(--color-primary)]" href="/admin/manual-overrides">stale manual values report</a>{' '}
        can flag it for re-verification later.
      </p>

      <div className="mt-4 grid gap-3">
        {FIELDS.map((f) => {
          const current = currentValues[f.key]
          const override = manualOverrides[f.key]
          return (
            <form key={f.key} action={action} className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white p-3">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="field" value={f.key} />
              <div className="flex flex-wrap items-baseline gap-2">
                <strong className="font-ui text-sm text-[var(--color-text-primary)]">{f.label}</strong>
                <span className="font-body text-xs text-[var(--color-text-secondary)]">
                  Current: <code className="font-mono">{current == null ? '—' : String(current)}</code>
                </span>
                {override ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-ui text-[10px] uppercase tracking-wide text-amber-900">
                    Manually set {ageDays(override.set_at)}d ago
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                {f.type === 'enum' ? (
                  <select
                    name="value"
                    defaultValue=""
                    className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-2 py-1 font-body text-sm"
                  >
                    <option value="" disabled>Pick a value…</option>
                    {f.enumOptions!.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    name="value"
                    type="number"
                    step="0.01"
                    placeholder="new value"
                    className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-2 py-1 font-mono text-sm"
                    style={{ width: '8rem' }}
                  />
                )}
                <input
                  name="note"
                  type="text"
                  placeholder="optional note (e.g. 'Chase doesn't publish Schumer-box')"
                  className="flex-1 min-w-[14rem] rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-2 py-1 font-body text-xs"
                />
                <ExtractionActionButton variant="secondary" size="sm" label="Set override" pendingLabel="Saving…" />
              </div>
              <p className="mt-1 font-body text-[11px] text-[var(--color-text-secondary)]">{f.hint}</p>
              {override?.note ? (
                <p className="mt-1 font-body text-[11px] italic text-amber-800">Note: {override.note}</p>
              ) : null}
            </form>
          )
        })}
      </div>
    </section>
  )
}

/**
 * Manual URL config form — direct edit of the four URL columns on credit_cards.
 * Use when Discover URLs missed something (e.g., the shared Chase Freedom
 * benefits guide that covers both Freedom Flex and Freedom Unlimited but
 * doesn't match the per-card discovery search). Editor pastes the URL,
 * clicks Set, done.
 */
function ManualUrlForm({
  slug,
  urls,
  action,
}: {
  slug: string
  urls: {
    official_url: string | null
    guide_to_benefits_url: string | null
    pricing_terms_url: string | null
    rotating_categories_url: string | null
  }
  action: (formData: FormData) => Promise<void>
}) {
  const FIELDS: Array<{ key: keyof typeof urls; label: string; icon: string; hint: string }> = [
    { key: 'official_url', label: 'Product page (source URL)', icon: '🎯', hint: 'The main marketing page for the card' },
    { key: 'guide_to_benefits_url', label: 'Guide to Benefits', icon: '📘', hint: 'Issuer\'s benefits PDF/page — insurance, protections, fine print' },
    { key: 'pricing_terms_url', label: 'Pricing & Terms', icon: '💲', hint: 'Schumer-box: FX fee, APR ranges, late fees. Often not publicly linked.' },
    { key: 'rotating_categories_url', label: 'Rotating categories', icon: '🔄', hint: 'Only for cards with quarterly rotating bonuses (Freedom Flex, Discover It). Quarterly refresh.' },
  ]

  return (
    <section className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-white p-4">
      <details>
        <summary className="cursor-pointer font-display text-base font-semibold text-[var(--color-primary)]">
          ✏️ Manual URL config (when Discover missed one)
        </summary>
        <p className="mt-2 font-body text-sm text-[var(--color-text-secondary)]">
          Paste a URL into any field and click Set to override. Leave blank + Set to clear. Useful when Discover URLs missed a page
          (e.g., Chase's shared Freedom benefits guide covers both Flex and Unlimited, but discovery searches per-card).
        </p>
        <div className="mt-3 grid gap-2">
          {FIELDS.map((f) => (
            <form key={f.key} action={action} className="flex flex-wrap items-end gap-2 rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] p-2">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="field" value={f.key} />
              <label className="flex flex-1 min-w-[20rem] flex-col gap-1">
                <span className="font-ui text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {f.icon} {f.label}
                </span>
                <input
                  type="url"
                  name="url"
                  defaultValue={urls[f.key] ?? ''}
                  placeholder="https://..."
                  className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-2 py-1 font-mono text-sm"
                />
                <span className="font-body text-[11px] text-[var(--color-text-secondary)]">{f.hint}</span>
              </label>
              <ExtractionActionButton variant="secondary" size="sm" label="Set" pendingLabel="…" />
            </form>
          ))}
        </div>
      </details>
    </section>
  )
}
