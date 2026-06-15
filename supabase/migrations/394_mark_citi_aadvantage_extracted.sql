-- Log 'saved' extraction records for the manually-authored Citi AAdvantage
-- cards (migration 393) so the admin doesn't flag them "never extracted".
delete from credit_card_extractions where model='manual'
  and card_id in (select id from credit_cards where slug in
    ('citi-aadvantage-mileup','citi-aadvantage-platinum-select','citi-aadvantage-executive','citi-aadvantage-business'));

insert into credit_card_extractions
  (card_id, source_url, extraction, model, status, used_interactive, verifications, raw_markdown, saved_at, created_at)
select c.id, coalesce(c.official_url, 'https://creditcards.aa.com/'), '{}'::jsonb, 'manual', 'saved', false, '[]'::jsonb,
  'Authored manually from official creditcards.aa.com + citi.com pages (migration 393). Verified 2026-06-15. Not an AI extraction.',
  now(), now()
from credit_cards c
where c.slug in ('citi-aadvantage-mileup','citi-aadvantage-platinum-select','citi-aadvantage-executive','citi-aadvantage-business');
