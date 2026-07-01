-- Refresh-queue cadence tuning (2026-07-01, Jill approved).
-- The manual refresh queue was dominated by welcome-bonus rows on a 30-day
-- cadence, which is redundant: card SUBs are already watched daily by the
-- card-bonus-monitor cron. And the card deep-re-verify at 90 days was more
-- frequent than card benefit changes warrant.
--
-- Change: credit_card 90 -> 180 days; credit_card_welcome_bonus 30 -> 180 days.
-- UNCHANGED: rotating-category cards keep their quarterly gate (their 5x
-- categories genuinely rotate each quarter); issuers 365; programs 180;
-- transfer_partners 90. Recreated with security_invoker=on (migration 459).

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
    and (p.transfer_partners_verified_at is null or p.transfer_partners_verified_at::date < (current_date - 90));
