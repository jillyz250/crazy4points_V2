-- Manual-paste FAQ content per program. Replaces the aborted scrape pipeline
-- (official_faq_url + program_faq_cache): those relied on Firecrawl reading
-- accordion-based FAQ pages, which returned category labels but no answer
-- text. Simpler path: admin pastes curated fee tables / tier rules / exclusions
-- directly; writer reads the text blob as authoritative extra_context when
-- regenerating an alert.
--
-- faq_updated_at is touched on every faq_content write (handled in app code)
-- so the admin UI can surface a "stale — refresh me" nudge after 30 days.

alter table programs
  add column if not exists faq_content    text,
  add column if not exists faq_updated_at timestamptz;

comment on column programs.faq_content is
  'Manually pasted authoritative FAQ / terms content. Writer treats this as more authoritative than raw_text when drafting alerts.';
comment on column programs.faq_updated_at is
  'Set whenever faq_content is written. Admin shows a staleness warning when > 30 days old.';

-- Clean up the scrape pipeline we never shipped.
drop table if exists program_faq_cache;
alter table programs drop column if exists official_faq_url;
