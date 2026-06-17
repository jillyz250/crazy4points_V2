-- Seed sources for MGM Rewards so Claude Scout can monitor for program changes.
-- mgmresorts.com is Firecrawl-blocked; primary research was via third-party guides
-- and the official FNBO card pages (fetchable). Flag for manual refresh when
-- major benefit changes are announced.

insert into sources (name, url, type, tier, is_active, use_firecrawl, notes, created_at, updated_at)
values
  ('MGM Rewards main loyalty page', 'https://www.mgmresorts.com/en/loyalty.html', 'official_partner', 1, true, true,
   'Main MGM Rewards program page. Firecrawl-blocked as of June 2026 -- site blocks bots. Monitor manually or via WebSearch when tier threshold or earn-rate changes are reported.', now(), now()),
  ('MGM Rewards tier benefits page', 'https://www.mgmresorts.com/en/loyalty/rewards-tiers.html', 'official_partner', 1, true, true,
   'Tier-by-tier benefit details: Sapphire, Pearl, Gold, Platinum, NOIR. Firecrawl-blocked -- monitor via WebSearch. Key fields: celebration credits, cruise benefits, air credits.', now(), now()),
  ('FNBO MGM Rewards card compare', 'https://card.fnbo.com/landing/mgmrewards/mgm-card-compare', 'official_partner', 1, true, true,
   'Official FNBO card comparison page for both MGM Rewards Mastercards (Iconic World Elite + base). Fetchable via Firecrawl. Key fields: earn rates, card benefits.', now(), now()),
  ('FNBO MGM Rewards card features', 'https://card.fnbo.com/mgmrewards/features-benefits', 'official_partner', 2, true, true,
   'FNBO card features and benefits page. Account management hub -- limited product detail. See card-compare for earn rates.', now(), now()),
  ('Marriott MGM Collection FAQs', 'https://www.marriott.com/marriott-brands/mgm-collection/faqs.mi', 'official_partner', 1, true, true,
   'Official Marriott page on the MGM Collection partnership. 403 at time of authoring -- retry on next refresh. Key fields: Marriott Bonvoy status match table, MGM hotel booking with Bonvoy points.', now(), now()),
  ('TPG: MGM Rewards tier benefit changes 2025', 'https://thepointsguy.com/news/mgm-rewards-tier-benefits-changes/', 'blog', 2, true, false,
   '2025 benefit change announcement: new cruise tiers (oceanview/balcony/junior suite + cash credits), updated celebration credits (Pearl $100, Gold $100, Platinum $200, NOIR $500), Onboard FreePlay amounts per tier. Used as primary source for benefit values since official page was blocked.', now(), now()),
  ('Upgraded Points: MGM Rewards guide 2026', 'https://upgradedpoints.com/travel/hotels/m-life-rewards-program-mgm/', 'blog', 2, true, false,
   'Comprehensive 2026 guide. Tier thresholds, Marriott match table, earn rates, points expiry. Secondary source -- verify against official page on next refresh.', now(), now()),
  ('AwardWallet: MGM status match guide', 'https://awardwallet.com/hotels/mgm-status-match/', 'blog', 2, true, false,
   'Marriott Bonvoy tier match table: Pearl->Silver, Gold->Gold, Platinum->Gold, NOIR->Ambassador. Confirmed match with TPG article. One-way match only.', now(), now())
on conflict do nothing;
