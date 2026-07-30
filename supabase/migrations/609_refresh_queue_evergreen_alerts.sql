-- Add evergreen published alerts to the manual refresh queue.
--
-- Motivation (2026-07-30): the "Philippine Airlines now bookable with Alaska
-- Atmos" alert sat live for months asserting a redemption Alaska had already
-- pulled. It had NO end_date, so auto-expire/auto-archive (both end_date-driven)
-- never touched it, and admin_refresh_queue covered only cards/programs/issuers
-- — never alerts. So evergreen "state" alerts had zero re-verification cadence.
--
-- This recreates admin_refresh_queue (unchanged card/program/issuer branches)
-- plus a new 'alert' branch: PUBLISHED, undated alerts of the types that assert
-- an ongoing changeable state (partner/award/rate/policy), surfaced when they
-- have no verified_terms, no last_verified, or are past a 120-day cadence.
-- Dated promos still ride the end_date lifecycle and are intentionally excluded.
--
-- Clearing a queued alert: set its variant metadata last_verified (mirrored to
-- alerts.last_verified by the variants->alerts trigger) via a "mark verified"
-- action, or archive it if stale. security_invoker=on kept from migration 459.

drop view if exists public.admin_refresh_queue;
create or replace view public.admin_refresh_queue
  with (security_invoker = on)
as
  select 'credit_card'::text as entity_type,
    c.id as entity_id,
    c.slug as entity_slug,
    c.name as entity_name,
    c.last_verified,
    case when c.rotating_categories_url is not null then 90 else 180 end as cadence_days,
    (current_date - coalesce(c.last_verified, '1970-01-01'::date)) as age_days,
    ('/admin/cards/' || c.id || '/edit') as edit_url
  from credit_cards c
  where c.is_active = true
    and c.status is distinct from 'defunct'
    and c.intro is not null
    and (
      (c.rotating_categories_url is null
        and (c.last_verified is null or c.last_verified < (current_date - 180)))
      or
      (c.rotating_categories_url is not null
        and (c.last_verified is null or c.last_verified < (date_trunc('quarter', current_date::timestamptz)::date + interval '14 days')::date))
    )
union all
  select 'credit_card_welcome_bonus'::text,
    b.id,
    c.slug,
    c.name || ' - current SUB',
    b.last_verified,
    180,
    (current_date - coalesce(b.last_verified, '1970-01-01'::date)),
    '/admin/cards/' || c.id || '/edit'
  from credit_card_welcome_bonuses b
  join credit_cards c on c.id = b.card_id
  where c.is_active = true
    and c.status is distinct from 'defunct'
    and c.intro is not null
    and b.is_current = true
    and (b.last_verified is null or b.last_verified < (current_date - 180))
union all
  select 'issuer'::text,
    i.id,
    i.slug,
    i.name,
    i.last_verified,
    365,
    (current_date - coalesce(i.last_verified, '1970-01-01'::date)),
    '/admin/issuers/' || i.id || '/edit'
  from issuers i
  where i.last_verified is null or i.last_verified < (current_date - 365)
union all
  select ('program_' || p.type)::text,
    p.id,
    p.slug,
    p.name,
    p.last_verified::date,
    180,
    (current_date - coalesce(p.last_verified::date, '1970-01-01'::date)),
    '/admin/programs/' || p.slug || '/edit'
  from programs p
  where p.is_active = true
    and p.is_reference_stub = false
    and p.intro is not null
    and (p.last_verified is null or p.last_verified::date < (current_date - 180))
union all
  select 'transfer_partners'::text,
    p.id,
    p.slug,
    p.name || ' - transfer partners',
    p.transfer_partners_verified_at::date,
    90,
    (current_date - coalesce(p.transfer_partners_verified_at::date, '1970-01-01'::date)),
    '/admin/programs/' || p.slug || '/edit'
  from programs p
  where p.is_active = true
    and p.intro is not null
    and jsonb_array_length(coalesce(p.transfer_partners_outbound, '[]'::jsonb)) > 0
    and (p.transfer_partners_verified_at is null or p.transfer_partners_verified_at::date < (current_date - 90))
union all
  -- Evergreen "state" alerts: published, no end_date, asserting an ongoing
  -- changeable state. Surfaced when unverified or past the 120-day cadence.
  select 'alert'::text,
    a.id,
    a.slug,
    a.title,
    a.last_verified::date,
    120,
    (current_date - coalesce(a.last_verified::date, a.published_at::date, a.created_at::date, '1970-01-01'::date)),
    '/admin/alerts/' || a.id || '/edit'
  from alerts a
  where a.status = 'published'
    and a.end_date is null
    and a.type in (
      'award_availability', 'program_change', 'partner_change', 'category_change',
      'earn_rate_change', 'status_change', 'policy_change', 'sweet_spot'
    )
    -- Cadence only: never-verified (last_verified null) surfaces the existing
    -- backlog now; "mark verified" stamps last_verified=today and clears it for
    -- 120 days. (verified_terms is NOT used here — it's a promo-T&Cs field that
    -- many legit alerts never have, so it could never be cleared; that signal
    -- lives in the publish-time source gate instead.)
    and (
      a.last_verified is null
      or a.last_verified::date < (current_date - 120)
    );
