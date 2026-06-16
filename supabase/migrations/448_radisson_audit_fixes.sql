-- Radisson Rewards post-publish audit fixes (2026-06-15). The audit caught one real
-- error and corrected a completeness mischaracterization:
--  (1) ERROR FIX: Avios was ANNOUNCED for removal in Sept 2025 but the actual
--      last-transfer deadline is 30 September 2026 - so British Airways / Avios is
--      STILL an active partner today (authored date 2026-06-15). Re-added as a 4th
--      outbound partner (10:1) with a sunset note; corrected the quirks wording.
--  (2) ROSTER IS SHORT, NOT ~20: independent sources + the official miles page confirm
--      Radisson has only a handful of airline partners (BA/Avios, Flying Blue, SAS,
--      Miles & More). The seeded roster is therefore essentially COMPLETE. Added a
--      transparency note so readers/Decision Engine know it is curated, not truncated.
-- ASCII-only.

update programs set
  transfer_partners_outbound = '[
    {"from_slug":"sas","ratio":"7:1","notes":"To SAS EuroBonus - the single most favorable ratio (7 Radisson points = 1 EuroBonus point), auto-redeemed in 7-point increments. No transfer tax. Confirmed on the official Airline Miles redemption page.","bonus_active":false},
    {"from_slug":"flying-blue","ratio":"10:1","notes":"To Air France-KLM Flying Blue (10 Radisson points = 1 mile), auto-redeemed in 10,000-point increments. No transfer tax. Confirmed partner.","bonus_active":false},
    {"from_slug":"miles-and-more","ratio":"10:1","notes":"To Lufthansa Miles & More (10:1), in 10,000-point increments. BARRED for the account lifetime if you have ever purchased or been gifted Radisson points. No transfer tax. Named on the official Airline Miles page.","bonus_active":false},
    {"from_slug":"british-airways","ratio":"10:1","notes":"To British Airways Avios (10:1), in 10,000-point increments. RETIRING: Radisson is dropping Avios - last transfers by 30 September 2026. Still available until then. No transfer tax.","bonus_active":false}
  ]'::jsonb,
  quirks = '- **Two programs, one old name:** Radisson Rewards (this program) covers EMEA + Asia Pacific only; Americas properties moved to Choice Privileges in 2023. Separate currencies.
- **Dynamic redemption, no chart:** Points track the cash rate, so value is steadiest on expensive nights. Online redemption is capped at USD 600/night value - pricier award stays must be booked at the front desk.
- **Points expire on inactivity:** Points are voided after any 24-month period with no earning or redemption activity; any qualifying activity resets the clock.
- **Discount Booster is a trade-off:** Toggling it on cuts your earning (Premium 27 -> 9/$, VIP 36 -> 12/$) in exchange for up to ~20% off - good for cash stays, bad if you are building a balance.
- **Short, curated airline list:** Unlike Marriott or Hilton, Radisson transfers to only a handful of airlines - SAS EuroBonus (the best at 7:1), Flying Blue, and Lufthansa Miles & More, plus British Airways Avios which is being retired (last transfers 30 September 2026).
- **Member-to-member transfers:** You can transfer points to up to 5 members per month and receive up to 100,000/month, after 30 days of membership - a limited pooling workaround.
- **Miles & More catch:** If you have ever purchased or been gifted Radisson points, you are barred for the account lifetime from transferring to Lufthansa Miles & More.
- **Airline transfers are a bridge, not a profit center:** 10:1 (7:1 for SAS) is fine when you have a redemption planned, not a high-value default - keep points for hotel nights unless a transfer bonus is running.
- **Russia excluded; thin in the Americas:** No Russian properties participate, and US/Canada/LatAm Radisson stays earn Choice Privileges, not these points.',
  award_chart = 'Radisson Rewards (global) uses DYNAMIC redemption - there is no fixed category chart. Points work like currency: if a room can be booked for cash it can generally be booked on points, with the points price floating alongside the cash rate. Online, app, and Contact-Center Award Night redemptions cover stays valued up to USD 600/night; for higher-priced rooms you redeem at the hotel front desk. Pay-with-Points works for partial or full payment at checkout with a 10-point minimum. EARNING is tier-based: Club 8, Premium 27, VIP 36 points per USD (Discount Booster active: Premium 9, VIP 12); Prize by Radisson brand earns at half those rates; Meetings & Events earn 5 points/USD up to 250,000 per event. Airline transfers are limited to a short partner list - 10 Radisson points = 1 mile (auto-redeemed in 10,000-pt increments) to Flying Blue and Lufthansa Miles & More, with SAS EuroBonus more favorable at 7:1; maximum 1,000,000 points per calendar year to miles. British Airways Avios (10:1) is being retired with last transfers on 30 September 2026. Points expire after any 24-month period with no account activity.',
  last_verified = current_date,
  updated_at = now(),
  content_updated_at = now()
where slug = 'radisson';
