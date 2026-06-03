-- ============================================================================
-- 362 - Fix the issuer Edit link in admin_extractions_browse.
--
-- The view built the issuer edit_url as '/admin/issuers/<id>/edit', but the
-- real admin route is '/admin/issuers/<slug>' (slug-based, no /edit suffix) —
-- so every issuer row in the Extractions queue linked to the wrong page. This
-- recreates the view with only the issuer branch's edit_url corrected; every
-- other branch is byte-for-byte the same.
--
-- Also fixes the related data bug: recently-authored hotels (Wyndham, Choice,
-- IHG, Accor) were saved is_active=false, so they were excluded from the queue
-- (and from Card Finder transfer destinations). Flip authored hotels active.
-- Idempotent.
-- ============================================================================
update programs set is_active = true
where type = 'hotel' and is_active = false and content_updated_at is not null;

create or replace view admin_extractions_browse as
 SELECT 'credit_card'::text AS entity_type,
    c.id AS entity_id,
    c.slug AS entity_slug,
    c.name AS entity_name,
    c.last_verified,
    90 AS cadence_days,
    CURRENT_DATE - COALESCE(c.last_verified, '1970-01-01'::date) AS age_days,
    ('/admin/cards/'::text || c.id) || '/edit'::text AS edit_url,
    ('/admin/cards/'::text || c.slug) || '/extract'::text AS extract_url
   FROM credit_cards c
  WHERE c.is_active = true
UNION ALL
 SELECT 'credit_card_welcome_bonus'::text AS entity_type,
    b.id AS entity_id,
    c.slug AS entity_slug,
    c.name || ' - current SUB'::text AS entity_name,
    b.last_verified,
    30 AS cadence_days,
    CURRENT_DATE - COALESCE(b.last_verified, '1970-01-01'::date) AS age_days,
    ('/admin/cards/'::text || c.id) || '/edit'::text AS edit_url,
    NULL::text AS extract_url
   FROM credit_card_welcome_bonuses b
     JOIN credit_cards c ON c.id = b.card_id
  WHERE c.is_active = true AND b.is_current = true
UNION ALL
 SELECT 'issuer'::text AS entity_type,
    i.id AS entity_id,
    i.slug AS entity_slug,
    i.name AS entity_name,
    i.last_verified,
    365 AS cadence_days,
    CURRENT_DATE - COALESCE(i.last_verified, '1970-01-01'::date) AS age_days,
    '/admin/issuers/'::text || i.slug AS edit_url,   -- FIXED: was '/admin/issuers/<id>/edit'
    NULL::text AS extract_url
   FROM issuers i
UNION ALL
 SELECT 'program_'::text || p.type AS entity_type,
    p.id AS entity_id,
    p.slug AS entity_slug,
    p.name AS entity_name,
    p.last_verified::date AS last_verified,
    180 AS cadence_days,
    CURRENT_DATE - COALESCE(p.last_verified::date, '1970-01-01'::date) AS age_days,
    ('/admin/programs/'::text || p.slug) || '/edit'::text AS edit_url,
    ('/admin/programs/'::text || p.slug) || '/extract'::text AS extract_url
   FROM programs p
  WHERE p.is_active = true AND p.is_reference_stub = false
UNION ALL
 SELECT 'hotel_properties_program'::text AS entity_type,
    p.id AS entity_id,
    p.slug AS entity_slug,
    p.name || ' - properties'::text AS entity_name,
    NULL::date AS last_verified,
    180 AS cadence_days,
    20580 AS age_days,
    ('/admin/programs/'::text || p.slug) || '/properties'::text AS edit_url,
    NULL::text AS extract_url
   FROM programs p
  WHERE p.is_active = true AND p.type = 'hotel'::program_type AND NOT (EXISTS ( SELECT 1
           FROM hotel_properties hp
          WHERE hp.program_id = p.id));
