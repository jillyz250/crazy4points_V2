-- Ship 1 of the public blog system. Adds the columns we need to render a
-- categorized, polished /blog index and detail page, plus default authorship.
--
-- Categories are validated in the app (lib/blog/categories.ts) and enforced
-- in the DB only when the row is published — drafts can have a null category
-- so editors can sketch before deciding on classification.

alter table content_ideas
  add column if not exists category text,
  add column if not exists excerpt text,
  add column if not exists reading_time_minutes int,
  add column if not exists hero_image_url text,
  add column if not exists primary_program_slug text,
  add column if not exists featured boolean not null default false,
  add column if not exists featured_rank int;

-- Backfill: nothing to do; new columns default to NULL/false which is correct
-- for any pre-existing rows.

-- Default future inserts to Jill as the author (overridable by writer step).
alter table content_ideas
  alter column written_by set default 'Jill Zeller';

-- Hard-block invalid categories on publish. Drafts may have null/anything;
-- once status flips to 'published', category MUST be one of the 6 known slugs.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'content_ideas_category_check'
  ) then
    alter table content_ideas
      add constraint content_ideas_category_check
      check (
        status != 'published'
        or category in (
          'transfer-plays',
          'sweet-spots',
          'programs',
          'card-strategy',
          'how-to',
          'news'
        )
      );
  end if;
end$$;

-- Indexes to support the public blog index queries.
create index if not exists content_ideas_blog_category_published_idx
  on content_ideas (category, published_at desc)
  where type = 'blog' and status = 'published';

create index if not exists content_ideas_blog_primary_program_idx
  on content_ideas (primary_program_slug, published_at desc)
  where type = 'blog' and status = 'published';

-- Featured-first ordering (featured DESC, featured_rank ASC nulls last, published_at DESC)
-- doesn't translate to a single index cleanly, but a partial index on the featured
-- subset speeds up the "any featured posts?" query the index page uses.
create index if not exists content_ideas_blog_featured_idx
  on content_ideas (featured_rank asc nulls last, published_at desc)
  where type = 'blog' and status = 'published' and featured = true;
