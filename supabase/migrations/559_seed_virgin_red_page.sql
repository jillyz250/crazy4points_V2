-- Seed Virgin Red program page at /programs/virgin-red (type loyalty_program / currency hub).
-- Sourced from official virgin.com/virgin-red + Virgin Red member support (scraped via Firecrawl 2026-06-17):
--   - main: what Virgin Red is, earn/spend ecosystem, Flying Club linking, "points don't expire"
--   - expiry (membersupport.red.virgin.com): "your Virgin Points will never expire" (AUTHORITATIVE)
-- Transfer-in partners (6 US transferable currencies, all 1:1) confirmed against our own authored
-- currency set (Amex/Chase/Citi/Bilt/WF/CapOne all include Virgin) + 2026 WebSearch.
-- Lean style: avoid derived math + over-specificity. Flight award sweet spots live on the Virgin
-- Atlantic Flying Club page (shared currency) -- this page points there rather than restating costs.

update programs set
  alliance = 'none',
  hubs = '{}',

  intro = 'Virgin Red is Virgin''s rewards club and the home of Virgin Points -- the very same currency as Virgin Atlantic Flying Club. Link the two accounts and your points pool into a single balance you can spend on either side. It is free to join (open to UK and US residents, 18+), and Virgin Points do not expire.

For a points-and-miles audience, the appeal is what feeds it: all six major US transferable currencies -- American Express Membership Rewards, Chase Ultimate Rewards, Citi ThankYou, Capital One Miles, Bilt, and Wells Fargo -- move to Virgin Points at 1:1, frequently with sizable transfer bonuses. The highest-value way to use them is to pool into Flying Club and book partner award flights (the program''s real sweet spots). Virgin Red itself layers on a large catalog of everyday ways to earn and lifestyle rewards -- shopping, wine, experiences, cruises -- for travelers who would rather spend points on treats than on flights.',

  transfer_partners = '[
    {"from_slug": "amex", "ratio": "1:1", "notes": "Amex Membership Rewards transfers to Virgin Points at 1:1. Amex applies a small US federal excise tax recovery fee on the transfer. Virgin runs frequent transfer bonuses -- wait for one if you can.", "bonus_active": false},
    {"from_slug": "chase", "ratio": "1:1", "notes": "Chase Ultimate Rewards transfers at 1:1 with no transfer fee. Periodic transfer bonuses (recent bonuses have reached 30-40%).", "bonus_active": false},
    {"from_slug": "citi", "ratio": "1:1", "notes": "Citi ThankYou transfers at 1:1 with no fee; periodic transfer bonuses.", "bonus_active": false},
    {"from_slug": "capital-one", "ratio": "1:1", "notes": "Capital One Miles transfer at 1:1 (Capital One lists Virgin Red by name among its partners); no transfer fee.", "bonus_active": false},
    {"from_slug": "bilt", "ratio": "1:1", "notes": "Bilt Rewards transfer at 1:1 with no fee.", "bonus_active": false},
    {"from_slug": "wells-fargo", "ratio": "1:1", "notes": "Wells Fargo Rewards transfer at 1:1 with no fee.", "bonus_active": false}
  ]'::jsonb,
  transfer_partners_outbound = '[]'::jsonb,

  how_to_spend = '- **Reward flights and upgrades via Flying Club (the highest-value use)**: Link your Virgin Atlantic Flying Club account and your pooled Virgin Points can book Virgin Atlantic Upper Class and -- more valuably -- partner award flights on carriers like ANA, Delta, and Air France-KLM. The flight award detail lives on the Virgin Atlantic Flying Club page; that is where the standout premium-cabin redemptions are.
- **Virgin Red lifestyle rewards**: A large catalog of non-flight rewards -- wine, days out, experiences, cruises, merchandise, and vouchers from Virgin and partner brands. These are priced individually per offer (no chart) and generally return less value per point than flight redemptions, but they are convenient and have no flight-availability hurdles.
- **Spend through the app or website**: No loyalty card; vouchers and orders live in the app. Redeem online or show a code or QR at the retailer in person.
- **No transferring out**: Virgin Points are not transferable to other airline or hotel programs -- you redeem them within the Virgin ecosystem and Flying Club''s airline partners.',

  sweet_spots = '- **A transfer-in hub with frequent bonuses**: Virgin Points sit at the receiving end of all six major US transferable currencies at 1:1, and Virgin runs transfer bonuses several times a year (recent bonuses have reached around 40%). Waiting for a bonus before you transfer is the single easiest way to add value -- but only transfer with a specific redemption in mind.
