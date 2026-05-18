-- Flag cards where Firecrawl reliably fails (Chase/Amex bot-walls return
-- 404 or scrub the page) so the editor knows on arrival they need to
-- paste markdown manually. Without this signal we waste a Firecrawl
-- credit + Sonnet token round-trip per visit before realizing.
--
-- Companion text field captures WHY (e.g. "Chase 404s Firecrawl on this
-- URL; paste from creditcards.chase.com/...") so the editor doesn't have
-- to remember.

alter table credit_cards
  add column if not exists requires_manual_paste boolean not null default false,
  add column if not exists manual_paste_reason text;

comment on column credit_cards.requires_manual_paste is
  'When true, the admin extract page shows a banner telling the editor to use the Manual markdown textarea — Firecrawl fails on this card''s URL (bot-walls, dynamic content, etc.). Set by editors after a failed extraction.';

comment on column credit_cards.manual_paste_reason is
  'Short note explaining why manual paste is required (which URL to paste from + why automatic extraction fails). Shown to the editor inside the banner.';
