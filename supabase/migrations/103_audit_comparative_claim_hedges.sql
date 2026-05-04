-- Hedge four comparative-absolute claims flagged by audit-program.mjs.
-- The other 59 findings were false positives (factual past dates, perk
-- descriptions, award names, already-hedged phrases). See audit log
-- /tmp/audit-v3.log for the full classification pass done 2026-05-04.

-- 1. Southwest: "first US Southwest-metal redemption to Europe" -> "among the first..."
update programs
set how_to_spend = replace(how_to_spend,
  'first US Southwest-metal redemption to Europe',
  'among the first US Southwest-metal redemptions to Europe'),
    last_verified = current_date
where slug = 'southwest' and how_to_spend like '%first US Southwest-metal redemption to Europe%';

-- 2. AA: "Citi ThankYou is now the only major flexible-currency program" -> drop "the only major"
update programs
set transfer_partners = replace(transfer_partners::text,
  'Citi ThankYou is now the only major flexible-currency program',
  'Citi ThankYou is now a major flexible-currency program')::jsonb,
    last_verified = current_date
where slug = 'aa' and transfer_partners::text like '%Citi ThankYou is now the only major flexible-currency program%';

-- 3. United: "First major US-domestic-domestic loyalty rollout" -> "Among the first..."
update programs
set quirks = replace(quirks,
  'First major US-domestic-domestic loyalty rollout',
  'Among the first major US-domestic-domestic loyalty rollouts'),
    last_verified = current_date
where slug = 'united' and quirks like '%First major US-domestic-domestic loyalty rollout%';

-- 4. Oneworld: hedge two "world's best" claims about Qatar Qsuites
update programs
set sweet_spots = replace(sweet_spots,
  'is among the world''s best',
  'is among the most-praised'),
    member_programs = replace(member_programs::text,
  'widely considered the world''s best business product',
  'widely considered among the most-praised business products')::jsonb,
    last_verified = current_date
where slug = 'oneworld';
