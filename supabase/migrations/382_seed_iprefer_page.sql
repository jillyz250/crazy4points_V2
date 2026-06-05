-- ============================================================================
-- 382 - Author + publish the I Prefer Hotel Rewards (iprefer) program page.
-- Preferred Hotels & Resorts loyalty program, 700+ independent/boutique luxury
-- hotels. Free to join; earn points on the room rate, redeem for Reward
-- Certificates (2,500 pts = $50). Capital One + Citi transfer in at 1:2, but
-- iPrefer points are a low-value spend currency - the page is honest that the
-- transfer is usually a poor use of flexible points.
-- Tiers verified on iprefer.com/membership: Silver / Gold / Titanium (the
-- "Insider/Explorer/Authority" names in news articles are the OLD program).
-- Dollar-quoted to avoid apostrophe escaping; ASCII-only content.
-- ============================================================================
update programs set
  alliance = 'none',
  intro = $intro$I Prefer Hotel Rewards is the loyalty program for Preferred Hotels & Resorts - a collection of 700+ independent and boutique luxury hotels worldwide. It is free to join, and the real pitch is reach: one-of-a-kind properties you cannot book with the big chain currencies. You earn points on paid stays and redeem them for Reward Certificates that knock money off a future stay. Capital One and Citi both transfer in at 1:2, but iPrefer points are a low-value spend currency, so check the verdict below before you move anything over.$intro$,
  how_to_spend = $hts$- Reward Certificates - the core redemption. 2,500 points gets a $50 certificate, usable toward a room at any participating property.
- Member rates - sign in for exclusive member-only pricing at Preferred hotels.
- Experiences and auctions - bid points in limited-time I Prefer Auction events for stays and experiences.
- iPrefer points are for Preferred Hotels stays only - they do not transfer out to airlines.$hts$,
  sweet_spots = $ss$- The draw isn't a points chart, it's reach: rewards at independent and boutique luxury hotels that aren't in Marriott, Hilton, Hyatt, or IHG.
- Best value comes when you're already booking a Preferred property and can stack a member rate plus a Reward Certificate.$ss$,
  quirks = $q$- 2,500-point minimum to redeem; certificates start at $50.
- iPrefer points are low value - roughly a penny or two each - so the 1:2 transfer from Capital One or Citi is usually a worse deal than sending those flexible points to an airline, where premium-cabin redemptions return far more per point.
- Only transfer in if you have a specific Preferred Hotels stay in mind. Never transfer first and hope.
- Points are earned on the room rate (not taxes or fees), through eligible booking channels.
- Tier status (Silver, Gold, Titanium) is earned by tier-qualifying points over a rolling 12 months.$q$,
  tier_benefits = $tb$[
    {
      "name": "Silver",
      "qualification": "0 - 24,999 points (entry tier, no minimum)",
      "benefits": [
        "Earn 10 points per $1 on the room rate",
        "Exclusive member rates",
        "Early check-in / late check-out (subject to availability)",
        "Enhanced room upgrades (subject to availability)",
        "Complimentary Wi-Fi",
        "Digital travel magazine",
        "Redeem points for Reward Certificates"
      ]
    },
    {
      "name": "Gold",
      "qualification": "25,000 - 49,999 tier-qualifying points in 12 months",
      "benefits": [
        "Earn 12 points per $1, plus a 20% bonus per stay",
        "All Silver benefits",
        "Welcome amenity"
      ]
    },
    {
      "name": "Titanium",
      "qualification": "50,000+ tier-qualifying points in 12 months",
      "benefits": [
        "Earn 15 points per $1, plus a 50% bonus per stay",
        "All Gold benefits",
        "Complimentary food & beverage offering",
        "Digital anniversary gift",
        "Access to exclusive experiences"
      ]
    }
  ]$tb$::jsonb,
  last_verified = now(),
  content_updated_at = now(),
  is_active = true,
  is_reference_stub = false,
  updated_at = now()
where slug = 'iprefer';

select slug, name, is_active, (content_updated_at is not null) published,
  jsonb_array_length(tier_benefits) tiers
from programs where slug = 'iprefer';
