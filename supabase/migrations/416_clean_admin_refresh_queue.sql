-- The dashboard's refresh-queue count reads admin_refresh_queue, the OLDER twin
-- of admin_extractions_browse. The latter got cleaned (migrations 395/399/401:
-- exclude defunct, require authored intro, drop the hotel-properties scrape
-- backlog) but admin_refresh_queue never did, so the dashboard kept showing noise
-- (unauthored OTA stubs, hotel-property reminders, unauthored card skeletons).
-- Recreate it with the same guards. Keeps the legitimate transfer_partners
-- re-verification branch (now also authored-only).
-- First: the 2 newly-authored Capital One business cards (migration 407) never
-- got last_verified set, so they showed as CRITICAL/'never'. Backfill them.
update credit_cards set last_verified = current_date, updated_at = now()
where slug in ('capital-one-venture-business','capital-one-ventureone-business') and last_verified is null;

create or replace view admin_refresh_queue as
 SELECT 'credit_card'::text AS entity_type,
    c.id AS entity_id, c.slug AS entity_slug, c.name AS entity_name, c.last_verified,
    90 AS cadence_days,
    CURRENT_DATE - COALESCE(c.last_verified, '1970-01-01'::date) AS age_days,
    ('/admin/cards/'::text || c.id) || '/edit'::text AS edit_url
   FROM credit_cards c
  WHERE c.is_active = true
    AND c.status IS DISTINCT FROM 'defunct'
    AND c.intro IS NOT NULL
    AND (
      c.rotating_categories_url IS NULL AND (c.last_verified IS NULL OR c.last_verified < (CURRENT_DATE - 90))
      OR c.rotating_categories_url IS NOT NULL AND (c.last_verified IS NULL OR c.last_verified < (date_trunc('quarter'::text, CURRENT_DATE::timestamp with time zone)::date + '14 days'::interval)::date)
    )
UNION ALL
 SELECT 'credit_card_welcome_bonus'::text, b.id, c.slug, c.name || ' - current SUB'::text, b.last_verified,
    30, CURRENT_DATE - COALESCE(b.last_verified, '1970-01-01'::date),
    ('/admin/cards/'::text || c.id) || '/edit'::text
   FROM credit_card_welcome_bonuses b JOIN credit_cards c ON c.id = b.card_id
  WHERE c.is_active = true AND c.status IS DISTINCT FROM 'defunct' AND c.intro IS NOT NULL
    AND b.is_current = true AND (b.last_verified IS NULL OR b.last_verified < (CURRENT_DATE - 30))
UNION ALL
 SELECT 'issuer'::text, i.id, i.slug, i.name, i.last_verified,
    365, CURRENT_DATE - COALESCE(i.last_verified, '1970-01-01'::date),
    ('/admin/issuers/'::text || i.id) || '/edit'::text
   FROM issuers i
  WHERE i.last_verified IS NULL OR i.last_verified < (CURRENT_DATE - 365)
UNION ALL
 SELECT 'program_'::text || p.type, p.id, p.slug, p.name, p.last_verified::date,
    180, CURRENT_DATE - COALESCE(p.last_verified::date, '1970-01-01'::date),
    ('/admin/programs/'::text || p.slug) || '/edit'::text
   FROM programs p
  WHERE p.is_active = true AND p.is_reference_stub = false AND p.intro IS NOT NULL
    AND (p.last_verified IS NULL OR p.last_verified::date < (CURRENT_DATE - 180))
UNION ALL
 SELECT 'transfer_partners'::text, p.id, p.slug, p.name || ' - transfer partners'::text, p.transfer_partners_verified_at::date,
    90, CURRENT_DATE - COALESCE(p.transfer_partners_verified_at::date, '1970-01-01'::date),
    ('/admin/programs/'::text || p.slug) || '/edit'::text
   FROM programs p
  WHERE p.is_active = true AND p.intro IS NOT NULL
    AND jsonb_array_length(COALESCE(p.transfer_partners_outbound, '[]'::jsonb)) > 0
    AND (p.transfer_partners_verified_at IS NULL OR p.transfer_partners_verified_at::date < (CURRENT_DATE - 90));
