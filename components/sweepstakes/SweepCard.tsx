import { sweepCategory } from '@/lib/sweepstakes/categories'
import type { SweepRow } from './SweepstakesBrowser'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function endsLabel(ends: string | null): { text: string; soon: boolean } | null {
  if (!ends) return null
  const m = ends.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const month = MONTHS[parseInt(m[2], 10) - 1]
  if (!month) return null
  const days = Math.ceil((Date.parse(`${ends}T23:59:59`) - Date.now()) / 86_400_000)
  return { text: `Ends ${month} ${parseInt(m[3], 10)}`, soon: days >= 0 && days <= 7 }
}

export function enterHref(row: SweepRow): string | null {
  const entry = (row.entry_url ?? '').trim()
  if (/^https?:\/\//i.test(entry) && !entry.endsWith('#')) return entry
  const source = (row.source_url ?? '').trim()
  if (/^https?:\/\//i.test(source)) return source
  return null
}

function mechanicLabel(m: string | null): string | null {
  if (m === 'daily_entry') return 'Enter daily'
  if (m === 'one_time') return 'One-time entry'
  return null
}

/**
 * One sweepstakes card. No hero photos exist for these (image_url is a favicon),
 * so the visual anchor is the CATEGORY COLOR — a colored top strip + faint tint +
 * a colored category pill — plus a bold gold prize line. "Enter now" is the gold
 * accent CTA (not a dark-purple fill).
 */
export default function SweepCard({ sweep }: { sweep: SweepRow }) {
  const cat = sweepCategory(sweep.prize, sweep.title)
  const href = enterHref(sweep)
  const ends = endsLabel(sweep.ends_at)
  const mech = mechanicLabel(sweep.mechanic)
  return (
    <div
      className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] shadow-[var(--shadow-soft)] transition-transform duration-200 hover:-translate-y-1"
      style={{ backgroundColor: `${cat.color}0a` }}
    >
      <div className="h-1.5 w-full" style={{ background: cat.color }} aria-hidden />
      <div className="flex grow flex-col p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {sweep.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sweep.image_url} alt="" width={18} height={18} className="h-[18px] w-[18px] shrink-0 rounded object-contain" />
            )}
            <p className="truncate font-ui text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]">
              {sweep.program}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full border px-2.5 py-0.5 font-ui text-[0.62rem] font-bold uppercase tracking-wide"
            style={{ background: `${cat.color}14`, borderColor: `${cat.color}80`, color: cat.color }}
          >
            {cat.label}
          </span>
        </div>

        <h2 className="mb-2 font-display text-xl leading-snug text-[var(--color-text-primary)]">{sweep.title}</h2>

        {sweep.prize && (
          <p className="mb-3 font-body text-sm text-[var(--color-text-secondary)]">
            Win <span className="font-bold text-[var(--color-accent)]">{sweep.prize}</span>
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          {ends && (
            <span
              className={`inline-block rounded-full px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-wide ${
                ends.soon
                  ? 'bg-[var(--color-accent)] text-[#1A1A1A]'
                  : 'bg-[var(--color-background-soft)] text-[var(--color-primary)]'
              }`}
            >
              {ends.text}
            </span>
          )}
          {mech && (
            <span className="font-ui text-[0.6875rem] uppercase tracking-wide text-[var(--color-text-secondary)]">{mech}</span>
          )}
        </div>

        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="rg-tap-target mt-4 rounded-[var(--radius-ui)] bg-[var(--color-accent)] px-4 py-2.5 text-center font-ui text-sm font-bold uppercase tracking-[0.08em] text-[#1A1A1A] transition-opacity hover:opacity-90"
          >
            Enter now
          </a>
        )}
      </div>
    </div>
  )
}
