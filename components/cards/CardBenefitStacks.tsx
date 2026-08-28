import { networkPerksForCard, type NetworkPerk } from '@/lib/networkPerks'
import { perkChainsForCard } from '@/lib/perkChains'
import ChainCard from '@/components/chains/ChainCard'

/** "World Elite Mastercard" from network + level codes. */
function networkLabel(network: string, level: string | null | undefined): string {
  const net = network.charAt(0).toUpperCase() + network.slice(1)
  const lvl = (level ?? '')
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  return lvl ? `${lvl} ${net}` : net
}

/** One network-level perk, rendered as a simple sourced benefit card (not a chain). */
function NetworkPerkCard({ p, label }: { p: NetworkPerk; label: string }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[var(--color-border-soft)] bg-[var(--color-background)] shadow-[0_4px_14px_rgba(26,26,26,0.05)]">
      <div className="p-[17px]">
        <div className="mb-[11px] flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-[11px] py-1 font-ui text-[0.62rem] font-extrabold uppercase tracking-wide text-[var(--color-primary)]">
            🌐 {label}
          </span>
          <span className="font-ui text-[0.58rem] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)] opacity-70">
            Network perk
          </span>
        </div>

        <h3 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.15, margin: 0 }}>
          {p.title}
        </h3>

        <div className="mt-3 flex flex-col gap-[7px]">
          {p.perks.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-[10px] rounded-[11px] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-[10px] font-body text-[0.75rem] leading-snug text-[var(--color-text-secondary)] shadow-[2px_3px_0_var(--color-border-soft)]"
            >
              <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[9px] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] text-[0.9rem] font-bold text-[var(--color-primary)]">
                {i + 1}
              </span>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {p.payoff && (
          <div className="mt-[12px] flex items-center gap-2 rounded-[12px] bg-[var(--color-primary)] p-[12px] font-body text-[0.78rem] font-bold text-white">
            <span className="text-[1.2rem] leading-none">🎉</span>
            <span>{p.payoff}</span>
          </div>
        )}

        {p.caveat && (
          <p className="mt-[9px] font-body text-[0.64rem] leading-relaxed text-[var(--color-text-secondary)] opacity-75">
            <span className="font-semibold">Catch:</span> {p.caveat}
          </p>
        )}
        {/* Reader-facing link to the issuer terms (when we have one). The internal
            source label + verified date stay in the data for our re-verification,
            not rendered — a stale "verified" date reads as neglect, not trust. */}
        {p.sourceUrl && (
          <a
            href={p.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-ui text-[0.66rem] font-semibold text-[var(--color-primary)] underline underline-offset-2"
          >
            See the official terms →
          </a>
        )}
      </div>
    </div>
  )
}

/**
 * "Benefit stacks" for a card: the network-level perks it inherits (Mastercard
 * World Elite, etc.) plus any perk chain that starts from this specific card.
 * One definition each in lib/networkPerks.ts / lib/perkChains.ts, rendered here.
 * Renders nothing when the card has neither.
 */
export default function CardBenefitStacks({
  network,
  networkLevel,
  cardSlug,
  today,
}: {
  network: string | null | undefined
  networkLevel: string | null | undefined
  cardSlug: string
  today?: string
}) {
  const perks = networkPerksForCard(network, networkLevel, today)
  const chains = perkChainsForCard(cardSlug)
  if (perks.length === 0 && chains.length === 0) return null
  const label = network ? networkLabel(network, networkLevel) : ''

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>Perks worth knowing</h2>
      <p className="font-body" style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem', maxWidth: '46rem' }}>
        Extra value that rides along with this card, from its network and from benefits that unlock more.
      </p>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(19rem, 100%), 1fr))' }}>
        {perks.map((p) => (
          <NetworkPerkCard key={p.id} p={p} label={label} />
        ))}
        {chains.map((c) => (
          <ChainCard key={c.id} c={c} />
        ))}
      </div>
    </section>
  )
}
