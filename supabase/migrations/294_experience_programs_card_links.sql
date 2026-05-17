-- Link card-specific experience programs to the credit cards that grant access.
-- Each insert uses subqueries against slugs so the migration is robust to
-- whatever ids exist locally.
--
-- Conservative linking — only cards that authoritatively confer access per
-- the issuer's published policy. Cards with unclear or partial access (e.g.
-- Cap One Venture with limited 2x-per-year Lounge visits, Cap One Savor
-- which isn't in the DB) are skipped until verified per the data-source policy.

-- ── United Card Events from Chase: all Chase United cobrands ────────────────

insert into credit_card_experience_programs (card_id, program_id, access_tier)
select c.id, p.id, 'standard'
  from credit_cards c, experience_programs p
 where c.slug in (
   'chase-united-gateway',
   'chase-united-explorer',
   'united-quest',
   'united-club-infinite',
   'chase-united-business'
 )
   and p.slug = 'united-card-events-chase'
on conflict do nothing;

-- ── Southwest Rapid Rewards Access: all Chase Southwest cobrands ────────────

insert into credit_card_experience_programs (card_id, program_id, access_tier)
select c.id, p.id, 'standard'
  from credit_cards c, experience_programs p
 where c.slug in (
   'chase-southwest-rapid-rewards-plus',
   'chase-southwest-rapid-rewards-premier',
   'chase-southwest-rapid-rewards-priority',
   'chase-southwest-premier-business',
   'chase-southwest-performance-business'
 )
   and p.slug = 'southwest-rapid-rewards-access'
on conflict do nothing;

-- ── Sapphire Reserved: Sapphire Preferred + Sapphire Reserve ────────────────

insert into credit_card_experience_programs (card_id, program_id, access_tier)
select c.id, p.id,
       case when c.slug = 'chase-sapphire-reserve' then 'premium' else 'standard' end
  from credit_cards c, experience_programs p
 where c.slug in ('chase-sapphire-preferred', 'chase-sapphire-reserve')
   and p.slug = 'chase-sapphire-reserved'
on conflict do nothing;

-- ── Amex By Invitation Only: Platinum + Business Platinum (+ Centurion if present)

insert into credit_card_experience_programs (card_id, program_id, access_tier)
select c.id, p.id, 'invite_only'
  from credit_cards c, experience_programs p
 where c.slug in ('amex-platinum', 'amex-business-platinum')
   and p.slug = 'amex-by-invitation-only'
on conflict do nothing;

-- ── Amex Resy Global Dining Access: Platinum + Business Platinum ────────────

insert into credit_card_experience_programs (card_id, program_id, access_tier)
select c.id, p.id, 'premium'
  from credit_cards c, experience_programs p
 where c.slug in ('amex-platinum', 'amex-business-platinum')
   and p.slug = 'amex-resy-global-dining-access'
on conflict do nothing;

-- ── Capital One Dining: Venture, Venture X, Venture X Business ──────────────

insert into credit_card_experience_programs (card_id, program_id, access_tier)
select c.id, p.id, 'standard'
  from credit_cards c, experience_programs p
 where c.slug in ('capital-one-venture', 'capital-one-venture-x', 'capital-one-venture-x-business')
   and p.slug = 'capital-one-dining'
on conflict do nothing;

-- ── Capital One Lounges: Venture X + Venture X Business (unlimited access)
-- Skipping Venture (limited 2/yr) and VentureOne (no access) until verified.

insert into credit_card_experience_programs (card_id, program_id, access_tier)
select c.id, p.id, 'premium'
  from credit_cards c, experience_programs p
 where c.slug in ('capital-one-venture-x', 'capital-one-venture-x-business')
   and p.slug = 'capital-one-lounges'
on conflict do nothing;

-- ── U.S. Bank PGA Access: no Altitude cards remain in DB ────────────────────
-- (Altitude Reserve / Connect / Business Altitude Connect were deleted as
-- non-transferable cash-back cards in yesterday's cleanup. Program stays in
-- experience_programs for future restoration but no junction rows to insert.)
