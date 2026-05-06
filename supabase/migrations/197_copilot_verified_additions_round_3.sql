-- Verified-additions round 3 (Copilot fact sheets for aeroplan, ana, flying-blue,
-- krisflyer, marriott-bonvoy). Atmos page is already comprehensive enough that
-- nothing in the Copilot doc passes the verified-net-new bar.
--
-- Each claim WebSearch-verified against official + reputable sources before
-- applying. One Copilot claim corrected: Ambassador spend was $21K -> $23K
-- (Copilot doc said $25K, contradicted by frequentmiler / TPG / loyaltylobby
-- sourcing).
--
-- Sources verified per program:
--   aeroplan: aircanada.com inactivity-policy + princeoftravel + frequentmiler
--     (expiry suspended through Nov 30 2026, 18-month rolling resumes after)
--   ana: thepointsguy + frequentmiler + ana.co.jp (RTW discontinued
--     June 23 2025, one-way awards launched June 24 2025)
--   flying-blue: bankofamerica.com + upgradedpoints + viewfromthewing + adept
--     (Visa Signature applications opened Jan 21 2026, $89 AF, 50K+100XP base
--     offer w/ launch promo 70K+100XP, 3x SkyTeam, 3x dining, 1.5x other,
--     up to 160 XP/yr from card)
--   krisflyer: mainlymiles + milelion + viewfromthewing + singaporeair.com
--     (Virgin Atlantic ended Apr 24 2025; Alaska ended Oct 1 2025)
--   marriott-bonvoy: frequentmiler + loyaltylobby + screened + upgradedpoints
--     (Titanium 75 -> 80 nights; Ambassador 100 nights / $21K -> $23K spend;
--     SNA rollover; Titanium/Ambassador upgrade confirmations 5 days before
--     arrival, was 2 days; soft landing for 2026 confirmed)

-- ============================================================
-- AEROPLAN - add points-expiry suspension policy
-- ============================================================
update programs set
  quirks = quirks || '
- **Points expiry currently suspended through November 30, 2026.** No Aeroplan points are expiring before that date regardless of activity. After November 30, 2026, the standard 18-month rolling-inactivity expiry resumes - and the moment it resumes, any account without qualifying activity in the prior 18 months expires immediately (the clock does NOT reset on Nov 30). Earning, redeeming, donating, transferring, or converting any points all count as activity.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'aeroplan';

-- ============================================================
-- ANA - reflect June 2025 RTW termination + one-way award launch
-- ============================================================
update programs set
  quirks = replace(replace(quirks,
    '**Round-trip required for award flights on ANA metal.** No one-way redemptions on ANA''s own chart. Partner awards do allow one-way bookings.',
    '**One-way awards on ANA metal launched June 24, 2025.** ANA finally allows one-way redemptions on its own chart, priced at half the round-trip rate. Round-trip remained the only option until that date - a multi-decade structural quirk now resolved.'
  ),
    '**Round-the-World partner award** is a separate chart with distance-banded pricing, 5 continents max, 8 segments max, Star Alliance members only.',
    '**Star Alliance Round-the-World award is no longer issuable through ANA Mileage Club.** ANA discontinued new RTW award issuance on June 23, 2025. Tickets issued on or before that date remain valid through expiration. RTW redemptions through other Star Alliance programs (Aeroplan, United, etc.) are not affected by this change.'
  ),
  sweet_spots = replace(sweet_spots,
    '- **Round-the-World partner award** for travel across 5 continents on Star Alliance partners. Distance-banded pricing; harder to research but yields massive value if your itinerary fits the segment max.',
    '- **One-way ANA-metal awards (launched June 24, 2025)** at half the round-trip rate are a structural unlock - book US-Japan in business at ~50,000 miles one-way in low season instead of being forced into a round-trip. (RTW awards are no longer issuable through ANA as of June 23, 2025; route to Aeroplan or United for those.)'
  ),
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'ana';

-- ============================================================
-- FLYING BLUE - add BoA Visa Signature card (huge gap; intro is sparse)
-- ============================================================
update programs set
  intro = intro || '

**Bank of America Air France KLM Visa Signature** launched January 21, 2026, replacing the prior Mastercard product at the same $89 annual fee. Earn 3x miles on Air France / KLM / SkyTeam-partner direct bookings, 3x on dining (new), and 1.5x on everything else. The card''s headline upgrade is the **XP-earning structure**: 20 XP every account anniversary, +80 XP at $15K in annual spend, +60 XP at $25K - up to 160 XP per year from the card alone. The launch welcome offer was 70,000 miles + 100 XP after $3,000 spend (which gets you instant Silver); the standing public offer is 50,000 miles + 100 XP after $2,000 spend.',
  quirks = quirks || '
- **BoA Air France KLM Visa Signature (Jan 21, 2026 launch)**: $89 AF, 3x SkyTeam direct bookings, 3x dining, 1.5x everything else. Up to 160 XP/year from the card structure (20 anniversary + 80 at $15K + 60 at $25K). Replaced the previous Mastercard at the same fee.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'flying-blue';

-- ============================================================
-- KRISFLYER - add Virgin Atlantic + Alaska terminations + non-flight earning
-- ============================================================
update programs set
  quirks = quirks || '
- **Virgin Atlantic partnership terminated April 24, 2025.** KrisFlyer members can no longer earn miles on Virgin Atlantic flights or redeem KrisFlyer miles for Virgin Atlantic awards. The relationship was described as a mutual wind-down.
- **Alaska Airlines partnership wound down October 1, 2025.** Reciprocal award redemptions and mileage accruals between KrisFlyer and Alaska / Atmos Rewards ended on that date. Alaska / Atmos Rewards no longer routes through KrisFlyer for Singapore Airlines bookings.
- **Non-flight elite earning launched September 1, 2025.** KrisFlyer members earn 1 Elite Mile per SGD 1 spent on Kris+, KrisShop, and Pelago, and 1 PPS Value per SGD 3 spent on those properties - the first Singapore-currency-denominated path to KrisFlyer status that does not require flying.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'krisflyer';

-- ============================================================
-- MARRIOTT BONVOY - 2026 elite-status changes
-- ============================================================
update programs set
  quirks = quirks || '
- **2026 elite threshold changes (effective for the 2026 status year):** Titanium increased from 75 -> 80 nights; Ambassador held at 100 nights but spend requirement rose from $21,000 to $23,000.
- **Suite Night Awards (SNAs) now process 7 days before check-in (was 5 days).** Unused SNAs also roll over under a new 2026 rollover policy - a structural improvement over the old "use them or lose them" model.
- **Titanium and Ambassador upgrade confirmations now arrive up to 5 days before arrival** (previously 2 days), a meaningful planning improvement for top-tier members.
- **Many Marriott resorts charge daily resort fees even on award stays** - unlike Hyatt and Hilton, which generally waive resort fees on points stays. Always check the property''s terms before booking an award.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'marriott-bonvoy';
