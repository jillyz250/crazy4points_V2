import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import ExtractionReview from '@/components/admin/cards/ExtractionReview'
import RunExtractionButton from '@/components/admin/cards/RunExtractionButton'
import { runExtractionAndSave, resaveExtraction, rejectExtraction } from './actions'

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
    .select('id, source_url, extraction, status, created_at')
    .eq('card_id', card.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Default source URL: param > issuer website > empty.
  const issuerSite = Array.isArray(card.issuer) ? card.issuer[0]?.website_url : (card.issuer as { website_url?: string } | null)?.website_url
  const defaultSourceUrl = sourceUrlParam || ''

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
          {issuerSite ? (
            <>
              {' · '}
              <a className="text-[var(--color-primary)] underline" href={issuerSite} target="_blank" rel="noreferrer">issuer site</a>
            </>
          ) : null}
        </p>
      </header>

      {/* Run extraction form */}
      <section className="mb-8 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-5">
        <h2 className="font-display text-xl font-semibold text-[var(--color-primary)]">
          Run extraction
        </h2>
        <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">
          Paste the issuer product page URL. Auto-approve mode: Firecrawl + Claude Sonnet run, results save immediately.
        </p>

        <form action={runExtractionAndSave} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <input type="hidden" name="slug" value={card.slug} />
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
        </form>
      </section>

      {/* Latest extraction review */}
      {latest ? (
        <ExtractionReview
          extractionId={latest.id}
          sourceUrl={latest.source_url}
          status={latest.status}
          extraction={latest.extraction}
          resaveAction={resaveExtraction}
          rejectAction={rejectExtraction}
        />
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
