import { createClient } from '@/utils/supabase/server'

/**
 * "Apply here" rail for card-bonus alerts.
 *
 * Given the slug of the credit card an alert is ABOUT (alert.apply_card_slug),
 * this resolves ONE call-to-action from the card's own link fields — and it is
 * the single, compliant place that logic lives, so a card-bonus alert never
 * hand-types an apply URL (which would drift and couldn't carry the right rel):
 *
 *   • affiliate_url present → MONETIZED "Apply here" button. rel="nofollow
 *     sponsored" (FTC + search-engine requirement for paid links) and a plain,
 *     honest advertiser-disclosure line beneath it (Charlie's rule).
 *   • else official_url present → issuer "Apply on <issuer>" button. Plain
 *     rel="nofollow", NO disclosure (we earn nothing, so we claim nothing).
 *   • neither → renders nothing (never a dead button).
 *
 * Because it reads the card live, the day an affiliate link is added to a card
 * EVERY alert about that card starts monetizing with zero re-editing.
 */
export default async function ApplyHere({ cardSlug }: { cardSlug: string | null | undefined }) {
  if (!cardSlug) return null

  const supabase = await createClient()
  const { data: card } = await supabase
    .from('credit_cards')
    .select('name, affiliate_url, official_url')
    .eq('slug', cardSlug)
    .maybeSingle()

  if (!card) return null

  const monetized = Boolean(card.affiliate_url)
  const href = card.affiliate_url || card.official_url
  if (!href) return null

  const label = monetized ? `Apply here: ${card.name}` : `Apply on the issuer's site: ${card.name}`
  const rel = monetized ? 'nofollow sponsored noopener' : 'nofollow noopener'

  return (
    <div className="mb-8">
      <a
        href={href}
        target="_blank"
        rel={rel}
        className="rg-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-ui)] px-6 font-ui text-sm font-semibold"
      >
        {label}
      </a>
      {monetized && (
        <p className="mt-2 font-body text-xs leading-relaxed text-[var(--color-text-secondary)] opacity-80">
          Advertiser disclosure: this is a paid affiliate link. We may earn a commission if you are approved,
          at no cost to you. This never affects which offers we cover or what we say about them.
        </p>
      )}
    </div>
  )
}
