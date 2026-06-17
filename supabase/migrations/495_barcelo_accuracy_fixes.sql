-- ACCURACY FIXES on myBarcelo Benefits page (self-audit 2026-06-17):
--
-- (1) lounge_access: Remove fabricated "Royal Hideaway exclusive guest areas" claim.
--     That sentence had no official source -- it was editorial inference. The only
--     confirmed fact is that myBarcelo has no airport lounge benefit at any tier.
--
-- (2) tier_benefits: Remove "(non-alcoholic)" qualifier from Unique minibar benefit.
--     Official tiers page says only "welcome minibar" -- no qualifier. At Barcelo
--     all-inclusive resorts, minibars typically include alcohol. Qualifier was
--     unsourced and likely wrong for a significant portion of the property portfolio.
--
-- (3) quirks: Soften "24-month rolling window (no annual reset)" -- the official FAQ
--     says "within 24 months" but does not confirm whether this is a rolling window
--     or a qualification period with periodic resets. Changed to hedged language.

update programs set
  lounge_access = 'myBarcelo Benefits includes no airport lounge access at any tier and no dedicated on-property club lounge benefit. The Unique tier delivers room upgrades and preferential room assignments, but no formal lounge benefit is published in the program terms.',

  tier_benefits = jsonb_set(
    tier_benefits,
    '{2,benefits,6}',
    '"Complimentary welcome minibar (contents vary by property type)"'
  ),

  quirks = replace(quirks,
    '- **24-month rolling window (no annual reset).** Tier qualification looks at your last 24 months of activity continuously -- there is no January 1 reset. If your qualifying stay count drops below the threshold, your tier reverts at the next review cycle.',
    '- **24-month qualification window.** Tier qualification requires the minimum stays and cumulative spend to be achieved within a 24-month window. Tier re-qualification is ongoing -- if your qualifying activity falls below the threshold, you can expect to revert on the next review. Verify current window mechanics at barcelo.com/en-us/mybarcelo/general-conditions/.'),

  updated_at = now()
where slug = 'barcelo';
