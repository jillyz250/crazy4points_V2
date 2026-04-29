-- Add separate carrier rows for joint-loyalty-program situations.
--
-- BACKGROUND
-- ----------
-- When an airline shares a loyalty program with another carrier, the program
-- and the carriers are distinct entities that deserve their own pages:
--
--   • Atmos Rewards   = the loyalty program (currency, status, transfer
--                       partners, sweet spots, partner award charts)
--   • Alaska Airlines = the carrier (SEA/ANC/PDX hubs, fleet, routes,
--                       brand identity)
--   • Hawaiian Airlines = the carrier (HNL hub, inter-island network,
--                       widebody fleet, Aloha brand)
--
-- Same shape applies to Air France-KLM Flying Blue:
--   • Flying Blue   = loyalty program
--   • Air France    = carrier (CDG hub)
--   • KLM           = carrier (AMS hub)
--
-- Reader behavior: someone searching "Alaska Airlines lounge" wants the
-- carrier; someone searching "Atmos transfer partners" wants the program.
-- One page can't be both without confusing both audiences.
--
-- WHAT THIS MIGRATION DOES
-- ------------------------
-- Adds 4 carrier rows that were previously absorbed into their joint
-- loyalty programs:
--   • alaska     → Alaska Airlines (the carrier)
--   • hawaiian   → Hawaiian Airlines (the carrier)
--   • air_france → Air France (the carrier)
--   • klm        → KLM Royal Dutch Airlines (the carrier)
--
-- The existing atmos and flying_blue rows STAY — they continue to
-- represent the loyalty programs. Their content over time should shift
-- toward program-only framing (transfer partners, status, partner charts)
-- and away from carrier-specific framing (which moves to the new rows).
--
-- ON CONFLICT DO NOTHING — safe to re-run.

insert into programs (slug, name, type, is_active) values
  ('alaska',     'Alaska Airlines',           'airline', true),
  ('hawaiian',   'Hawaiian Airlines',         'airline', true),
  ('air_france', 'Air France',                'airline', true),
  ('klm',        'KLM Royal Dutch Airlines',  'airline', true)
on conflict (slug) do nothing;
