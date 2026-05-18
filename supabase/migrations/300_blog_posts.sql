-- Content System Rehaul — PR 4 (Penny)
-- Per plans/content-system-rehaul.md, blog variants need a dedicated landing
-- table at /blog/<slug>. The legacy /blog route reads from content_ideas
-- (type='blog'); blog_posts is the destination for topic-driven blog variants.
--
-- The public /blog/[slug] page-handler will check blog_posts first, then fall
-- back to content_ideas so existing posts keep rendering during the cutover.

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  topic_id uuid references topics(id) on delete set null,
  title text not null,
  lede text,
  body_markdown text not null,
  meta_description text,
  hero_image_alt text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists blog_posts_slug_idx on blog_posts(slug);
create index if not exists blog_posts_status_idx on blog_posts(status);
create index if not exists blog_posts_topic_id_idx on blog_posts(topic_id);
