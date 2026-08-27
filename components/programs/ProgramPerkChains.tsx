import Link from 'next/link'
import type { PerkChain } from '@/lib/perkChains'
import ChainCard from '@/components/chains/ChainCard'

/**
 * "Chain Reactions" section for a program page — the chains that touch this
 * program, each rendered as a set-up-once action that ⚡ Unlocks a cascade of
 * perks. Uses the shared ChainCard so it matches the Chain Reactions guide.
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
      <div className="grid gap-4 sm:grid-cols-2">
        {chains.map((c) => (
          <ChainCard key={c.id} c={c} />
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
