'use client';

import { useActionState, useEffect, useState } from 'react';
import { BLOG_CATEGORIES, getBlogCategoryLabel } from '@/lib/blog/categories';
import {
  updateContentIdeaBlogFieldsAction,
  type BlogFieldsResult,
} from '@/app/admin/(protected)/content-ideas/actions';

interface ProgramOption {
  id: string;
  slug: string;
  name: string;
}

interface IdeaSnapshot {
  id: string;
  status: string;
  category: string | null;
  excerpt: string | null;
  hero_image_url: string | null;
  primary_program_slug: string | null;
  secondary_program_slugs: string[] | null;
  card_slugs: string[] | null;
  reading_time_minutes: number | null;
  featured: boolean | null;
  featured_rank: number | null;
}

interface Props {
  idea: IdeaSnapshot;
  programs: ProgramOption[];
  /**
   * Auto-suggested primary program slug — derived from the idea's source
   * alert's linked programs upstream. Used as the default when the user
   * hasn't set one yet.
   */
  suggestedProgramSlug?: string | null;
}

export default function BlogMetadataForm({ idea, programs, suggestedProgramSlug }: Props) {
  const boundAction = updateContentIdeaBlogFieldsAction.bind(null, idea.id);
  const [state, formAction, isPending] = useActionState<BlogFieldsResult | null, FormData>(
    boundAction,
    null
  );

  // Show the "Saved ✓" pill for 3 seconds after a successful save, then fade.
  const [showSavedFlash, setShowSavedFlash] = useState(false);
  useEffect(() => {
    if (state?.ok) {
      setShowSavedFlash(true);
      const t = setTimeout(() => setShowSavedFlash(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state]);

  const summary = idea.category
    ? `${getBlogCategoryLabel(idea.category)}${idea.featured ? ' · Featured' : ''}`
    : 'Blog metadata — set before publish';

  // Default the program select to: explicit value > suggestion > nothing.
  const defaultProgramSlug = idea.primary_program_slug || suggestedProgramSlug || '';

  return (
    <details
      style={{ marginBottom: '0.5rem' }}
      open={!idea.category && idea.status !== 'new'}
    >
      <summary
        style={{
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-ui)',
          color: idea.category ? 'var(--admin-text-muted)' : '#b45309',
        }}
      >
        {idea.category ? '✓ ' : '⚠ '}
        Blog metadata: {summary}
      </summary>

      <form
        action={formAction}
        style={{
          marginTop: '0.5rem',
          display: 'grid',
          gap: '0.5rem',
          padding: '0.625rem',
          background: 'var(--admin-surface-alt)',
          borderRadius: 'var(--admin-radius)',
          border: '1px solid var(--admin-border)',
        }}
      >
        <Field label="Category (required to publish)">
          <select
            name="category"
            defaultValue={idea.category ?? ''}
            className="admin-input"
            style={{ width: '100%' }}
          >
            <option value="">— none —</option>
            {BLOG_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Excerpt (public dek; falls back to pitch if blank)">
          <textarea
            name="excerpt"
            defaultValue={idea.excerpt ?? ''}
            placeholder="200 chars max — appears under the headline"
            rows={2}
            className="admin-input"
            style={{ width: '100%', resize: 'vertical' }}
          />
        </Field>

        <Field label="Hero image URL (optional; branded card used if blank)">
          <input
            type="url"
            name="hero_image_url"
            defaultValue={idea.hero_image_url ?? ''}
            placeholder="https://…"
            className="admin-input"
            style={{ width: '100%' }}
          />
        </Field>

        <Field
          label={
            suggestedProgramSlug && !idea.primary_program_slug
              ? `Primary program (auto-suggested: ${
                  programs.find((p) => p.slug === suggestedProgramSlug)?.name ?? suggestedProgramSlug
                })`
              : 'Primary program (optional)'
          }
        >
          <select
            name="primary_program_slug"
            defaultValue={defaultProgramSlug}
            className="admin-input"
            style={{ width: '100%' }}
          >
            <option value="">— none —</option>
            {programs.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Additional programs (comma-separated slugs — for multi-program articles)">
          <input
            type="text"
            name="secondary_program_slugs"
            defaultValue={(idea.secondary_program_slugs ?? []).join(', ')}
            placeholder="e.g. hyatt, amex"
            className="admin-input"
            style={{ width: '100%' }}
            autoComplete="off"
          />
          <span style={{ fontSize: '0.6875rem', color: 'var(--admin-text-muted)' }}>
            For comparison or stacking pieces (Chase + Hyatt, Amex + Aeroplan).
            Each slug pulls that program's data into fact-check + writer source.
            Use the same slugs from the dropdown above (e.g. <code>hyatt</code>, <code>chase</code>).
          </span>
        </Field>

        <Field label="Card slugs (comma-separated — for card-comparison articles)">
          <input
            type="text"
            name="card_slugs"
            defaultValue={(idea.card_slugs ?? []).join(', ')}
            placeholder="e.g. chase-world-of-hyatt, chase-world-of-hyatt-business"
            className="admin-input"
            style={{ width: '100%' }}
            autoComplete="off"
          />
          <span style={{ fontSize: '0.6875rem', color: 'var(--admin-text-muted)' }}>
            Each slug pulls that card's <code>/cards/[slug]</code> content into the
            writer + fact-checker as authoritative source. Use this for any
            card-comparison or card-deep-dive article. Slugs match the URL —
            e.g. <code>chase-world-of-hyatt</code>.
          </span>
        </Field>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-ui)',
            }}
          >
            <input
              type="checkbox"
              name="featured"
              defaultChecked={idea.featured ?? false}
            />
            Featured (pins to top of /blog)
          </label>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-ui)',
            }}
          >
            <span style={{ color: 'var(--admin-text-muted)' }}>Rank</span>
            <input
              type="number"
              name="featured_rank"
              defaultValue={idea.featured_rank ?? ''}
              placeholder="1"
              min={0}
              className="admin-input"
              style={{ width: '4rem' }}
            />
          </label>
          {idea.reading_time_minutes !== null && (
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
              · Reading time: {idea.reading_time_minutes} min
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={isPending}
            className="admin-btn admin-btn-primary admin-btn-sm"
            style={{ alignSelf: 'flex-start' }}
          >
            {isPending ? 'Saving…' : 'Save blog metadata'}
          </button>

          {showSavedFlash && state?.ok && (
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-ui)',
                fontWeight: 600,
                color: '#15803d',
                background: '#dcfce7',
                border: '1px solid #86efac',
                borderRadius: '999px',
                padding: '0.1875rem 0.625rem',
              }}
            >
              ✓ Saved
            </span>
          )}

          {state && !state.ok && (
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-ui)',
                fontWeight: 600,
                color: '#b91c1c',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: 'var(--admin-radius)',
                padding: '0.25rem 0.625rem',
              }}
            >
              {state.error}
            </span>
          )}
        </div>
      </form>
    </details>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <span style={{ color: 'var(--admin-text-muted)' }}>{label}</span>
      {children}
    </label>
  );
}
