-- Hilton Honors: replace outbound transfer partners with the complete list.
--
-- Migration 346 included only 5 representative airlines (and incorrectly listed
-- American Airlines + Alaska as partners — AA was never a Hilton partner, and
-- Alaska was dropped along with Aeroflot/Avianca/Finnair/Frontier/Garuda/
-- Hawaiian/LATAM/Philippine/South African in June 2024). This patch replaces
-- the outbound JSONB with the current full 25-partner list including:
-- - Standard 10:1 ratio for most airlines
-- - Better-than-standard ratios: Singapore KrisFlyer 8:1 (= 10:1.25),
--   Virgin Atlantic 10:1.5, Virgin Australia 10:1.5, Qantas 10:1.5,
--   Malaysia 10:1.2, Aeromexico 25:6.5 (= 10:2.6), AirAsia 10:2,
--   Hainan 2.5:1 (= 10:4 effective)
--
-- Source: Upgraded Points 2026 Hilton Honors transfer partners article
-- (verified May 26, 2026), cross-referenced against Award Travel Finder 2026.
-- InterMiles (Jet Airways) is a Hilton partner but not seeded in our programs
-- table — captured as a TODO in plans/sources/hilton.md.
--
-- Editorial note: hotel-to-airline transfers from Hilton are almost never the
-- right move - your Hilton points are typically worth more as Hilton stays
-- than as airline miles. Keeping this list complete for reference, not because
-- we'd recommend most of these transfers.

update programs
   set transfer_partners_outbound = $tpo$[
  {"from_slug": "aeromexico", "ratio": "10:2.6", "bonus_active": false, "notes": "Aeromexico Rewards. 25,000-point minimum transfer (25:6.5 published, effective 10:2.6). One of the better Hilton outbound ratios."},
  {"from_slug": "aeroplan", "ratio": "10:1", "bonus_active": false, "notes": "Air Canada Aeroplan. 10,000-point minimum."},
  {"from_slug": "flying-blue", "ratio": "10:1", "bonus_active": false, "notes": "Air France/KLM Flying Blue. 20,000-point minimum."},
  {"from_slug": "airasia", "ratio": "10:2", "bonus_active": false, "notes": "AirAsia rewards. Better-than-standard 10:2 ratio."},
  {"from_slug": "ana", "ratio": "10:1", "bonus_active": false, "notes": "All Nippon Airways (ANA) Mileage Club."},
  {"from_slug": "ba-avios", "ratio": "10:1", "bonus_active": false, "notes": "British Airways Club (Avios)."},
  {"from_slug": "cathay", "ratio": "10:1", "bonus_active": false, "notes": "Cathay Pacific Asia Miles."},
  {"from_slug": "china-eastern", "ratio": "10:1", "bonus_active": false, "notes": "China Eastern Eastern Miles."},
  {"from_slug": "delta", "ratio": "10:1", "bonus_active": false, "notes": "Delta SkyMiles."},
  {"from_slug": "emirates", "ratio": "10:1", "bonus_active": false, "notes": "Emirates Skywards."},
  {"from_slug": "ethiopian", "ratio": "10:1", "bonus_active": false, "notes": "Ethiopian Airlines ShebaMiles."},
  {"from_slug": "etihad", "ratio": "10:1", "bonus_active": false, "notes": "Etihad Guest."},
  {"from_slug": "eva-air", "ratio": "10:1", "bonus_active": false, "notes": "EVA Air Infinity MileageLands."},
  {"from_slug": "hainan-airlines", "ratio": "10:4", "bonus_active": false, "notes": "Hainan Airlines Fortune Wings Club. 25,000-point minimum (2.5:1 published, effective 10:4) - the best Hilton outbound ratio of the lot, though Hainan award space is regionally limited."},
  {"from_slug": "jal", "ratio": "10:1", "bonus_active": false, "notes": "Japan Airlines Mileage Bank."},
  {"from_slug": "malaysia", "ratio": "10:1.2", "bonus_active": false, "notes": "Malaysia Airlines Enrich. Slightly better than standard."},
  {"from_slug": "qantas", "ratio": "10:1.5", "bonus_active": false, "notes": "Qantas Frequent Flyer. Better-than-standard 10:1.5."},
  {"from_slug": "qatar", "ratio": "10:1", "bonus_active": false, "notes": "Qatar Airways Privilege Club."},
  {"from_slug": "saudia", "ratio": "10:1", "bonus_active": false, "notes": "Saudia Alfursan."},
  {"from_slug": "krisflyer", "ratio": "10:1.25", "bonus_active": false, "notes": "Singapore KrisFlyer. Better-than-standard 8:1 ratio (= 10:1.25). 4,000-point minimum (lowest of the lot)."},
  {"from_slug": "turkish", "ratio": "10:1", "bonus_active": false, "notes": "Turkish Miles&Smiles."},
  {"from_slug": "united", "ratio": "10:1", "bonus_active": false, "notes": "United MileagePlus."},
  {"from_slug": "virgin-atlantic", "ratio": "10:1.5", "bonus_active": false, "notes": "Virgin Atlantic Flying Club. Better-than-standard 10:1.5."},
  {"from_slug": "virgin-australia", "ratio": "10:1.5", "bonus_active": false, "notes": "Velocity Frequent Flyer (Virgin Australia). Better-than-standard 10:1.5."}
]$tpo$::jsonb,
       last_verified = current_date
 where slug = 'hilton';
