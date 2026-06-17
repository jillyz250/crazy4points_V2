-- Seed and activate the Small Luxury Hotels of the World (SLH Club) hotel program page.
-- Authored 2026-06-17. ASCII-only in all text strings.
--
-- TWO LOYALTY LAYERS:
--   (1) SLH Club - SLH's own soft-loyalty program (Club 01/02/03, no-fee to join).
--       No transferable points currency. Club 03 includes an annual reward-night voucher.
--   (2) Hilton Honors partnership - the dominant points story on this page.
--       Book via Hilton direct channels: earn 10 Hilton Base Points per USD 1 on room rates,
--       Hilton elite benefits apply, resort fees waived on award stays.
--       450+ participating SLH hotels across 90+ countries (as of late-2024 press release).
--
-- PARTNERSHIP HISTORY:
--   Hyatt World of Hyatt partnership ended May 15, 2024.
--   Hilton Honors is now the sole transferable-points connection.
--
-- SOURCES (official, scraped 2026-06-17):
--   hilton.com/en/help-center/reservations/small-luxury-hotels-partnership/
--     -> earn rate (10 Base Points / USD 1), Hilton tier benefits at SLH, channel rules
--   slh.com/about-slh/our-club
--     -> SLH Club 01/02/03 tier benefits
--   slh.com (homepage)
--     -> 700+ hotels, 100+ countries
--   stories.hilton.com/releases/hilton-and-slh-one-year-anniversary
--     -> 450+ participating properties, 90+ countries, 226M Honors members

update programs set
  name = 'Small Luxury Hotels of the World (SLH Club)',
  alliance = 'none',
  hubs = '{}',
  partner_chart_url = 'https://www.hilton.com/en/help-center/reservations/small-luxury-hotels-partnership/',
  intro = 'Small Luxury Hotels of the World is not a chain - it is a curated collection of 700-plus independently owned boutique and luxury hotels in more than 100 countries. These are the properties with a story rather than a brand manual: Finca Cortesin on the Costa del Sol, The Samaya in Bali, urban gems and remote retreats that a major chain would not build. SLH runs its own soft-loyalty program (SLH Club), but the real story for points travelers arrived in late 2023 when Hilton Honors became the exclusive transferable-currency partner. Book through a Hilton direct channel and you earn Hilton Honors points, your elite tier benefits activate, and resort fees on award stays are waived - across 450-plus participating SLH properties in 90-plus countries. The old Hyatt World of Hyatt partnership ended in May 2024. Hilton is now the only transferable-points program that touches SLH.',
  how_to_spend = '- **Hilton Honors award nights at SLH hotels:** Search participating SLH properties on hilton.com or the Hilton app with the "Use Points" filter. Points cost uses Hilton''s standard dynamic award pricing for that property on your dates. Resort fees are waived on Hilton Honors award stays.
- **Points + cash (Points & Money):** Hilton''s partial-redemption slider works at SLH properties, so you can apply a partial points balance to reduce your cash outlay without committing to a full award night.
- **5th standard reward night at no additional points cost:** Hilton Gold, Diamond, and Diamond Reserve members receive the 5th night at no extra points on award stays - an effective 20% discount on week-long redemptions.
- **SLH Club reward night voucher (Club 03 only):** Top-tier SLH Club members receive an annual voucher for a complimentary night at a participating SLH property, independent of Hilton Honors.
- Hilton points and elite-status benefits require booking through a Hilton direct channel (hilton.com, Hilton app, or 1-800-4HONORS). OTA bookings at SLH properties do not earn Hilton points and do not activate Hilton status perks.',
  sweet_spots = '- **Hilton Gold or Diamond status at independent-luxury hotels.** Book a participating SLH property via hilton.com with Gold or Diamond status and you get continental breakfast for two and space-available room upgrades - benefits that typically cost extra or require a higher room category at independents. The 80-100% elite points bonus on top of the 10-base-points earn rate accumulates a meaningful Hilton balance on longer stays.
