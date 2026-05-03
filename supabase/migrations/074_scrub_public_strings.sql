-- 074_scrub_public_strings.sql
-- Replace teach_captions on partner_redemptions rows where the prior text
-- exposed editorial/internal language ("verify before transferring",
-- "rate not verified", "primary-source HIGH confidence") to public users.
--
-- Notes: the `notes` column is now treated as internal-only (the public
-- component no longer renders it), so notes content does not need a sweep.
-- Only teach_caption rewrites here.

-- Finnair Plus -> AA short-haul economy (no published cell)
update partner_redemptions
   set teach_caption = 'Finnair Plus uses regions, not distance — short-haul AA pricing on this band is not cleanly published. Search finnair.com directly before booking.'
 where teach_caption ilike '%Short-haul AA pricing not cleanly published; verify before transferring.%';

-- Finnair Plus -> AA US transcon Business
update partner_redemptions
   set teach_caption = 'Finnair Plus J on AA exists but the transcon rate varies by booking date — search finnair.com to see the current ask.'
 where teach_caption ilike '%Finnair Plus J on AA exists but specific 2026 rate not verified%';

-- Qantas -> AA medium-haul Y (no published cell)
update partner_redemptions
   set teach_caption = 'Qantas uses total-distance pricing — search qantas.com partner awards to see the exact rate for your route.'
 where teach_caption ilike '%Specific transcon rate not verified via 2026 primary source%';

-- Qantas -> AA J domestic (no published cell)
update partner_redemptions
   set teach_caption = 'Qantas J on AA — search qantas.com partner awards for the current rate on your specific route.'
 where teach_caption ilike '%Qantas J on AA exists but specific 2026 rate not verified.%';

-- SriLankan -> AA Business (LOW row)
update partner_redemptions
   set teach_caption = 'Phone booking expected for SriLankan award redemption. Inventory is limited.'
 where teach_caption ilike '%Phone booking expected. Limited inventory.%';

-- Etihad -> AA Economy US domestic (verify-before-transferring leak)
update partner_redemptions
   set teach_caption = 'Was a sweet spot pre-2023. Now phone-only via Etihad call center, with pricing that varies by route and date.'
 where teach_caption ilike '%Was a sweet spot pre-2023. Now phone-only and pricing inconsistent. Verify before transferring miles.%';
