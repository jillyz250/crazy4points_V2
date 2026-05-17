-- Transfer-capability flag for credit cards.
--
-- Context: every card with a `currency_program_id` inherited the full
-- transfer-partners list from that program — even cash-back / starter cards
-- like Chase Freedom Rise that earn UR points but CANNOT directly transfer
-- them to airline/hotel partners. (You have to first move them to a Sapphire
-- Preferred/Reserve or Ink Preferred/Premier.) This was a major user-facing
-- accuracy bug: the page suggested transfers the cardholder couldn't make.
--
-- Fix: a per-card boolean. Render path:
--   - transferable=true  -> show partner table + "pool from siblings" alert
--   - transferable=false -> HIDE partner table, show "pair with [sibling
--     premium card] to unlock transfers" alert linking to the siblings
--
-- Pure cash-back cards (no points currency at all — Quicksilver, Cash Magnet,
-- Blue Cash, etc.) are removed from the site separately; this flag is only
-- for cards that DO earn a transferable currency but lack direct transfer.

alter table credit_cards
  add column if not exists points_transferable_to_partners boolean not null default true;

comment on column credit_cards.points_transferable_to_partners is
  'When true (default), the card-detail page renders the full transfer-partners list inherited from the currency program. When false, the partner table is hidden and the page shows a "pair with sibling premium card to unlock" alert instead. Set false for cards that earn into a transferable currency but require pairing with a higher-tier sibling to actually transfer (Chase Freedom family, Chase Ink Cash/Unlimited, Citi Custom Cash/Double Cash, Citi Rewards+, etc.).';

-- Flip the known non-transferable cards.
-- Slugs that don't exist in this DB are silently ignored by the update.
update credit_cards
   set points_transferable_to_partners = false
 where slug in (
   'chase-freedom-rise',
   'chase-freedom-flex',
   'chase-freedom-unlimited',
   'chase-ink-business-cash',
   'chase-ink-business-unlimited',
   'citi-custom-cash',
   'citi-double-cash',
   'citi-rewards-plus'
 );
