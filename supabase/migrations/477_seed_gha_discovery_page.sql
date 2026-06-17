-- Seed and activate the GHA Discovery hotel program page.
-- Authored 2026-06-17. ASCII-only in all text strings.
--
-- PROGRAM SHAPE:
--   GHA Discovery = Global Hotel Alliance coalition loyalty program.
--   60-plus independent hotel brands (Anantara, Kempinski, NH Hotels, Capella,
--   Corinthia, Pan Pacific, Outrigger, Viceroy, Tivoli, and more), 800-plus
--   hotels in 100-plus countries. No affiliation with Hilton / Marriott / Hyatt.
--
--   Currency: DISCOVERY Dollars (D$). D$1 = USD 1 always. This is a cashback
--   program, not a points program - there are no award charts, no sweet spots
--   in the traditional sense, and D$ do NOT transfer to airlines.
--
--   Three paths to every tier (use whichever is easiest):
--     Silver: join (automatic)
--     Gold:   2 stays  OR  USD 1,000 spend
--     Platinum: 10 nights  OR  2 brands  OR  USD 5,000 spend
--     Titanium: 30 nights  OR  3 brands  OR  USD 15,000 spend
--
--   The 3-brand path to Titanium is the standout: 3 stays at 3 different GHA
--   brands in a calendar year unlocks the top tier and its complimentary
--   breakfast benefit - the fastest elite path of any major hotel program.
--
--   Breakfast is TITANIUM only (not Platinum) and is brand-dependent.
--
-- SOURCES (official, scraped 2026-06-17):
--   ghadiscovery.com/gha-discovery-benefits (tier benefits overview)
--   ghadiscovery.com/terms-conditions (earn rates, expiry, qualification thresholds)
--   ghadiscovery.com/DISCOVERY-Dollars (D$ earn/spend mechanics)
--   ghadiscovery.com/our-partners (lifestyle partners - no airline transfers)
--   ghadiscovery.com/our-brands (full brand roster)

update programs set
  name = 'GHA Discovery',
  alliance = 'none',
  hubs = '{}',
  partner_chart_url = 'https://www.ghadiscovery.com/gha-discovery-benefits',
  intro = 'GHA Discovery is the loyalty program of the Global Hotel Alliance - a coalition of 60-plus independent hotel brands covering 800-plus properties in 100-plus countries. Think Anantara in Thailand, Kempinski across Europe and the Middle East, Capella in Singapore, Corinthia in London, NH Hotels across Spain and Germany, Pan Pacific in Asia, Outrigger in the Pacific. These are brands you would not find in a Hilton, Marriott, or Hyatt search. The one catch: GHA runs on a fundamentally different model. Its currency is DISCOVERY Dollars (D$), where D$1 = USD 1, always. There is no award chart, no redemption sweet spot to chase - just a cashback rebate on your hotel spend that you apply toward a future bill. Earn 4% at Silver, up to 7% at Titanium, and spend it on your room, dinner, spa, or golf at any participating hotel. The reason to care: Titanium status is unlockable after just 3 stays at 3 different GHA brands in a calendar year - faster than almost any other top-tier hotel status in the industry.',
  how_to_spend = '- **Apply D$ to your hotel bill at checkout.** Redeem any balance toward rooms, dining, spa, golf, or Experiences on your folio at the time of checkout. D$ cannot be transferred to airline miles or other programs.
- **Spend across the hotel, not just the room.** D$ are valid on non-room spend too - dinner at the hotel restaurant, a spa treatment, a round of golf - as long as it is on your folio at a participating brand.
- **Use D$ on member-rate bookings.** Member rates (5-10% off the best available rate on direct channels) are already discounted; you can still apply D$ on top to reduce the final bill further.
- **D$ cannot be redeemed on OTA bookings.** Reservations made through Expedia, Booking.com, or any third-party channel are ineligible for both earning and redeeming D$. Book direct - via ghadiscovery.com, a brand website, or the GHA app.
- **D$ are redeemed in expiration order.** The soonest-expiring balance is always used first. Monitor your account dashboard to avoid silent expiry.',
  sweet_spots = '- **The 3-brand path to Titanium.** Stay at just 3 different GHA brands in a calendar year and you earn Titanium - the top tier with complimentary breakfast, double room upgrades, and 7% D$ back. That can mean as few as 3 total nights if each is at a separate brand. No other major hotel program makes top-tier status this achievable for occasional travelers.
