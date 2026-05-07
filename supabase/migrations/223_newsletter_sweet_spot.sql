-- Newsletter — add Sweet Spot slot.
--
-- The Sweet Spot is a deeper-dive value-add card sitting between the Big
-- Story and Also Happening: a single transfer bonus / mechanic / sweet spot
-- explained plainly, then 3-4 specific best uses.
--
-- Shape (jsonb):
--   {
--     "topic": "Capital One -> Qantas 20% transfer bonus",
--     "mechanic_explainer": "3-5 sentences explaining the play",
--     "best_uses": [
--       { "name": "Cathay J class JFK-HKG, 75K", "why": "..." },
--       { "name": "JAL business class to Tokyo", "why": "..." }
--     ]
--   }
--
-- Null = hide the card. Generator picks the highest-value mechanic / promo
-- of the week; admin can edit / regenerate / clear independently of other
-- slots.

alter table newsletters
  add column if not exists sweet_spot jsonb;

comment on column newsletters.sweet_spot is
  'Deep-dive Sweet Spot card. Shape: { topic, mechanic_explainer, best_uses[] }. Null = section hidden.';
