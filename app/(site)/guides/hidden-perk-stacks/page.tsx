import type { Metadata } from 'next'
import Link from 'next/link'
import { GuideDateline } from '@/components/guides/GuideDateline'
import { GuideJsonLd } from '@/components/guides/GuideJsonLd'
import GuideNewsletterCTA from '@/components/guides/GuideNewsletterCTA'
import { PERK_CHAINS } from '@/lib/perkChains'

export const metadata: Metadata = {
  title: 'Hidden Perk Stacks: Card Benefits That Unlock More Benefits',
  description:
    'The tricks nobody tells you: one card credit unlocks a service that bundles even more, from free streaming to instant hotel status to the two fastest airport lanes.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/hidden-perk-stacks' },
  openGraph: {
    title: 'Hidden Perk Stacks: Card Benefits That Unlock More Benefits',
    description:
      'One card credit can unlock a service that bundles even more. Here are the perk chains most people never notice.',
    url: 'https://www.crazy4points.com/guides/hidden-perk-stacks',
    type: 'article',
    siteName: 'crazy4points',
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 86400

const h2 = 'mt-12 font-display text-2xl font-semibold text-[var(--color-primary)]'
const p = 'mt-4 font-body text-[var(--color-text-primary)]'

function Callout({ children, tone = 'soft' }: { children: React.ReactNode; tone?: 'soft' | 'warn' }) {
  const border = tone === 'warn' ? 'var(--color-accent)' : 'var(--color-primary)'
  return (
    <div
      style={{
        background: 'var(--color-background-soft)',
        border: '1px solid var(--color-border-soft)',
        borderLeft: `4px solid ${border}`,
        borderRadius: 'var(--radius-card)',
        padding: '1rem 1.25rem',
        margin: '1.25rem 0',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-text-primary)',
        lineHeight: 1.55,
      }}
    >
      {children}
    </div>
  )
}

export default function HiddenPerkStacksGuide() {
  return (
    <main className="rg-major-section">
      <div className="rg-container rg-guide" style={{ maxWidth: '60rem' }}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
          Cards & Points
        </span>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          Hidden Perk Stacks: Card Benefits That Unlock More Benefits
        </h1>
        <GuideDateline slug="hidden-perk-stacks" />
        <GuideJsonLd slug="hidden-perk-stacks" />

        <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">
          Most people use a card benefit for exactly what it says on the tin. The real trick is noticing when
          one perk quietly unlocks another, and then another. A single monthly credit can end up handing you a
          free streaming service. A hotel status you got for nothing can carry car-rental status with it. Here
          are the chains hiding in plain sight.
        </p>

        <Callout tone="warn">
          <strong>Read this first.</strong>{' '}
          Every chain below was verified against the issuer&rsquo;s own terms on the date shown, but card
          credits and bundled perks change constantly. Treat these as a map, not a guarantee, and confirm the
          current terms on the issuer&rsquo;s page before you count on one.
        </Callout>

        {PERK_CHAINS.map((chain) => (
          <section
            key={chain.id}
            style={{
              marginTop: '1.5rem',
              background: 'var(--color-background)',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-card)',
              padding: '1.25rem 1.35rem 1.4rem',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.5rem 0.75rem' }}>
              <h2 className="font-display" style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600, color: 'var(--color-primary)', flex: '1 1 16rem' }}>
                {chain.title}
              </h2>
              {chain.cardSlug ? (
                <Link
                  href={`/cards/${chain.cardSlug}`}
                  className="font-ui"
                  style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)', textDecoration: 'underline', textUnderlineOffset: '3px', whiteSpace: 'nowrap' }}
                >
                  {chain.card}
                </Link>
              ) : (
                <span className="font-ui" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                  {chain.card}
                </span>
              )}
            </div>

            <ol style={{ listStyle: 'none', margin: '0.9rem 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {chain.steps.map((step, i) => (
                <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span
                    className="font-ui"
                    aria-hidden="true"
                    style={{
                      flex: '0 0 auto',
                      display: 'grid',
                      placeItems: 'center',
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: '999px',
                      background: i === chain.steps.length - 1 ? 'var(--color-primary)' : 'var(--color-background-soft)',
                      border: '1px solid var(--color-border-soft)',
                      color: i === chain.steps.length - 1 ? '#fff' : 'var(--color-text-secondary)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  >
                    {i === chain.steps.length - 1 ? '→' : i + 1}
                  </span>
                  <span className="font-body" style={{ flex: 1, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>{step}</span>
                </li>
              ))}
            </ol>

            <div
              style={{
                marginTop: '0.9rem',
                background: 'var(--color-background-soft)',
                borderLeft: '4px solid var(--color-accent)',
                borderRadius: '0 var(--radius-ui) var(--radius-ui) 0',
                padding: '0.6rem 0.9rem',
              }}
            >
              <span className="font-ui" style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-accent)' }}>
                The payoff
              </span>
              <p className="font-body" style={{ margin: '0.1rem 0 0', color: 'var(--color-text-primary)', fontWeight: 600 }}>{chain.payoff}</p>
            </div>

            {chain.caveat && (
              <p className="font-body" style={{ marginTop: '0.7rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>The catch:</strong> {chain.caveat}
              </p>
            )}

            <p className="font-ui" style={{ marginTop: '0.7rem', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
              Verified {chain.verifiedAt} · {chain.source}
            </p>
          </section>
        ))}

        <h2 className={h2}>The multiplier: status matching</h2>
        <p className={p}>
          Here is the move that turns one perk into many. A status you already hold, even one you got free from
          a card, can often be <strong>matched</strong> into a different program at no cost. Hotel chains,
          airlines, and even casinos regularly run status-match or status-challenge offers to poach loyal
          customers, so the Gold status your card handed you can become status somewhere new.
        </p>
        <p className={p}>
          Some statuses even carry their own linked perk automatically. IHG One Rewards Diamond members, for
          example, get Hertz car-rental status without lifting a finger. The lesson: before you chase a status
          the hard way, check whether one you already have can be matched or linked into it for free.
        </p>
        <Callout>
          <strong>How to use it.</strong>{' '}
          Match offers come and go, so when you want a specific status, search &ldquo;[program] status
          match&rdquo; and see what is live right now. And never let a status sit unused, matching it onward is
          often free.
        </Callout>

        <h2 className={h2}>The one habit that makes all of this work</h2>
        <p className={p}>
          Read your card&rsquo;s benefits list once a year and ask a different question than most people do. Not
          just &ldquo;what does this credit buy?&rdquo; but &ldquo;what does the thing it buys <em>include</em>?&rdquo;
          That second question is where the free streaming, the bonus status, and the stacked airport lanes
          hide. The card is the key; the chain is the treasure.
        </p>

        <div
          style={{
            marginTop: '1.5rem',
            background: 'var(--color-background-soft)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
            padding: '1.25rem 1.4rem',
          }}
        >
          <p className="font-body" style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            <strong>Want the card details?</strong>{' '}
            Every card above has a full breakdown on our card pages, and if you are just getting started, our
            beginner guides walk you through the basics first.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.9rem' }}>
            <Link href="/cards" className="rg-btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Browse cards
            </Link>
            <Link href="/guides" className="rg-btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              Start with the guides
            </Link>
          </div>
        </div>

        <p className="mt-10 font-body text-sm text-[var(--color-text-secondary)]">
          Benefits and credits are set by the card issuers and partners, and change often. Confirm current terms
          on the issuer&rsquo;s official page before relying on any perk. Browse all{' '}
          <Link href="/guides" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
            guides
          </Link>
          .
        </p>
        <GuideNewsletterCTA />
      </div>
    </main>
  )
}
