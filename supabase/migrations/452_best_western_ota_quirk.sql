-- Best Western completeness fix (post-publish audit 2026-06-15): add the OTA / third-
-- party non-qualifying-nights caution that the other hotel pages carry. T&C explicitly
-- lists OTA, tour operator, employee/crew/wholesale, and 30+ night rates as Non-
-- Qualifying Nights (no points, no elite credit). ASCII-only.
update programs set
  quirks = '- **Points never expire:** Best Western''s standout feature - the official terms state points do not expire, unlike nearly every major competitor.
- **No blackout dates:** Free nights are available whenever a standard room is available to book.
- **OTA bookings do not qualify:** Stays booked through Expedia, Booking.com, Priceline, tour operators, or other non-Best Western channels earn NO points and NO elite credit - you must book direct. Employee, crew, wholesale, and 30+ night rates are also non-qualifying.
- **Dynamic free-night pricing:** Points needed track the property''s expected average daily rate; standard rooms only, up to 7 consecutive nights per redemption.
- **Midscale elite perks are modest:** Elite mainly adds bonus points, water, and (Platinum+) early/late check-out. There is NO room upgrade, free breakfast, or lounge benefit - and Diamond vs Diamond Select differ only by bonus percentage.
- **Nights-based tiers:** Status is earned purely on Qualifying Nights (5 / 7 / 15 / 25 per calendar year); status earned in 2026 holds through December 2027.
- **Status Match No Catch:** Best Western instantly matches most competing elite status for free.
- **Member-to-member transfers:** Allowed in 1,000-point increments after 30 days of membership, up to 150,000 points per rolling calendar year.
- **Earn miles instead of points = no elite bonus:** Setting an airline as your earning preference means you earn only miles for that stay and forfeit the elite bonus.
- **Huge small-market footprint:** The real value is reach - properties in secondary cities and along highways where Marriott/Hilton are absent.',
  last_verified = current_date, updated_at = now(), content_updated_at = now()
where slug = 'best-western';
