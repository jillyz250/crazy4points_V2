import type { ExperienceGroup } from '@/lib/experiences/marquee'

// Short, on-brand program labels (source_platform is verbose, e.g.
// "Delta SkyMiles Experiences"). Falls back to the raw platform string.
const PROGRAM_LABEL: Record<string, string> = {
  amex: 'Amex',
  hyatt: 'World of Hyatt',
  citi: 'Citi',
  atmos: 'Atmos Rewards',
  delta: 'Delta SkyMiles',
  accor: 'ALL Accor',
  'marriott-bonvoy': 'Marriott Bonvoy',
  united: 'United MileagePlus',
  chase: 'Chase',
  hilton: 'Hilton Honors',
  choice: 'Choice Privileges',
  'flying-blue': 'Flying Blue',
  wyndham: 'Wyndham Rewards',
}

function programLabel(g: ExperienceGroup): string {
  return (g.program_slug && PROGRAM_LABEL[g.program_slug]) || g.source_platform || 'Points program'
}

// The one-line "what it costs / how you get it" — points-forward, no derived math.
function priceLine(g: ExperienceGroup): { label: string; tone: 'points' | 'auction' | 'access' } {
  if (g.fromPoints != null) {
    return { label: `From ${g.fromPoints.toLocaleString('en-US')} points`, tone: 'points' }
  }
  if (g.isAuction) return { label: 'Bid with points', tone: 'auction' }
  if (g.format === 'access') return { label: 'Cardholder access', tone: 'access' }
  return { label: 'Redeem or bid', tone: 'points' }
}

// A short city/region from the verbose location string (first 1-2 comma parts).
function shortLocation(loc: string | null): string | null {
  if (!loc) return null
  const parts = loc.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return null
  // drop trailing postal/street noise; keep the recognizable "City, ST/Country"
  const tail = parts.slice(-2)
  return tail.join(', ').replace(/\b\d{4,}\b/g, '').replace(/\s+/g, ' ').trim() || parts[0]
}

export default function ExperienceCard({ group }: { group: ExperienceGroup }) {
  const label = programLabel(group)
  const price = priceLine(group)
  const loc = shortLocation(group.location)
  const dated = group.packages.filter((p) => p.label && p.detail_url)
  const primaryUrl = group.packages.find((p) => p.detail_url)?.detail_url ?? null

  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] shadow-[var(--shadow-soft)] transition-transform duration-200 hover:-translate-y-1">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-background-soft)]">
        {group.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={group.image_url}
            alt={group.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] p-4">
            <span className="text-center font-display text-lg text-white/90">{label}</span>
          </div>
        )}
        {group.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 font-ui text-[0.65rem] uppercase tracking-wide text-white backdrop-blur-sm">
            {group.category}
          </span>
        )}
      </div>

      <div className="flex grow flex-col gap-1.5 p-4">
        <p className="font-ui text-[0.7rem] uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</p>
        <h3 className="line-clamp-2 font-display text-lg leading-snug text-[var(--color-primary)]">{group.title}</h3>
        {loc && <p className="font-body text-sm text-[var(--color-text-secondary)]">{loc}</p>}

        <div className="mt-auto pt-3">
          <p
            className={
              'font-ui text-sm font-semibold ' +
              (price.tone === 'access' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-primary)]')
            }
          >
            {price.label}
          </p>

          {dated.length > 1 ? (
            <div className="mt-2">
              <p className="mb-1 font-ui text-xs text-[var(--color-text-secondary)]">
                {dated.length} dates available:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dated.slice(0, 4).map((p, i) => (
                  <a
                    key={i}
                    href={p.detail_url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rg-tap-target inline-flex items-center rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] px-2.5 py-1 font-ui text-xs text-[var(--color-primary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    {p.label}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            primaryUrl && (
              <a
                href={primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rg-tap-target mt-2 inline-flex items-center font-ui text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)]"
              >
                View on {label} &rarr;
              </a>
            )
          )}
        </div>
      </div>
    </article>
  )
}
