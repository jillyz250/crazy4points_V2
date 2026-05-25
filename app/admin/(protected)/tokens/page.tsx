/**
 * /admin/tokens — Token registry + audit (read-only).
 *
 * Phase A of the intro-token rollout. Surfaces three things:
 *
 *   1. The supported token shapes and their semantics.
 *   2. Live preview: pick a slug, see what each token resolves to right now.
 *   3. Audit: every program intro/sweet_spots/quirks/marquee_pitch that
 *      contains a hardcoded count (e.g. "18 airline transfer partners")
 *      — candidates to migrate to tokens.
 *
 * No mutations on this page. Editor uses it to scope migration work; the
 * actual SQL to rewrite intros happens elsewhere (per-program, by hand,
 * with preview).
 */
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import {
  auditHardcodedCounts,
  findTokenUsages,
  resolveTokensForSlug,
} from '@/utils/programs/auditHardcodedCounts'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

export const dynamic = 'force-dynamic'

const TOKEN_SHAPES: { token: string; resolves: string }[] = [
  {
    token: '{<slug>_airline_count}',
    resolves: "Number of airline (or loyalty-program) partners in <slug>'s transfer_partners_outbound",
  },
  {
    token: '{<slug>_hotel_count}',
    resolves: "Number of hotel partners in <slug>'s transfer_partners_outbound",
  },
  {
    token: '{<slug>_partner_count}',
    resolves: "Total transfer partners in <slug>'s transfer_partners_outbound (any type)",
  },
]

const PREVIEW_DEFAULT_SLUGS = ['amex', 'chase', 'citi', 'capital-one', 'bilt', 'marriott']