- **Titanium breakfast at aspirational brands.** Complimentary breakfast for two at Anantara, Kempinski, Capella, and Corinthia (where a buffet breakfast can run USD 40-80 per person) meaningfully reduces the effective room cost on longer stays. Budget the D$ earn separately - the breakfast alone can add USD 80-160 per day in value.
- **Stacking multi-brand promotions.** GHA runs frequent multi-brand promos (double or triple D$, or flat D$50-100 bonuses per brand stay) that run alongside your base earn rate. A Titanium member earning 7% base plus triple D$ during a promo can effectively get 21% back on eligible spend.
- **Member rate + D$ earn combination.** Member rates on direct bookings save 5-10% off the best available rate. Earn D$ on that already-discounted rate and apply the rebate to dining or spa - the effective cost of the stay drops materially versus booking through an OTA.
- **Buy D$ at a discount.** GHA periodically sells D$ at 15% off (D$1 = USD 0.85 to buy). Since D$1 always redeems at USD 1 of hotel spend, a buy-at-discount window is a genuine arbitrage if you have a stay planned.',
  tier_benefits = '[
    {"name":"Silver","qualification":"Automatic on joining. No stay or spend required.","benefits":["Earn 4% back in Discovery Dollars (D$) on Net Eligible Spend","D$ valid for 12 months from issuance","Member Rates: 5-10% off Best Available Rate on direct channels","Complimentary Wi-Fi at participating brands","Access to Exclusive Stay Offers and Local Offers","Access to member-only Experiences"]},
    {"name":"Gold","qualification":"2 stays OR USD 1,000 Net Eligible Spend in a calendar year. Status valid through end of qualifying year and following full calendar year.","benefits":["Earn 5% back in D$ on Net Eligible Spend","D$ valid for 18 months from issuance","Member Rates: 5-10% off Best Available Rate on direct channels","Complimentary Wi-Fi at participating brands","Access to Exclusive Stay Offers and Local Offers"]},
    {"name":"Platinum","qualification":"10 eligible nights OR 2 different brands OR USD 5,000 Net Eligible Spend in a calendar year. NH Hotels, NH Collection, and nhow count as one brand for this calculation.","benefits":["Earn 6% back in D$ on Net Eligible Spend","D$ valid for 24 months from issuance","One-category room upgrade at check-in (subject to availability; excludes presidential and multi-bedroom suites, residences, and villas)","Late checkout until 3:00 pm (subject to availability; request at arrival)","Complimentary ASMALLWORLD Premium membership (USD 99/yr value) while Platinum or Titanium status is maintained","Member Rates and exclusive offers"]},
    {"name":"Titanium","qualification":"30 eligible nights OR 3 different brands OR USD 15,000 Net Eligible Spend in a calendar year. The 3-brand path is the fastest route to top-tier status for most travelers.","benefits":["Earn 7% back in D$ on Net Eligible Spend","D$ valid for 24 months from issuance","Two-category room upgrade at check-in (subject to availability; excludes presidential and multi-bedroom suites, residences, and villas)","Early check-in from 11:00 am (subject to availability; must request at least 2 days prior)","Late checkout until 3:00 pm (subject to availability)","Complimentary breakfast for two at participating brands (Titanium-exclusive; not available at Platinum or below; brand list at ghadiscovery.com/complimentary-breakfast/titanium-members)","Complimentary ASMALLWORLD Premium membership (USD 99/yr value)"]}
  ]'::jsonb,
  lounge_access = 'GHA Discovery has no program-wide lounge benefit. The coalition spans 60-plus independent brands with no shared lounge infrastructure. Room upgrades at Platinum and Titanium may land you on a Club Floor or Executive Floor at brands that have one - but GHA''s T&C explicitly note that upgrades to Club Floors may exclude the associated Club Floor or Executive Floor benefits, as determined by the respective hotel. In practice, lounge access at any GHA property depends on the brand, the property, and whether your upgrade puts you in a lounge-eligible room category. Confirm with the specific hotel if lounge access matters for your stay.',
  quirks = '- **D$1 = USD 1, always.** GHA Discovery is a cashback program, not a points program. There is no award chart, no redemption sweet spot, and no transfer to airlines. The value lever is your D$ earn rate (4-7% depending on tier) and accessing discounted member rates to earn on a lower base.
- **OTA bookings earn nothing.** Book through Expedia, Booking.com, or any third-party channel and you receive zero D$, zero tier credit, and no status benefits on that stay. First stays on ineligible rates may receive D$ on a promotional basis only; subsequent stays on ineligible rates earn nothing at all.
- **NH Hotels + NH Collection + nhow = one brand.** For the tier-qualification brand count (the Platinum 2-brand or Titanium 3-brand paths), all three NH sub-brands count as a single brand. Plan your brand mix accordingly.
- **Breakfast is Titanium only.** Complimentary breakfast does not apply at Platinum, Gold, or Silver tiers. Blogs sometimes describe Platinum as having breakfast - that is incorrect per GHA''s T&C.
- **Promotional D$ expire in 6 months.** Bonus D$ from promotions have a separate, shorter expiry than base D$ (which run 12-24 months depending on tier). Watch your account dashboard to track which D$ expire first.
- **Status downgrade is one level at a time.** If you earn Titanium but do not re-qualify the following year, you drop to Platinum (not Silver). Missing re-qualification for two consecutive years would take you from Titanium to Platinum to Gold.
- **Status match is available for a fee.** GHA periodically offers paid status matches from other hotel, airline, or cruise programs to Platinum (USD 100) or Titanium (USD 150), with half the fee rebated in D$. Watch for these promotions if you hold elite status elsewhere.',
  award_chart = 'GHA Discovery does not have an award chart. D$ are a fixed-value cashback currency (D$1 = USD 1) applied directly to your hotel bill at checkout - not redeemed against category-based award pricing.

Earn rates by tier:
- Silver: 4% of Net Eligible Spend
- Gold: 5% of Net Eligible Spend
- Platinum: 6% of Net Eligible Spend
- Titanium: 7% of Net Eligible Spend

D$ expiry by tier:
- Silver: 12 months from issuance
- Gold: 18 months from issuance
- Platinum: 24 months from issuance
- Titanium: 24 months from issuance

Promotional D$ (from bonuses and promotions) expire in 6 months from issuance, regardless of tier.

How to redeem: apply D$ toward any eligible charge on your hotel folio at checkout - room rate, dining, spa, golf, or hotel Experiences. D$ cannot be redeemed on stays booked through OTAs or third-party channels.

D$ floor: if your earn calculation results in less than D$5, you receive D$5 (the minimum issuance per transaction).',
  transfer_partners = '[]'::jsonb,
  transfer_partners_outbound = '[]'::jsonb,
  is_active = true,
  content_updated_at = now(),
  last_verified = current_date,
  updated_at = now()
where slug = 'gha-discovery';
