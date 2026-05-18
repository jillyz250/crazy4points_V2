-- Content system rehaul — PR 1 of 5 (schema only).
-- See plans/content-system-rehaul.md.
--
-- content_variants = format-specific renderings of a topic. One topic can
-- have at most one variant per format (alert, blog, newsletter, facebook,
-- twitter, instagram, linkedin, threads). Each variant tracks its own
-- review/publish lifecycle and where it actually shipped (publish_target_url).

create table if not exists content_variants (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,

  format text not null
    check (format in (
      'alert',
      'blog',
      'newsletter',
      'facebook',
      'twitter',
      'instagram',
      'linkedin',
      'threads'
    )),

  -- Format-specific title. Required for alert/blog, optional for social
  -- posts that don't have a title slot.
  title text,
  body text,

  -- Format-specific metadata. Examples:
  --   alert/blog: { internal_link_suggestions: [...], suggested_image_prompt }
  --   newsletter: { suggested_subject_line, suggested_preview_text }
  --   social:     { hashtags: [...], topic_tags: [...], image_url, link_preview_url }
  metadata jsonb not null default '{}'::jsonb,

  -- Quality-gate flags. Generators set these to true after the
  -- corresponding pass has run successfully.
  brand_voice_run boolean not null default false,
  fact_check_run boolean not null default false,

  -- Per-variant fact-check results. Shape:
  --   { confirmed: [...], corrected: [...], unverifiable: [...] }
  fact_check_results jsonb,

  status text not null default 'draft'
    check (status in (
      'draft',
      'needs_review',
      'approved',
      'published',
      'archived'
    )),

  published_at timestamptz,

  -- Where the variant actually lives in the wild. For alert/blog this is
  -- the crazy4points URL; for social this is the post permalink.
  publish_target_url text,

  -- Provenance.
  generated_by text
    check (generated_by in ('sonnet', 'haiku', 'editor')),
  generation_prompt_version text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes (including the (topic_id, format) UNIQUE constraint) are added
-- in migration 299.

-- Updated-at trigger
create or replace function content_variants_set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists content_variants_updated_at on content_variants;
create trigger content_variants_updated_at
  before update on content_variants
  for each row execute function content_variants_set_updated_at();

-- RLS — variants are admin-managed; public routes (alert/blog pages) will
-- be served via service-role queries from server components. Keep RLS on
-- with no anon policy for now; PR 4 can add a published-only read policy
-- if/when we let the public client read variants directly.
alter table content_variants enable row level security;

comment on table content_variants is
  'Format-specific renderings of a topic — one per format per topic. Lifecycle: draft → needs_review → approved → published → archived. See plans/content-system-rehaul.md.';

comment on column content_variants.metadata is
  'Format-specific metadata. Newsletter: suggested_subject_line, suggested_preview_text. Social: hashtags, topic_tags, image_url, link_preview_url. Alert/blog: internal_link_suggestions, suggested_image_prompt.';

comment on column content_variants.fact_check_results is
  'Per-variant fact-check output: { confirmed: [], corrected: [], unverifiable: [] }. Populated when fact_check_run flips to true.';

comment on column content_variants.publish_target_url is
  'Where the variant actually shipped. crazy4points URL for alert/blog, post permalink for social formats.';
