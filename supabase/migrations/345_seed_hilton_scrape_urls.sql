-- Seed programs.scrape_urls + refresh_tier for Hilton Honors.
--
-- Hilton uses dynamic-pricing like Marriott — no published category chart.
-- The Free Night Reward page is the closest thing to a points cap reference
-- (Hilton's FNRs cap at the property's standard rate, and the points-bands
-- referenced in transfer/cobrand T&Cs anchor what counts as a "category").
--
-- URL notes:
-- * 'chart' deliberately omitted — Hilton has no category chart (dynamic).
-- * 'free_night_caps' uses the FNR rules page as the de-facto bands proxy.
-- * 'outbound_transfers' uses the points-to-miles redemption page; the
--   inbound-card-to-Hilton transfer ratios live on issuer sites (Amex MR
--   1:2 is on americanexpress.com, not hilton.com).
-- * 'news' is stories.hilton.com — the official press / news center.

update programs
   set refresh_tier = 1,
       scrape_urls = jsonb_build_object(
         'tiers',              'https://www.hilton.com/en/hilton-honors/member-benefits/',
         'outbound_transfers', 'https://www.hilton.com/en/hilton-honors/member/redeem/airline-miles/',
         'free_night_caps',    'https://www.hilton.com/en/hilton-honors/member/redeem/free-night-rewards/',
         'tc',                 'https://www.hilton.com/en/hilton-honors/terms/',
         'news',               'https://stories.hilton.com/'
       )
 where slug = 'hilton';
