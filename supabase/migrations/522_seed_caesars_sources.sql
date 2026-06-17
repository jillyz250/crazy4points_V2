-- Seed sources for caesars so Claude Scout can monitor for program changes.

insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('Caesars Rewards benefits overview', 'https://www.caesars.com/myrewards/benefits-overview', 'official_partner', 1, true, true,
   'Authoritative source for all 6 tier credit thresholds, hotel discounts, parking, lounge access, cruise discounts, bonus bets. Includes PDF link to 2026 benefits brochure.', now(), now()),
  ('Caesars Rewards earn and redeem', 'https://www.caesars.com/myrewards/earn-and-redeem', 'official_partner', 1, true, true,
   'Tier credit earn rates by activity type (slots, dining, hotel, sports bets). Full TC threshold table. Daily TC bonus structure. Reward Credits redemption options.', now(), now()),
  ('Caesars Rewards Seven Stars page', 'https://www.caesars.com/myrewards/sevenstars', 'official_partner', 1, true, true,
   'Seven Stars tier benefits: Retreat details, Celebration Dinner, Norwegian Cruise, Atlantis stay, Companion Card, Elite tiers at 500K and 1M Tier Score. Updated each year.', now(), now()),
  ('Caesars Rewards Seven Stars rules 2026', 'https://www.caesars.com/myrewards/sevenstars/rules', 'official_partner', 2, true, true,
   'Full 2026 Seven Stars rules and regulations. Monitor for benefit changes, airfare cap changes, blackout date policy.', now(), now()),
  ('Caesars Rewards Wyndham partnership', 'https://www.caesars.com/myrewards/partners/wyndham_resorts', 'official_partner', 2, true, true,
   'Bidirectional transfer ratio between Caesars Reward Credits and Wyndham Rewards points. Transfer ratio not captured in initial scrape -- monitor this page.', now(), now()),
  ('Caesars Rewards Visa credit cards page', 'https://www.caesars.com/myrewards/partners/cr-visa', 'official_partner', 2, true, true,
   'Co-brand Visa cards (Signature and Prestige): earn rates, TC earn structure, welcome bonus. Rates have changed in recent years -- monitor for further changes.', now(), now()),
  ('Caesars Rewards TC earn FAQ', 'https://caesarsrewards.custhelp.com/app/answers/detail/a_id/233', 'official_partner', 2, true, true,
   'Official FAQ article: TC earn rates by activity. Supplement to the main earn-and-redeem page with more detail on gaming types.', now(), now())
on conflict do nothing;
