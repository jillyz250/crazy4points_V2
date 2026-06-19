-- "Recently featured" highlights for experience pages: a small snapshot of real
-- items currently/recently listed on the program's storefront, with a capture
-- date so the UI can label it honestly ("as of <date>") rather than implying live.
alter table experiences add column if not exists recent_highlights jsonb not null default '[]'::jsonb;
alter table experiences add column if not exists highlights_updated_at date;