- **5th reward night at no extra points cost.** Gold, Diamond, and Diamond Reserve members get the 5th standard award night included - a 20% effective discount embedded in the Hilton award structure on 5-night stays.
- **Resort fees waived on award stays.** SLH hotels that charge resort fees waive them for Hilton Honors award nights - savings of USD 50-100-plus per night at resort-style properties.
- **Points & Money to stretch a partial balance.** If you have enough Hilton Honors points for most of a stay but not all, the Points & Money slider at SLH properties lets you apply whatever you have rather than paying full cash.
- **SLH Club 02 + Hilton status stacking.** If you hold SLH Club 02 and a Hilton elite tier, the breakfast and upgrade benefits from both programs may layer at the property level. Confirm directly with the hotel before your stay - SLH Club benefits are property-administered.',
  tier_benefits = '[
    {"name":"SLH Club 01","qualification":"No fee to join; open to any SLH guest. Base tier, no stay requirement.","benefits":["Club Rate (members-only pricing at SLH properties)","Complimentary bottled water","Flexible check-in and check-out (subject to availability)","2 trees planted per booked night through SLH sustainability program"]},
    {"name":"SLH Club 02","qualification":"By invitation from SLH based on stay history. No publicly published stay or spend threshold.","benefits":["All SLH Club 01 benefits","Daily continental breakfast","Room upgrades (subject to availability)","Access to occasional SLH Bonus Rate offers","Special partner offers from SLH"]},
    {"name":"SLH Club 03","qualification":"By invitation from SLH. Qualification criteria not published on slh.com.","benefits":["All SLH Club 02 benefits","Annual reward-night voucher at participating SLH properties","Invitations to exclusive SLH member events","Swoon by SLH magazine subscription","Opportunity to win complimentary stays"]}
  ]'::jsonb,
  lounge_access = 'SLH Club has no program-wide lounge benefit. Small Luxury Hotels of the World is a collection of independent properties with no shared executive-lounge infrastructure - any lounge or club-floor access depends on the room type you book at each individual hotel and is not conferred by SLH Club membership level. The Hilton Honors partnership does not extend Hilton lounge access to SLH properties; the benefits at SLH from Hilton status are breakfast, room upgrades, the points earn rate, and resort-fee waivers on award stays - not lounge access. If a specific SLH property has a club floor or lounge that matters for your stay, confirm eligibility directly with the hotel.',
  quirks = '- **Hilton direct channel required for points and status benefits.** Hilton Honors points, elite perks, and resort-fee waivers on award stays all require booking through hilton.com, the Hilton app, or 1-800-4HONORS. Booking an SLH property through Expedia, Booking.com, or any third-party channel earns no Hilton points and activates no Hilton status benefits.
- **Hyatt partnership ended May 15, 2024.** World of Hyatt points no longer earn or redeem at SLH properties. Any guide or blog referencing Hyatt-at-SLH is out of date. Hilton Honors is now the sole transferable-points connection.
- **Not all SLH hotels participate in the Hilton partnership.** As of late 2024, 450-plus of SLH''s 700-plus member hotels are part of the Hilton Honors program. Before booking through hilton.com expecting points and status benefits, confirm the specific property is listed in Hilton''s inventory.
- **SLH Club 02 and Club 03 are invitation-only.** SLH does not publish a stay count or spend threshold for advancing beyond Club 01. Invitations are extended based on your booking history with SLH.
- **SLH Club does not issue a transferable points currency.** The program is built around on-property benefits and the Club 03 reward-night voucher. Your Hilton Honors points from SLH stays live in your Hilton account, not an SLH account.
- **Earn rate is 10 Hilton Base Points per USD 1** on qualifying room rates at participating SLH properties - the same base earn rate as most Hilton-branded hotels. Your Hilton elite tier bonus multiplier (Silver +20%, Gold +80%, Diamond +100%, Diamond Reserve +120%) applies on top.',
  award_chart = 'SLH does not publish its own award chart. Award-night redemptions at SLH properties flow through Hilton Honors:

- **How to book:** Search participating SLH hotels on hilton.com or the Hilton app with the "Use Points" filter. The points cost reflects Hilton''s standard dynamic award pricing for that property on your dates - no static category chart exists.
- **Resort fees waived:** Resort fees are waived on Hilton Honors award stays at SLH properties.
- **5th night at no extra points:** Hilton Gold, Diamond, and Diamond Reserve members receive the 5th standard reward night included on award stays.
- **Earn rate:** 10 Hilton Base Points per USD 1 on qualifying room rates when booked via a Hilton direct channel. Elite tier bonus multipliers apply on top.

Hilton elite tier bonus multipliers at SLH (source: Hilton Help Center SLH page):
- Member: base 10 points / USD 1
- Silver: +20% bonus
- Gold: +80% bonus; continental breakfast for two; space-available upgrade
- Diamond: +100% bonus; continental breakfast for two; space-available upgrade; Premium WiFi
- Diamond Reserve: +120% bonus; continental breakfast for two; space-available upgrade; Premium WiFi

For practical award pricing at a target SLH property, search on hilton.com with your dates.',
  transfer_partners = '[]'::jsonb,
  transfer_partners_outbound = '[]'::jsonb,
  is_active = true,
  content_updated_at = now(),
  last_verified = current_date,
  updated_at = now()
where slug = 'slh';
