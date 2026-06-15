-- Drop the hotel_properties_program branch from the refresh queue. Those entries
-- ("<hotel> - properties") flag hotel programs that have no properties seeded -
-- a separate, large property-scraping backlog (Akamai-blocked), not stale-content
-- re-verification. They were permanently "critical" and cluttered the queue.
-- Keeps the authored-only + defunct guards from migrations 399/395.
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
  WHERE p.is_active = true AND p.is_reference_stub = false AND p.intro IS NOT NULL;
