import Link from 'next/link'
import Image from 'next/image'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { Icon } from '@/components/admin/preview/kit'
import ChangeSignalsPanel, { changeSignalsCount } from '../change-signals/ChangeSignalsPanel'
import CardBonusSignalsPanel, { cardBonusSignalsCount } from '../card-bonus-signals/CardBonusSignalsPanel'
import ProgramDriftPanel, { programDriftCount } from '../program-drift/ProgramDriftPanel'
import DataIntegrityPanel, { runDataIntegrity } from '../data-integrity/DataIntegrityPanel'
import RefreshQueuePanel, { refreshQueueCount } from '../refresh-queue/RefreshQueuePanel'

// Always reflect live counts + queues (no caching) so a just-cleared item drops.
export const dynamic = 'force-dynamic'

/**
 * The Accuracy hub — Priya's "is our published data still true?" tools, merged
 * from five separate pages into one tabbed surface (redesign Stage 1, Devon).
 *
 * Each tab renders the RELOCATED body of its old page (…/ChangeSignalsPanel,
 * etc.) — same queries, same server actions, same markup. The old routes still
 * resolve; they now redirect here to their tab. The active tab lives in the URL
 * (?tab=…) so every tab is deep-linkable and bookmarkable.
 */

type TabKey = 'change-signals' | 'card-bonus-signals' | 'program-drift' | 'data-integrity' | 'refresh-queue'

const TABS: { key: TabKey; emoji: string; label: string; action: string }[] = [
  { key: 'change-signals', emoji: '📶', label: 'Change signals', action: 'Verify & dismiss' },
  { key: 'card-bonus-signals', emoji: '🎉', label: 'Welcome-bonus', action: 'Apply or dismiss' },
  { key: 'program-drift', emoji: '🌀', label: 'Program drift', action: 'Verify & resolve' },
  { key: 'data-integrity', emoji: '🛡️', label: 'Data integrity', action: 'Review findings' },
  { key: 'refresh-queue', emoji: '♻️', label: 'Refresh queue', action: 'Re-verify' },
]

