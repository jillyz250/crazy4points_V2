import { createAdminClient } from '@/utils/supabase/server'
import {
  getPendingPromos,
  getApprovedPromos,
  getRecentReviewedPromos,
  getRecentScrapeRuns,
} from '@/utils/supabase/promoQueries'
import type { PromoReward, ScrapeRun } from '@/utils/supabase/promoQueries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { Badge } from '@/components/admin/ui/Badge'
import RunPromoScrapersButton from '@/components/admin/RunPromoScrapersButton'
import { runScrapersNowAction } from './actions'

export const dynamic = 'force-dynamic'

/**
 * Promo Intelligence Engine — admin queue (Phase 0 stub).
 *
 * Renders pending / approved / recently-reviewed promos. Phase 1 will
 * add approve / reject / publish actions; this page is read-only for
 * now while the schema + scraper foundation lands.
 */
export default async function PromosAdminPage() {
  const supabase = createAdminClient()
  let pending: PromoReward[] = []
  let approved: PromoReward[] = []
  let recent: PromoReward[] = []
  let runs: ScrapeRun[] = []
  let loadError: string | null = null

  try {
    pending = await getPendingPromos(supabase, 50)
    approved = await getApprovedPromos(supabase, 50)
    recent = await getRecentReviewedPromos(supabase, 20)
    runs = await getRecentScrapeRuns(supabase, 20)
  } catch (err) {
    console.error('[admin/promos] load failed', err)
    loadError = err instanceof Error ? err.message : String(err)
  }

  return (
    <div>
      <PageHeader
        title="Promo Queue"
        description="Scraped promo deals awaiting review. Nothing renders on the public site until approved + published."
      />

      <div style={{ marginBottom: '1.5rem' }}>
        <RunPromoScrapersButton action={runScrapersNowAction} />
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
          Runs every scraper config in <code>lib/scrapers/</code> immediately. The
          daily cron still runs at 11:00 UTC — this button is for ad-hoc runs.
        </p>
      </div>

      {loadError && (
        <Card>
          <p className="admin-text-danger" style={{ margin: 0 }}>
            Failed to load promos: {loadError}
          </p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
            If Migration 251 has not been applied yet, this is expected — the
            tables don&apos;t exist. Apply the migration and the page will
            populate.
          </p>
        </Card>
      )}

      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Pending review ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <EmptyState
            title="Nothing pending"
            description="When the scraper runs and finds new promos, they'll land here for your review."
          />
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {pending.map((p) => (
              <PromoRow key={p.id} promo={p} />
            ))}
          </div>
        )}
      </section>

      {approved.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Approved, unpublished ({approved.length})
          </h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {approved.map((p) => (
              <PromoRow key={p.id} promo={p} />
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Recently reviewed ({recent.length})
          </h2>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {recent.map((p) => (
              <PromoRow key={p.id} promo={p} compact />
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Recent scraper runs ({runs.length})
        </h2>
        {runs.length === 0 ? (
          <EmptyState
            title="No scraper runs yet"
            description="Run scripts/run-scraper.mjs to populate this page."
          />
        ) : (
          <Card>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Scraper</th>
                  <th>Status</th>
                  <th>Seen</th>
                  <th>New</th>
                  <th>Updated</th>
                  <th>Gone</th>
                  <th>Credits</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td><code style={{ fontSize: '0.75rem' }}>{r.scraper_slug}</code></td>
                    <td>
                      <Badge tone={r.status === 'success' ? 'success' : r.status === 'partial' ? 'warning' : 'danger'}>
                        {r.status}
                      </Badge>
                    </td>
                    <td>{r.items_seen ?? '—'}</td>
                    <td>{r.items_new ?? '—'}</td>
                    <td>{r.items_updated ?? '—'}</td>
                    <td>{r.items_disappeared ?? '—'}</td>
                    <td>{r.firecrawl_credits_used ?? '—'}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                      {new Date(r.ran_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  )
}

function PromoRow({ promo, compact = false }: { promo: PromoReward; compact?: boolean }) {
  const route =
    promo.origin_iata && promo.dest_iata
      ? `${promo.origin_iata} → ${promo.dest_iata}`
      : promo.origin_label && promo.dest_label
        ? `${promo.origin_label} → ${promo.dest_label}`
        : promo.dest_label
          ? `to ${promo.dest_label}`
          : '(no route)'

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: compact ? 0 : '0.25rem' }}>
        {promo.intel_type && <Badge tone="accent">{promo.intel_type.replace(/_/g, ' ')}</Badge>}
        <Badge tone={promo.admin_status === 'published' ? 'success' : promo.admin_status === 'rejected' ? 'danger' : 'warning'}>
          {promo.admin_status}
        </Badge>
        {promo.intel_value_score != null && (
          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            score {promo.intel_value_score}
          </span>
        )}
        {promo.intel_discount_percent != null && (
          <span style={{ fontSize: '0.75rem', color: 'var(--admin-success)' }}>
            -{promo.intel_discount_percent}%
          </span>
        )}
        {!promo.last_seen_active && (
          <Badge tone="neutral">No longer on source</Badge>
        )}
      </div>
      <div style={{ fontSize: '0.9375rem', fontWeight: 500 }}>
        {route}
        {promo.cabin && <span style={{ color: 'var(--admin-text-muted)' }}> · {promo.cabin}</span>}
        {promo.points_required != null && (
          <span> · <strong>{promo.points_required.toLocaleString()}</strong> miles</span>
        )}
        {promo.intel_inferred_baseline != null && (
          <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8125rem' }}>
            {' '}(baseline ~{promo.intel_inferred_baseline.toLocaleString()})
          </span>
        )}
      </div>
      {!compact && promo.promo_label && (
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
          {promo.promo_label}
        </p>
      )}
      {!compact && (
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.6875rem', color: 'var(--admin-text-subtle)' }}>
          Source:{' '}
          <a href={promo.source_url} target="_blank" rel="noopener noreferrer">
            {new URL(promo.source_url).hostname}
          </a>
          {' · '}
          Scraped {new Date(promo.last_scraped_at).toLocaleString()}
          {promo.valid_to && ` · Valid through ${promo.valid_to}`}
        </p>
      )}
    </Card>
  )
}
