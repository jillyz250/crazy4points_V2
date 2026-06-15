-- Refresh-queue cleanup. Two problems made the queue untrustworthy:
--  1) Authored entities with a NULL last_verified (e.g. the Wyndham Earner
--     cards' welcome bonuses, the Wyndham Rewards program) defaulted to
--     1970-01-01 -> showed as "critical" forever.
--  2) UNAUTHORED stubs (OTA programs like Booking/Expedia, unauthored card
--     skeletons) appeared in the queue at all - but the queue is for
--     re-verifying AUTHORED content, not nagging about empty stubs.

-- (1) Backfill last_verified for authored content that's missing a date.
update credit_card_welcome_bonuses w
set last_verified = coalesce(c.last_verified, w.updated_at::date, w.created_at::date),
    updated_at = now()
from credit_cards c
where c.id = w.card_id and w.last_verified is null and c.intro is not null;

update programs
set last_verified = coalesce(last_verified, updated_at), updated_at = now()
where last_verified is null and intro is not null;

-- (2) Recreate the view to exclude UNAUTHORED entities (intro is null) and keep
-- the defunct guard from migration 395.
create or replace view admin_extractions_browse as
 SELECT 'credit_card'::text AS entity_type,
    c.id AS entity_id, c.slug AS entity_slug, c.name AS entity_name, c.last_verified,
    90 AS cadence_days,
    CURRENT_DATE - COALESCE(c.last_verified, '1970-01-01'::date) AS age_days,
    ('/admin/cards/'::text || c.id) || '/edit'::text AS edit_url,
    ('/admin/cards/'::text || c.slug) || '/extract'::text AS extract_url
   FROM credit_cards c
  WHERE c.is_active = true AND (c.status IS DISTINCT FROM 'defunct') AND c.intro IS NOT NULL
UNION ALL
 SELECT 'credit_card_welcome_bonus'::text AS entity_type,
    b.id AS entity_id, c.slug AS entity_slug, c.name || ' - current SUB'::text AS entity_name, b.last_verified,
    30 AS cadence_days,
    CURRENT_DATE - COALESCE(b.last_verified, '1970-01-01'::date) AS age_days,
    ('/admin/cards/'::text || c.id) || '/edit'::text AS edit_url,
    NULL::text AS extract_url
   FROM credit_card_welcome_bonuses b
     JOIN credit_cards c ON c.id = b.card_id
  WHERE c.is_active = true AND (c.status IS DISTINCT FROM 'defunct') AND c.intro IS NOT NULL AND b.is_current = true
UNION ALL
 SELECT 'issuer'::text AS entity_type,
    i.id AS entity_id, i.slug AS entity_slug, i.name AS entity_name, i.last_verified,
    365 AS cadence_days,
    CURRENT_DATE - COALESCE(i.last_verified, '1970-01-01'::date) AS age_days,
    '/admin/issuers/'::text || i.slug AS edit_url, NULL::text AS extract_url
   FROM issuers i
UNION ALL
 SELECT 'program_'::text || p.type AS entity_type,
    p.id AS entity_id, p.slug AS entity_slug, p.name AS entity_name, p.last_verified::date AS last_verified,
    180 AS cadence_days,
    CURRENT_DATE - COALESCE(p.last_verified::date, '1970-01-01'::date) AS age_days,
    ('/admin/programs/'::text || p.slug) || '/edit'::text AS edit_url,
    ('/admin/programs/'::text || p.slug) || '/extract'::text AS extract_url
   FROM programs p
  WHERE p.is_active = true AND p.is_reference_stub = false AND p.intro IS NOT NULL
UNION ALL
 SELECT 'hotel_properties_program'::text AS entity_type,
    p.id AS entity_id, p.slug AS entity_slug, p.name || ' - properties'::text AS entity_name,
    NULL::date AS last_verified, 180 AS cadence_days, 20580 AS age_days,
    ('/admin/programs/'::text || p.slug) || '/properties'::text AS edit_url, NULL::text AS extract_url
   FROM programs p
  WHERE p.is_active = true AND p.type = 'hotel'::program_type AND p.intro IS NOT NULL AND NOT (EXISTS ( SELECT 1
           FROM hotel_properties hp WHERE hp.program_id = p.id));
