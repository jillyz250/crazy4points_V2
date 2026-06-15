-- The four JetBlue cards were authored directly via SQL (migrations 388-390),
-- so the admin cards list showed them as "never extracted" (no
-- credit_card_extractions row). Log a 'saved' record per card, honestly noting
-- the source was manual authoring from official issuer pages, not the AI
-- extractor. This clears the "never extracted" flag in the admin.
delete from credit_card_extractions
where model = 'manual'
  and card_id in (select id from credit_cards where slug in
    ('barclays-jetblue','barclays-jetblue-plus','barclays-jetblue-business','barclays-jetblue-premier'));

insert into credit_card_extractions
  (card_id, source_url, extraction, model, status, used_interactive, verifications, raw_markdown, saved_at, created_at)
select c.id,
  coalesce(c.official_url, 'https://www.jetblue.com/trueblue/credit-cards/jetblue-card-comparison'),
  '{}'::jsonb, 'manual', 'saved', false, '[]'::jsonb,
  'Authored manually from official Barclays + JetBlue issuer pages (migrations 388-390). Verified 2026-06-15. Not an AI extraction.',
  now(), now()
from credit_cards c
where c.slug in ('barclays-jetblue','barclays-jetblue-plus','barclays-jetblue-business','barclays-jetblue-premier');
