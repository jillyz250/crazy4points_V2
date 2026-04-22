-- Ship 10f — slugs for publishing content ideas as blog posts,
-- plus a published_at timestamp so public pages sort by publish time.

alter table content_ideas
  add column if not exists slug text,
  add column if not exists published_at timestamptz;

create unique index if not exists content_ideas_slug_uq
  on content_ideas(slug)
  where slug is not null;