- **Pool into Flying Club for partner award flights**: The real value lives in Flying Club''s partner redemptions (ANA, Delta, Air France-KLM and others). Because Virgin Red and Flying Club share one balance, Virgin Red is effectively a convenient on-ramp to those flight awards -- see the Virgin Atlantic Flying Club page for the specifics.
- **Points do not expire**: Unusual for a rewards-club currency -- you can bank a balance with no activity pressure while you wait for the right redemption or transfer bonus.
- **Buy-points promotions**: Virgin periodically sells Virgin Points with large bonuses (recent promotions have run up to around 70% off the usual price), occasionally cheap enough to top up for a specific premium-cabin award -- again, only with a redemption already in mind.
- **Reality check**: Virgin Red''s own lifestyle catalog is handy but typically returns less per point than flight redemptions. Treat Virgin Red as an earn-and-transfer hub feeding Flying Club, not as a standalone spending catalog.',

  tier_benefits = '[
    {
      "name": "Member",
      "qualification": "Free to join (UK and US residents, 18+); no status tiers within Virgin Red",
      "benefits": [
        "Earn Virgin Points across Virgin brands, partner shopping, and bank transfers",
        "Spend Virgin Points on a large catalog of lifestyle rewards plus -- via a linked Flying Club account -- reward flights and upgrades",
        "Virgin Points do not expire",
        "Link Virgin Atlantic Flying Club (and Virgin Hotels The Know / Virgin Wines Discovery) to pool points into one balance"
      ]
    }
  ]'::jsonb,

  lounge_access = 'Virgin Red is a rewards club and does not itself confer any lounge access -- it has no status tiers.

Lounge access in the Virgin world belongs to Virgin Atlantic Flying Club elite status (the Virgin Clubhouse and partner lounges), which is earned through flying, not through Virgin Red activity. If lounge access is your goal, see the Virgin Atlantic Flying Club page; pooling Virgin Points into Flying Club does not by itself grant status or lounge entry.',

  quirks = '- **Same currency as Flying Club, one pooled balance**: Virgin Red and Virgin Atlantic Flying Club both use Virgin Points. Link the accounts and you see and spend a single balance; you can also link Virgin Hotels The Know and Virgin Wines Discovery.
- **Virgin Points do not expire**: Confirmed by Virgin''s own member support -- the points last indefinitely.
- **No tiers in Virgin Red**: Virgin Red itself is a flat rewards club. The elite tiers (and lounge access) live on the Virgin Atlantic Flying Club side and are earned by flying.
- **Points do not transfer out**: You cannot move Virgin Points into another airline or hotel programme -- redemptions happen within Virgin and Flying Club''s airline partners.
- **Fed by the major US bank currencies at 1:1**: Amex, Chase, Citi, Capital One, Bilt, and Wells Fargo all transfer in at 1:1 (US Bank also transfers in). Bonuses are common. Amex applies a small US federal excise tax recovery fee; the others transfer with no fee.
- **You can buy Virgin Points**: Virgin periodically sells points, often with large bonuses -- occasionally worth it for a specific premium-cabin award, but only with a redemption planned.
- **Open to UK and US residents, 18+**: Free to join via the app or website; no physical loyalty card. Lifestyle rewards are priced per offer and value varies, generally below flight redemptions.',

  award_chart = 'Virgin Red does not publish an award chart. Lifestyle rewards (wine, experiences, cruises, vouchers, merchandise) are priced individually per offer, and prices vary by promotion.

Flight redemptions use Virgin Atlantic Flying Club''s award pricing rather than anything specific to Virgin Red -- because the two share the Virgin Points currency, a linked Flying Club account books Virgin Atlantic and partner award flights at Flying Club rates. See the Virgin Atlantic Flying Club page for the partner award detail and the premium-cabin sweet spots.

**Transfers in:** American Express Membership Rewards, Chase Ultimate Rewards, Citi ThankYou, Capital One Miles, Bilt, and Wells Fargo all transfer to Virgin Points at 1:1 (US Bank also transfers in), frequently with bonuses. Virgin Points do not transfer out to other programmes.',

  content_updated_at = now(),
  updated_at = now()
where slug = 'virgin-red';
