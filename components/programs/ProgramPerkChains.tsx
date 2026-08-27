import Link from 'next/link'
import type { PerkChain } from '@/lib/perkChains'

/**
 * "Chain Reactions" section for a program page — renders the perk chains that
 * touch this program (from lib/perkChains.ts via perkChainsForProgram). Our
 * differentiator: one thing (a card, a status, a phone plan) quietly unlocks
 * several stacked perks. Rendered as a visual chain — a connected cascade of
 * numbered nodes dropping into the payoff — so the "reaction" reads at a glance.
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
            className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]"
          >
            {/* Header: the spark */}
            <div className="border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-5">
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-lg">🔗</span>
                <span className="font-ui text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--color-accent)]">
                  Starts with {c.card}
                </span>
              </div>
              <h3 className="mt-1 font-display text-lg font-semibold text-[var(--color-primary)]">{c.title}</h3>
            </div>

            {/* The chain: numbered nodes on a connecting rail */}
            <div className="p-5">
              <ol className="relative flex flex-col gap-4 pl-2">
                {/* the rail */}
                <span
                  aria-hidden
                  className="absolute bottom-4 left-[14px] top-3 w-0.5 bg-[var(--color-border-soft)]"
                />
                {c.steps.map((s, i) => (
                  <li key={i} className="relative flex items-start gap-3">
                    <span className="relative z-10 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[var(--color-accent)] font-ui text-xs font-bold text-[#1A1A1A]">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 font-body text-sm text-[var(--color-text-secondary)]">{s}</span>
                  </li>
                ))}
              </ol>

              {/* The payoff */}
              <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-ui)] bg-[var(--color-primary)] p-4">
                <span aria-hidden className="text-lg">🎉</span>
                <p className="font-body text-sm font-semibold text-white">{c.payoff}</p>
              </div>

              {c.caveat && (
                <p className="mt-3 font-body text-xs leading-relaxed text-[var(--color-text-secondary)] opacity-80">
                  <span className="font-semibold">Catch:</span> {c.caveat}
                </p>
              )}
              <p className="mt-2 font-ui text-[0.7rem] uppercase tracking-wide text-[var(--color-text-secondary)] opacity-70">
                Source: {c.source} · verified {c.verifiedAt}
              </p>
            </div>
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
