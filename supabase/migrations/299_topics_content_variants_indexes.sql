-- Content system rehaul — PR 1 of 5 (schema only).
-- See plans/content-system-rehaul.md.
--
-- Indexes for the topics + content_variants tables created in migrations
-- 297 and 298. Split into its own file so the table DDL stays readable
-- and the indexing strategy is easy to find in one place.

-- ── topics indexes ───────────────────────────────────────────────────────

-- Unique on slug — primary lookup key for /admin/topics/<slug>.
create unique index if not exists topics_slug_idx
  on topics (slug);

-- Status filter — admin lists ("show me active topics").
create index if not exists topics_status_idx
  on topics (status);

-- Expiry sweeps — partial so we don't index evergreen (NULL end_date) rows.
create index if not exists topics_end_date_idx
  on topics (end_date) where end_date is not null;

-- GIN on the programs[] and cards[] tag arrays so "topics tagged chase-ur"
-- and "topics tagged with the CSR" filters stay fast as the table grows.
create index if not exists topics_programs_gin_idx
  on topics using gin (programs);

create index if not exists topics_cards_gin_idx
  on topics using gin (cards);

-- ── content_variants indexes ─────────────────────────────────────────────

-- One variant per (topic, format) — the structural invariant of this table.
create unique index if not exists content_variants_topic_format_uq
  on content_variants (topic_id, format);

-- Listing all variants for a topic (admin topic detail page).
create index if not exists content_variants_topic_idx
  on content_variants (topic_id);

-- Cross-topic queries by format + status, e.g. "all newsletter variants
-- needing review" or "all approved twitter variants ready to schedule".
create index if not exists content_variants_format_status_idx
  on content_variants (format, status);

-- Recently-published feed. Partial so we only index the rows the query
-- actually scans.
create index if not exists content_variants_published_at_idx
  on content_variants (published_at desc) where status = 'published';
