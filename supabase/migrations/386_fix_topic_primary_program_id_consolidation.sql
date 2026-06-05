-- Fix topics.metadata.primary_program_id left dangling by the currency
-- consolidation (migration 358).
--
-- When the long loyalty_program currency rows (Amex MR, Chase UR, Bilt, Wells
-- Fargo) were deprecated/removed in favor of the canonical SHORT credit_card
-- rows, migration 358 repointed alert_programs FKs + rewrote jsonb from_slugs,
-- but it never touched topics.metadata.primary_program_id. As a result 10
-- topics still pointed at deleted program ids, and any attempt to publish their
-- alert variant failed with:
--   insert or update on table "alerts" violates foreign key constraint
--   "alerts_primary_program_id_fkey"
--
-- Map each stale (deleted) source-currency id to its canonical replacement.
-- Grouping is unambiguous: all topics under each stale id are that currency's
-- transfer/earn alerts (5 Amex, 3 Chase, 1 Bilt, 1 Wells Fargo).

update topics t
set metadata = jsonb_set(t.metadata, '{primary_program_id}', to_jsonb(m.canonical), true),
    updated_at = now()
from (values
  ('370572b5-cd09-49bd-924b-40cffc44883c', '4c90b01d-bb1a-47fa-94e7-eb42c1898611'), -- Amex MR  -> amex
  ('17c18a46-2059-46e0-91be-f86ed230632f', '9dad76b7-9f8e-43da-a6c9-4a76ebbef057'), -- Chase UR -> chase
  ('686e4c6b-2d17-4a01-8d81-08a7807ce320', '18aa7d04-3c70-418c-8918-01331c95ba22'), -- Bilt     -> bilt
  ('0cf3f457-99b2-4e90-b3d6-5303df848224', '98b97c9d-5257-4903-8644-bbcc20263530')  -- WF       -> wells-fargo
) as m(stale, canonical)
where t.metadata->>'primary_program_id' = m.stale;
