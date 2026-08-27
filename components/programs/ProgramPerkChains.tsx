import Link from 'next/link'
import type { PerkChain } from '@/lib/perkChains'

/** Render the title with the word "unlocks" highlighted in gold italic. */
function ChainTitle({ title }: { title: string }) {
  const parts = title.split(/(unlocks)/i)
  return (
    <h3
      className="font-display"
      style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.15, margin: 0 }}
    >
      {parts.map((p, i) =>
        /^unlocks$/i.test(p) ? (
          <span key={i} style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </h3>
  )
}

function ChainCard({ c }: { c: PerkChain }) {
  const offsets = ['ml-0', 'ml-4', 'ml-8', 'ml-12']
  return (
    <div className="overflow-hidden rounded-[16px] border border-[var(--color-border-soft)] bg-[var(--color-background)] shadow-[0_4px_14px_rgba(26,26,26,0.05)]">
      <div className="p-[17px]">
        <div className="mb-[11px] flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-[11px] py-1 font-ui text-[0.62rem] font-extrabold uppercase tracking-wide text-[var(--color-primary)]">
            🔗 {c.card}
          </span>
          <span className="font-ui text-[0.58rem] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)] opacity-70">
            {c.steps.length} perk{c.steps.length === 1 ? '' : 's'}
          </span>
        </div>

        <ChainTitle title={c.title} />

        {c.action && (
          <>
            <p className="mb-[5px] mt-[13px] font-ui text-[0.56rem] font-extrabold uppercase tracking-[0.11em] text-[var(--color-accent)]">
              Set it up once
            </p>
            <div className="flex items-center gap-[10px] rounded-[12px] border-2 border-dashed border-[var(--color-accent)] bg-[#fffdf4] p-[11px]">
              <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-[var(--color-accent)] font-ui text-[0.95rem] font-extrabold text-[#1A1A1A]">
                ✓
              </span>
              <span className="font-body text-[0.76rem] font-semibold leading-snug text-[var(--color-text-primary)]">{c.action}</span>
            </div>
            <div className="my-[11px] text-center">
              <span className="inline-flex items-center gap-[6px] rounded-full bg-[var(--color-primary)] px-[15px] py-[6px] font-ui text-[0.64rem] font-black uppercase tracking-[0.12em] text-white shadow-[0_3px_8px_rgba(107,45,143,0.32)]">
                ⚡ Unlocks
              </span>
            </div>
          </>
        )}

        <div className={`flex flex-col gap-[7px] ${c.action ? '' : 'mt-3'}`}>
          {c.steps.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-[10px] rounded-[11px] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-[10px] font-body text-[0.75rem] text-[var(--color-text-secondary)] shadow-[2px_3px_0_var(--color-border-soft)] ${offsets[Math.min(i, 3)]}`}
            >
              <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] text-[0.95rem] font-bold text-[var(--color-primary)]">
                {c.stepIcons?.[i] ?? i + 1}
              </span>
              <span>{s}</span>
            </div>
          ))}
        </div>

        <div className="mt-[12px] flex items-center gap-2 rounded-[12px] bg-[var(--color-primary)] p-[12px] font-body text-[0.78rem] font-bold text-white">
          <span className="text-[1.2rem] leading-none">🎉</span>
          <span>{c.payoff}</span>
        </div>

        {c.caveat && (
          <p className="mt-[9px] font-body text-[0.64rem] leading-relaxed text-[var(--color-text-secondary)] opacity-75">
            <span className="font-semibold">Catch:</span> {c.caveat}
          </p>
        )}
        <p className="mt-1 font-ui text-[0.62rem] uppercase tracking-wide text-[var(--color-text-secondary)] opacity-60">
          Source: {c.source} · verified {c.verifiedAt}
        </p>
      </div>
    </div>
  )
}

/**
 * "Chain Reactions" section for a program page — one thing (a card, a status, a
 * phone plan) quietly unlocking several stacked perks, rendered as a set-up-once
 * action card that ⚡ Unlocks a cascade of perks into a payoff.
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
