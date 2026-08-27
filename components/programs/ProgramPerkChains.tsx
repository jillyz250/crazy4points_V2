import Link from 'next/link'
import type { PerkChain } from '@/lib/perkChains'

/**
 * "Chain Reactions" section for a program page — renders the perk chains that
 * touch this program (from lib/perkChains.ts via perkChainsForProgram). A chain
 * is our differentiator: one thing (a card, a status, a phone plan) quietly
 * unlocks several stacked perks. Links out to the full Chain Reactions guide.
 */
export default function ProgramPerkChains({ chains }: { chains: PerkChain[] }) {
  if (!chains.length) return null
  return (
    <section id="chain-reactions" className="mb-10" style={{ scrollMarginTop: '2rem' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--color-primary)',
          marginBottom: '0.5rem',
          marginTop: '1rem',
        }}
      >
        Chain Reactions
      </h2>
      <p className="mb-4 font-body text-sm text-[var(--color-text-secondary)]">
        One thing quietly unlocking several perks. Here are the chains that touch this program.
      </p>
      <div className="flex flex-col gap-4">
        {chains.map((c) => (
          <div
            key={c.id}
            className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)]"
          >
            <h3 className="font-display text-lg font-semibold text-[var(--color-primary)]">{c.title}</h3>
            <p className="mt-1 font-ui text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Starts with: {c.card}
            </p>
            <ol className="mt-3 flex flex-col gap-2">
              {c.steps.map((s, i) => (
                <li key={i} className="flex gap-2 font-body text-sm text-[var(--color-text-secondary)]">
                  <span className="font-ui text-xs font-bold text-[var(--color-accent)]">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 font-body text-sm font-semibold text-[var(--color-text-primary)]">{c.payoff}</p>
            {c.caveat && (
              <p className="mt-2 font-body text-xs leading-relaxed text-[var(--color-text-secondary)] opacity-80">
                <span className="font-semibold">Catch:</span> {c.caveat}
              </p>
            )}
            <p className="mt-2 font-ui text-[0.7rem] uppercase tracking-wide text-[var(--color-text-secondary)] opacity-70">
              Source: {c.source} · verified {c.verifiedAt}
            </p>
          </div>
        ))}
      </div>
      <Link
        href="/guides/hidden-perk-stacks"
        className="mt-4 inline-block font-ui text-xs font-semibold text-[var(--color-primary)] underline decoration-[var(--color-border-soft)] underline-offset-2 hover:decoration-[var(--color-primary)]"
      >
        See all Chain Reactions &rarr;
      </Link>
    </section>
  )
}