export default async function AccuracyHubPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; type?: string }>
}) {
  const sp = await searchParams
  // Header illustration (accuracy shield). Lights up when the file exists; falls
  // back to the shield glyph otherwise — same pattern as the org Ideas box.
  const hasAccArt = existsSync(join(process.cwd(), 'public', 'team', 'accuracy.png'))
  const requested = typeof sp.tab === 'string' ? sp.tab : undefined
  const active: TabKey = (TABS.find((t) => t.key === requested)?.key ?? 'change-signals') as TabKey
  const type = typeof sp.type === 'string' ? sp.type : undefined

  // One pass for every tab's badge. The data-integrity audit is heavy (many
  // queries), so we run it ONCE here and hand the result to its panel below.
  const [csCount, cbCount, pdCount, di, rqCount] = await Promise.all([
    changeSignalsCount(),
    cardBonusSignalsCount(),
    programDriftCount(),
    runDataIntegrity(),
    refreshQueueCount(),
  ])
  const counts: Record<TabKey, number> = {
    'change-signals': csCount,
    'card-bonus-signals': cbCount,
    'program-drift': pdCount,
    'data-integrity': di.findings.length,
    'refresh-queue': rqCount,
  }

  return (
    <div className="acc-hub">
      <style dangerouslySetInnerHTML={{ __html: ACC_CSS }} />

      <header className="acc-head">
        {hasAccArt ? (
          <span className="acc-hero-art">
            <Image src="/team/accuracy.png" alt="" fill sizes="64px" style={{ objectFit: 'cover' }} />
          </span>
        ) : (
          <span className="acc-hero-ic"><Icon name="shield" size={26} /></span>
        )}
        <div className="acc-head-id">
          <h1 className="acc-title">Accuracy</h1>
          <p className="acc-sub">
            Priya&rsquo;s truth layer — one home for every &ldquo;is our published data still true?&rdquo; check.
            Detection only: verify against the issuer&rsquo;s own page, fix, then clear.
          </p>
        </div>
      </header>

      {/* ── Tab bar: name + live count + next-action, deep-linked via ?tab= ── */}
      <nav className="acc-tabs" aria-label="Accuracy tools">
        {TABS.map((t) => {
          const isActive = t.key === active
          const n = counts[t.key]
          return (
            <Link
              key={t.key}
              href={`/admin/accuracy?tab=${t.key}`}
              className={`acc-tab${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              title={`${t.label} — ${t.action}`}
            >
              <span className="acc-tab-row">
                <span className="acc-tab-emoji" aria-hidden="true">{t.emoji}</span>
                <span className="acc-tab-name">{t.label}</span>
                <span className={`acc-tab-count${n > 0 ? ' has' : ''}`}>{n}</span>
              </span>
              <span className="acc-tab-action">{t.action}</span>
            </Link>
          )
        })}
      </nav>

      {/* ── Active panel — the relocated body of the old page ── */}
      <section className="acc-panel">
        {active === 'change-signals' && <ChangeSignalsPanel />}
        {active === 'card-bonus-signals' && <CardBonusSignalsPanel />}
        {active === 'program-drift' && <ProgramDriftPanel />}
        {active === 'data-integrity' && <DataIntegrityPanel result={di} />}
        {active === 'refresh-queue' && <RefreshQueuePanel type={type} />}
      </section>
    </div>
  )
}

const ACC_CSS = `
.admin .acc-hub { max-width: 1000px; }
.admin .acc-head { display: flex; align-items: center; gap: 1.1rem; margin-bottom: 1.25rem; }
.admin .acc-head-id { min-width: 0; }
.admin .acc-hero-art { position: relative; width: 64px; height: 64px; border-radius: 16px; flex-shrink: 0; overflow: hidden; background: radial-gradient(circle at 30% 25%, var(--admin-surface), color-mix(in srgb, var(--color-accent) 20%, var(--admin-surface))); border: 1px solid color-mix(in srgb, var(--color-accent) 38%, var(--admin-border)); box-shadow: 0 10px 24px -14px rgba(212,175,55,.7); }
.admin .acc-hero-ic { display: flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 16px; flex-shrink: 0; color: #8a6d12; background: radial-gradient(circle at 30% 25%, var(--admin-surface), color-mix(in srgb, var(--color-accent) 26%, var(--admin-surface))); border: 1px solid color-mix(in srgb, var(--color-accent) 38%, var(--admin-border)); box-shadow: 0 8px 20px -12px rgba(212,175,55,.7); }
.admin .acc-title { margin: 0; font-family: var(--font-display); font-size: 2rem; font-weight: 800; letter-spacing: -.02em; color: var(--color-primary); }
.admin .acc-sub { margin: .35rem 0 0; max-width: 68ch; font-size: var(--admin-text-sm); color: var(--admin-text-secondary); line-height: 1.55; }

/* Tab bar — wraps on narrow screens (no horizontal overflow at 375px) */
.admin .acc-tabs { display: flex; flex-wrap: wrap; gap: .55rem; margin-bottom: 1.75rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--admin-border); }
.admin .acc-tab {
  display: flex; flex-direction: column; gap: 3px; min-width: 150px; flex: 1 1 150px;
  padding: .6rem .75rem; border-radius: 12px; text-decoration: none;
  background: var(--admin-surface); border: 1px solid var(--admin-border);
  transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease, background .14s ease;
}
.admin .acc-tab:hover { transform: translateY(-1px); border-color: color-mix(in srgb, var(--color-primary) 30%, var(--admin-border)); box-shadow: 0 10px 24px -18px rgba(107,45,143,.5); text-decoration: none; }
.admin .acc-tab.is-active {
  background: color-mix(in srgb, var(--color-primary) 7%, var(--admin-surface));
  border-color: color-mix(in srgb, var(--color-primary) 38%, var(--admin-border));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 22%, transparent);
}
.admin .acc-tab:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.admin .acc-tab-row { display: flex; align-items: center; gap: 7px; }
.admin .acc-tab-emoji { font-size: 1rem; line-height: 1; flex-shrink: 0; }
.admin .acc-tab-name { font-size: var(--admin-text-sm); font-weight: 700; color: var(--admin-text); min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.admin .acc-tab.is-active .acc-tab-name { color: var(--color-primary); }
.admin .acc-tab-count {
  flex-shrink: 0; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: var(--admin-text-xs); font-weight: 800; font-variant-numeric: tabular-nums;
  color: var(--admin-text-subtle); background: var(--admin-surface-alt); border: 1px solid var(--admin-border);
}
.admin .acc-tab-count.has { color: #fff; background: var(--admin-accent, var(--color-primary)); border-color: transparent; }
.admin .acc-tab-action { font-size: var(--admin-text-xs); color: var(--admin-text-subtle); font-weight: 600; padding-left: 23px; }
.admin .acc-tab.is-active .acc-tab-action { color: var(--admin-text-muted); }

@media (max-width: 560px) {
  .admin .acc-tab { flex-basis: 100%; }
}
`
