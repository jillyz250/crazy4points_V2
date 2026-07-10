-- Question Radar: daily-scraped candidate user questions (Reddit RSS + Google
-- "People Also Ask" via Firecrawl), enriched by Claude Haiku with a topic,
-- relevance score, best-matching crazy4points page, and a draft social-post hook.
-- Reviewed in /admin/(protected)/question-radar; the /api/cron/question-radar
-- job upserts rows (dedup on question_key). Service-role only.

create table if not exists public.content_questions (
  id             uuid primary key default gen_random_uuid(),
  source         text not null check (source in ('reddit', 'google_paa')),
  source_detail  text,
  source_url     text,
  question       text not null,
  question_key   text not null unique,
  topic          text,
  relevance      int  not null default 0,
  matched_url    text,
  matched_label  text,
  post_hook      text,
  status         text not null default 'new' check (status in ('new', 'saved', 'used', 'dismissed')),
  fetched_at     timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create index if not exists content_questions_status_idx    on public.content_questions (status);
create index if not exists content_questions_fetched_idx   on public.content_questions (fetched_at desc);
create index if not exists content_questions_relevance_idx on public.content_questions (relevance desc);

-- Service-role only: the admin dashboard and cron use the service key (bypasses
-- RLS). No public policies => anon/authenticated clients read nothing.
alter table public.content_questions enable row level security;
