-- Clear the 3 transfer-partner re-verification items from the refresh queue by
-- stamping transfer_partners_verified_at. These were "never" only because the
-- timestamp was never recorded at authoring - the partner data itself is current.
--   wells-fargo: partner ratios verified 2026-06-04 (6-currency authoring pass).
--   accor + hilton: spot-checked current 2026-06-15 against official sources:
--     all.accor.com/loyalty-program/partners/conditions/airlines.html (Flying Blue
--       1:1, KrisFlyer 2:1, Velocity 1:1, Air China 5:4, most others 2:1 - match)
--     hilton.com/en/help-center/hilton-honors-points/exchange-with-travel-partners/
--       (standard 10:1; KrisFlyer/Qantas/Virgin specials match)
update programs set transfer_partners_verified_at = '2026-06-04'::timestamptz, updated_at = now()
where slug = 'wells-fargo';
update programs set transfer_partners_verified_at = '2026-06-15'::timestamptz, updated_at = now()
where slug in ('accor','hilton');
