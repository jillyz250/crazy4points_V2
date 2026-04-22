-- Add image_url to destinations. Populated from Wikipedia via scripts/backfill-images.mjs.
alter table destinations add column if not exists image_url text;
