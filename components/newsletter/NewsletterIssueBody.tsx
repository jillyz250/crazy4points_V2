import Link from 'next/link'
import type { PublicNewsletter } from '@/utils/content/publicNewsletters'

// Renders an internal or external link; internal (relative) paths use next/link.
function IssueLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (!href) return <>{children}</>
  const internal = href.startsWith('/')
  const cls = 'text-[var(--color-primary)] font-medium hover:underline'
  return internal
    ? <Link href={href} className={cls}>{children}</Link>
    : <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-2xl font-semibold text-[var(--color-primary)] mt-12 mb-4">
      {children}
    </h2>
  )
}

export default function NewsletterIssueBody({ n }: { n: PublicNewsletter }) {
  const offers = n.active_offers
  const offerGroups: { label: string; items: NonNullable<typeof offers>['transfer_bonuses'] }[] = offers
    ? [
        { label: 'Transfer bonuses', items: offers.transfer_bonuses ?? [] },
        { label: 'Earning promos', items: offers.earning_promos ?? [] },
        { label: 'Purchase bonuses', items: offers.purchase_bonuses ?? [] },
      ].filter((g) => g.items.length > 0)
    : []

  return (
    <div className="mx-auto max-w-2xl">
      {/* Big story */}
      {n.big_story_html && (
        <div className="rg-prose" dangerouslySetInnerHTML={{ __html: n.big_story_html }} />
      )}

      {/* Sweet spot */}
      {n.sweet_spot?.topic && (
        <section>
          <SectionHeading>Sweet spot: {n.sweet_spot.topic}</SectionHeading>
          {n.sweet_spot.mechanic_explainer && (
            <p className="font-body text-[var(--color-text-primary)] leading-relaxed">
              {n.sweet_spot.mechanic_explainer}
            </p>
          )}
          {n.sweet_spot.best_uses?.length > 0 && (
            <ul className="mt-4 space-y-3">
              {n.sweet_spot.best_uses.map((u, i) => (
                <li key={i} className="font-body text-[var(--color-text-primary)]">
                  <span className="font-semibold">{u.name}</span>
                  {u.why ? ` — ${u.why}` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Money can't buy: new experiences */}
      {n.top_experiences.length > 0 && (
        <section>
          <SectionHeading>Beyond flights &amp; hotels: experiences on points</SectionHeading>
          <p className="font-body text-[var(--color-text-secondary)] leading-relaxed mb-4">
            {n.top_experiences.some((e) => e.is_auction)
              ? 'Use points for access you cannot otherwise book. A points price means a fixed cost; a bid is an auction you can lose.'
              : 'Use points for access you cannot otherwise book, at a fixed points price.'}
          </p>
          <ul className="space-y-4">
            {n.top_experiences.map((e, i) => (
              <li key={i} className="font-body text-[var(--color-text-primary)]">
                {e.program_label ? (
                  <span className="font-ui text-xs uppercase tracking-wide text-[var(--color-primary)] mr-2">{e.program_label}</span>
                ) : null}
                <IssueLink href={e.link_url}><span className="font-semibold">{e.title}</span></IssueLink>
                <span className="block text-[var(--color-text-secondary)] mt-1">
                  {[e.points_label, e.event_label, e.deadline].filter(Boolean).join(' · ')}
                </span>
                {e.is_auction ? (
                  <span className="block text-[var(--color-text-secondary)] italic text-sm mt-1">
                    Auction: you bid points and can be outbid. Final sale, travel not included.
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Live offers */}
      {offerGroups.length > 0 && (
        <section>
          <SectionHeading>Live offers</SectionHeading>
          {offerGroups.map((g) => (
            <div key={g.label} className="mb-6">
              <h3 className="font-ui text-sm uppercase tracking-wide text-[var(--color-text-secondary)] mb-2">{g.label}</h3>
              <ul className="space-y-3">
                {g.items.map((o, i) => (
                  <li key={i} className="font-body text-[var(--color-text-primary)]">
                    <IssueLink href={o.link_url}><span className="font-semibold">{o.headline}</span></IssueLink>
                    {o.blurb ? ` — ${o.blurb}` : ''}
                    {o.deadline ? <span className="text-[var(--color-text-secondary)]"> ({o.deadline})</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Also happening */}
      {n.also_happening.length > 0 && (
        <section>
          <SectionHeading>Also happening</SectionHeading>
          <ul className="space-y-4">
            {n.also_happening.map((a, i) => (
              <li key={i} className="font-body text-[var(--color-text-primary)]">
                {a.category ? <span className="font-ui text-xs uppercase tracking-wide text-[var(--color-accent)] mr-2">{a.category}</span> : null}
                <IssueLink href={a.link_url}><span className="font-semibold">{a.headline}</span></IssueLink>
                {a.blurb ? <span className="block text-[var(--color-text-secondary)] mt-1">{a.blurb}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Elevated welcome bonuses */}
      {n.elevated_bonuses.length > 0 && (
        <section>
          <SectionHeading>Elevated welcome bonuses</SectionHeading>
          <ul className="space-y-2">
            {n.elevated_bonuses.map((b, i) => (
              <li key={i} className="font-body text-[var(--color-text-primary)]">
                <IssueLink href={b.link_url}><span className="font-semibold">{b.card_name}</span></IssueLink>
                {': '}{b.is_tiered ? 'up to ' : ''}{b.current_amount.toLocaleString()} {b.currency}
                {b.spend_required_usd ? ` after $${b.spend_required_usd.toLocaleString()}${b.spend_window_label ? ` in ${b.spend_window_label}` : ''}` : ''}
                {b.deadline ? <span className="text-[var(--color-text-secondary)]"> ({b.deadline})</span> : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Jill's take */}
      {n.jills_take_html && (
        <section>
          <SectionHeading>Jill&apos;s take</SectionHeading>
          <div className="rg-prose" dangerouslySetInnerHTML={{ __html: n.jills_take_html }} />
        </section>
      )}
    </div>
  )
}
