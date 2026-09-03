-- 657_field_updates.sql — per-employee "field digest" (Jill, 2026-09-02).
-- Each head stays current in their specialty by reading trade news. Because AI
-- agents don't persist knowledge between sessions, THIS TABLE is their memory:
-- a weekly job pulls their trade sources, Haiku summarizes the genuinely-new
-- items, and the head reads their unread updates in their morning brief.
--
-- HARD RULE: field updates inform HOW a head works (technique, trends) — they are
-- NEVER a citable source for a published fact. Published facts stay official-only.
-- (Blogs/trade press are awareness input, not evidence.) Kept SEPARATE from
-- intel_items (which feeds the publish pipeline) on purpose.

create table if not exists public.field_updates (
  id             uuid primary key default gen_random_uuid(),
  employee_slug  text not null,                              -- which head this is for (employees.slug)
  headline       text not null,                              -- the article title
  summary        text,                                       -- Haiku one-liner: what changed + why it matters to this head
  relevance      text default 'normal'
                   check (relevance in ('high','normal','low')),
  source_name    text,                                       -- e.g. "Social Media Today"
  source_url     text not null,                              -- the article link
  published_at   timestamptz,                                -- from the feed's pubDate
  read           boolean not null default false,             -- has the head/Jill seen it (cleared from the brief)
  dedupe_key     text not null unique,                       -- normally source_url — prevents re-adding the same article
  created_at     timestamptz not null default now()
);

-- brief query is "this head, unread, newest first"
create index if not exists field_updates_employee_read_idx
  on public.field_updates (employee_slug, read, published_at desc);

-- SECURITY: internal admin-only, same model as the org tables (651). Service-role
-- client bypasses RLS; RLS ON + NO public policies = default-deny to anon/authenticated.
alter table public.field_updates enable row level security;
