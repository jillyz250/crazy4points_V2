-- ACCURACY FIXES from re-scraping the Hilton Help Center SLH page 2026-06-17.
-- Three factual errors in the original draft:
--
--   (1) 5th standard reward night applies to SILVER+ (not Gold+).
--       Scrape confirms: Silver, Gold, Diamond, Diamond Reserve all list
--       "5th Standard Reward Night Free". Fixed in how_to_spend, sweet_spots, award_chart.
--
--   (2) Diamond tier gets Complimentary STANDARD Wi-Fi (not Premium).
--       Premium Wi-Fi is exclusive to Diamond Reserve.
--       Fixed in award_chart tier table.
--
--   (3) Resort-fee waiver is for "reward stays booked using ALL POINTS only"
--       (i.e. full points redemption, not Points & Money partial redemptions).
--       Scrape: "No Resort Fees on Reward Stays Booked Using All Points".
--       Fixed in how_to_spend and award_chart; clarification added to sweet_spots.

update programs set
  how_to_spend = replace(
    replace(how_to_spend,
      '- **5th standard reward night at no additional points cost:** Hilton Gold, Diamond, and Diamond Reserve members receive the 5th night at no extra points on award stays - an effective 20% discount on week-long redemptions.',
      '- **5th standard reward night at no additional points cost (Silver and above):** Hilton Silver, Gold, Diamond, and Diamond Reserve members receive the 5th standard reward night included on full-points award stays - an effective 20% discount on week-long redemptions.'),
    'No resort fees on Hilton Honors award stays.',
    'No resort fees on Hilton Honors award stays booked using all points (full points redemptions only; Points & Money partial-redemption stays are not eligible for the resort-fee waiver).'
  ),
  sweet_spots = replace(
    replace(sweet_spots,
      '5th reward night at no extra points cost.** Hilton Gold, Diamond, and Diamond Reserve members get the 5th standard award night included - a 20% effective discount embedded in the Hilton award structure on 5-night stays.',
      '5th reward night at no extra points cost (Silver status and above).** Hilton Silver, Gold, Diamond, and Diamond Reserve members receive the 5th standard reward night included on full-points award stays - a 20% effective discount on 5-night redemptions.'),
    'SLH hotels that charge resort fees waive them for Hilton Honors award nights - savings of USD 50-100-plus per night at resort-style properties.',
    'SLH hotels that charge resort fees waive them on full-points Hilton Honors award stays (all-points redemptions only, not Points & Money) - savings of USD 50-100-plus per night at resort-style properties.'
  ),
  award_chart = replace(
    replace(
      replace(award_chart,
        '- **No resort fees:** resort fees are waived on Hilton Honors award stays.',
        '- **No resort fees:** resort fees are waived on Hilton Honors award stays booked using all points (full points redemptions only; Points & Money stays are not eligible).'),
      '- **5th night at no extra points:** Hilton Gold, Diamond, and Diamond Reserve members receive the 5th standard reward night included on award stays.',
      '- **5th night at no extra points (Silver+):** Hilton Silver, Gold, Diamond, and Diamond Reserve members receive the 5th standard reward night included on full-points award stays.'),
    '- Diamond: +100% bonus; continental breakfast for two; space-available upgrade; Premium WiFi
- Diamond Reserve: +120% bonus; continental breakfast for two; space-available upgrade; Premium WiFi',
    '- Diamond: +100% bonus; continental breakfast for two; space-available upgrade; Standard Wi-Fi
- Diamond Reserve: +120% bonus; continental breakfast for two; space-available upgrade; Premium Wi-Fi (upgrade from Standard)'
  ),
  updated_at = now()
where slug = 'slh';
