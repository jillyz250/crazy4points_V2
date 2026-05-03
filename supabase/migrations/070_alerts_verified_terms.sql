-- Add `verified_terms` text column for admin to paste authoritative
-- source content (full T&Cs, press release, official FAQ excerpt, etc.).
--
-- On regenerate, this is injected into extra_context as a high-authority
-- block that the writer treats as ground truth — overrides raw_text for
-- promo-term extraction. Cuts the manual gap-fill workflow in most cases:
-- admin pastes once, hits regenerate, writer extracts every relevant
-- field as a real bullet. Per-field gap banner remains as fallback.
alter table alerts
  add column if not exists verified_terms text;

comment on column alerts.verified_terms is
  'Admin-pasted authoritative source text (T&Cs, press release). Injected into writer extra_context as high-authority context on regenerate.';
