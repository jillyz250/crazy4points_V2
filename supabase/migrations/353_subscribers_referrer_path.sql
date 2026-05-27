-- Add referrer_path to subscribers so we know which page each new subscriber
-- was on when they hit the signup form.
--
-- Today's subscribers table captures `signup_source` (which FORM was used —
-- footer, homepage_hero, hub_hero, inline_alert, newsletter_link) but not
-- which PAGE the form was on. The footer form appears on every page, so
-- "source: footer" tells us almost nothing about what content converted.
--
-- This column lets us answer "which content earns subscribers?" for every
-- new signup going forward. Existing rows stay NULL (we can't backfill what
-- we didn't capture).

alter table subscribers
  add column if not exists referrer_path text;

comment on column subscribers.referrer_path is
  'Pathname of the page the subscriber was on when they submitted the signup form. Captured by /api/subscribe from client-supplied referrerPath. Stripped of query string and hash. NULL for legacy rows (pre 2026-05-27).';