export default async function AdminTokensPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>
}) {
  const sp = await searchParams
  const previewSlug = (sp.slug ?? 'amex').toLowerCase()

  const supabase = createAdminClient()
  const [preview, usages, audit] = await Promise.all([
    resolveTokensForSlug(supabase, previewSlug),
    findTokenUsages(supabase),
    auditHardcodedCounts(supabase),
  ])

  // Group audit hits by program for nicer scanning.
  const auditByProgram = new Map<string, { name: string; hits: typeof audit }>()
  for (const hit of audit) {
    const existing = auditByProgram.get(hit.slug)
    if (existing) existing.hits.push(hit)
    else auditByProgram.set(hit.slug, { name: hit.name, hits: [hit] })
  }
  const groupedAudit = [...auditByProgram.entries()].sort(([, a], [, b]) =>
    a.name.localeCompare(b.name),
  )

  return (
    <div>
      <PageHeader
        title="Intro tokens"
        description={
          'Tokens like {amex_airline_count} resolve to live counts at render time. ' +
          'This page is a read-only registry + audit to find hardcoded numbers that should be tokens.'
        }
      />

      {/* ─── Section 1: Supported token shapes ─── */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--admin-text)', marginBottom: '0.5rem' }}>
          Supported tokens
        </h2>
        <Card>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Token shape</th>
                <th>Resolves to</th>
              </tr>
            </thead>
            <tbody>
              {TOKEN_SHAPES.map((t) => (
                <tr key={t.token}>
                  <td>
                    <code style={{ fontSize: '0.875rem' }}>{t.token}</code>
                  </td>
                  <td style={{ color: 'var(--admin-text-muted)' }}>{t.resolves}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
          Unresolved tokens (typo, missing slug) render as empty strings on the public site &mdash; never as the literal{' '}
          <code>{'{...}'}</code> text.
        </p>
      </section>

      {/* ─── Section 2: Live preview ─── */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--admin-text)', marginBottom: '0.5rem' }}>
          Live resolution preview
        </h2>
        <Card>
          <form method="get" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <label htmlFor="slug" style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)' }}>
              Program slug:
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={previewSlug}
              placeholder="amex"
              style={{
                padding: '0.375rem 0.625rem',
                border: '1px solid var(--admin-border)',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                fontFamily: 'inherit',
                minWidth: '12rem',
              }}
            />
            <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">
              Resolve
            </button>
            <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
              Try:{' '}
              {PREVIEW_DEFAULT_SLUGS.map((s, i) => (
                <span key={s}>
                  <Link href={`/admin/tokens?slug=${s}`} style={{ color: 'var(--color-primary)' }}>
                    {s}
                  </Link>
                  {i < PREVIEW_DEFAULT_SLUGS.length - 1 ? ', ' : ''}
                </span>
              ))}
            </span>
          </form>
          {preview === null ? (
            <p style={{ color: 'var(--admin-danger, #b91c1c)', fontSize: '0.875rem' }}>
              No program found with slug <code>{previewSlug}</code>.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>{`{${previewSlug}_airline_count}`}</code></td>
                  <td style={{ fontWeight: 600 }}>{preview.airline_count}</td>
                </tr>
                <tr>
                  <td><code>{`{${previewSlug}_hotel_count}`}</code></td>
                  <td style={{ fontWeight: 600 }}>{preview.hotel_count}</td>
                </tr>
                <tr>
                  <td><code>{`{${previewSlug}_partner_count}`}</code></td>
                  <td style={{ fontWeight: 600 }}>{preview.partner_count}</td>
                </tr>
              </tbody>
            </table>
          )}
        </Card>
      </section>

      {/* ─── Section 3: Currently using tokens ─── */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--admin-text)', marginBottom: '0.5rem' }}>
          Currently using tokens <Badge tone="success">{usages.length}</Badge>
        </h2>
        {usages.length === 0 ? (
          <EmptyState
            title="No programs using tokens yet"
            description="Add tokens to a program's intro / sweet_spots / quirks / marquee_pitch to see them here."
          />
        ) : (
          <Card>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Field</th>
                  <th>Tokens</th>
                </tr>
              </thead>
              <tbody>
                {usages.map((u, i) => (
                  <tr key={`${u.slug}-${u.field}-${i}`}>
                    <td style={{ fontWeight: 500 }}>
                      <Link href={`/admin/programs/${u.slug}/edit`} style={{ color: 'var(--color-primary)' }}>
                        {u.name}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--admin-text-muted)' }}>{u.field}</td>
                    <td>
                      {u.tokens.map((t) => (
                        <code key={t} style={{ marginRight: '0.5rem', fontSize: '0.8125rem' }}>
                          {t}
                        </code>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      {/* ─── Section 4: Migration candidates (audit) ─── */}
      <section>
        <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--admin-text)', marginBottom: '0.5rem' }}>
          Hardcoded counts (migration candidates) <Badge tone="warning">{audit.length}</Badge>
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', marginBottom: '0.75rem' }}>
          Patterns like &ldquo;18 airline&rdquo;, &ldquo;3 hotel&rdquo;, &ldquo;21 transfer partners&rdquo; found in editorial copy.
          Each is a candidate to replace with a token. False positives are expected &mdash; this is a starting point, not a to-do list.
        </p>
        {groupedAudit.length === 0 ? (
          <EmptyState title="No hardcoded counts found" description="Either every count is already a token, or the detector missed something." />
        ) : (
          <Card>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Field</th>
                  <th>Match</th>
                  <th>Sentence</th>
                </tr>
              </thead>
              <tbody>
                {groupedAudit.flatMap(([slug, { name, hits }]) =>
                  hits.map((hit, hi) => (
                    <tr key={`${slug}-${hit.field}-${hi}`}>
                      <td style={{ fontWeight: 500 }}>
                        {hi === 0 ? (
                          <Link href={`/admin/programs/${slug}/edit`} style={{ color: 'var(--color-primary)' }}>
                            {name}
                          </Link>
                        ) : (
                          <span style={{ color: 'var(--admin-text-muted)' }}>↳</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{hit.field}</td>
                      <td><code style={{ fontSize: '0.8125rem' }}>{hit.match}</code></td>
                      <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>
                        &ldquo;{hit.context.slice(0, 160)}{hit.context.length > 160 ? '…' : ''}&rdquo;
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  )
}
