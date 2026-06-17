-- Fix two remaining accuracy issues in the SLH page (prior replaces missed these):
--
-- (1) how_to_spend bullet 1: resort fee waiver missing "all points" qualifier.
--     Scrape: "No Resort Fees on Reward Stays Booked Using All Points" (not Points&Money).
--
-- (2) sweet_spots 5th-night bullet: missing Silver tier.
--     Scrape confirms Silver, Gold, Diamond, Diamond Reserve all get the 5th night.

update programs set
  how_to_spend = replace(how_to_spend,
    'Resort fees are waived on Hilton Honors award stays.',
    'Resort fees are waived on Hilton Honors award stays booked using all points (full-points redemptions only; Points & Money partial-redemption stays are not eligible).'),
  sweet_spots = replace(sweet_spots,
    '- **5th reward night at no extra points cost.** Gold, Diamond, and Diamond Reserve members get the 5th standard award night included - a 20% effective discount embedded in the Hilton award structure on 5-night stays.',
    '- **5th reward night at no extra points cost (Silver status and above).** Hilton Silver, Gold, Diamond, and Diamond Reserve members receive the 5th standard reward night included on full-points award stays - a 20% effective discount on 5-night redemptions.'),
  updated_at = now()
where slug = 'slh';
