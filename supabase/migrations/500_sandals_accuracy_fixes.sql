-- ACCURACY FIXES on Island Insiders Club page (self-audit 2026-06-17):
--
-- (1) lounge_access: Removed "Sapphire tier and above" qualifier from weekly VIP Insiders
--     Event. The benefit table had a checkmark row for this but the scrape did not capture
--     which tiers receive it (checkmarks render as icons, not text). Tier qualifier was
--     unsourced -- removing the restriction rather than guessing.
--
-- (2) award_chart: BofA card earn rates (4x/2x/1x, no annual fee, no FX fee) were sourced
--     from blog posts, not the official BofA or sandals.com/sandalscard/ page. Adding a
--     hedge and directing readers to verify at sandals.com/sandalscard/.

update programs set
  lounge_access = 'Island Insiders Club includes no airport lounge access at any tier.

On-resort, members may receive invitations to weekly VIP Insiders Events during their stay (which tiers are eligible was not confirmed from the official benefit table -- check sandals.com/about/rewards-program/ for the current tier breakdown). Some resorts also feature an Island Insiders Lounge where members can book their next stay at up to 12% off (the Future Memories Discount).',

  award_chart = replace(award_chart,
    'The Bank of America Sandals and Beaches Visa Signature (no annual fee; no FX fee) earns directly into the account: 4x at Sandals and Beaches properties, 2x at restaurants and grocery stores, 1x everywhere else.',
    'The Bank of America Sandals and Beaches Visa Signature earns directly into the account. Reported earn rates as of mid-2026: 4x at Sandals and Beaches properties, 2x at restaurants and grocery stores, 1x everywhere else; no annual fee; no foreign transaction fee. Verify current rates and fees at sandals.com/sandalscard/ before applying.'),

  updated_at = now()
where slug = 'sandals';
