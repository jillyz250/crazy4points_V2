-- Seed China Eastern Eastern Miles program page at /programs/china-eastern (SkyTeam).
-- Official ceair.com pages are JS-heavy (tier detail did not render); tier structure sourced from
-- consistent 2026 WebSearch + SkyTeam. Lean style.
-- US access is minimal: no major US bank transfer; Marriott partnership ended 2019.

update programs set
  alliance = 'skyteam',
  hubs = '{PVG,SHA}',

  intro = 'Eastern Miles is the loyalty program of China Eastern Airlines, one of China''s three major carriers, headquartered in Shanghai and a member of SkyTeam. Miles redeem across the SkyTeam network -- Delta, Air France, KLM and others -- as well as China Eastern''s own large domestic and intra-Asia route map.

For a US points-and-miles audience, Eastern Miles is mainly a program you earn by flying rather than one you fund from home. No major US bank currency transfers to Eastern Miles, and the old Marriott Bonvoy partnership ended in 2019, so there is no practical way to top up a balance from US cards. The more useful angle for US travelers is the reverse: book China Eastern flights using another SkyTeam program such as Flying Blue or Virgin Atlantic, or credit paid China Eastern flights to a SkyTeam program with better US access. Eastern Miles itself earns its keep for travelers already flying China Eastern in the region.',

  transfer_partners = '[]'::jsonb,

  how_to_spend = '- **SkyTeam award flights**: Redeem Eastern Miles on China Eastern and SkyTeam partners (Delta, Air France, KLM and others). China Eastern''s own network is strongest for intra-China and China-to-Asia routes.
- **Cabin upgrades and China Eastern flights**: Use miles to upgrade eligible fares or book China Eastern award seats, including its long-haul US routes from Shanghai.
- **Lounge access and other rewards**: Miles and status unlock China Eastern and SkyTeam lounge access on eligible flights; the program also offers the usual shopping and lifestyle redemptions, which return less value than flights.',

  sweet_spots = '- **Cheap intra-Asia flights on China Eastern**: Short regional redemptions on China Eastern metal price low -- Shanghai to Tokyo in economy is among the better-value short hops -- useful if you are already in the region with Eastern Miles to spend.
- **Book China Eastern metal through a better SkyTeam program**: Because US access to Eastern Miles is effectively nil, the stronger play for US flyers is to book China Eastern flights using Flying Blue or Virgin Atlantic points (both easy to fund from US cards) rather than trying to accumulate Eastern Miles.
- **Reality check**: Eastern Miles has essentially no US on-ramp -- no bank transfers and no current hotel partner -- and its award values are unremarkable. Treat it as a program for people flying China Eastern regularly, not as a target currency for US collectors.',

  tier_benefits = '[
    {
      "name": "Silver",
      "qualification": "20,000 standard miles or 16 flight segments in the qualification period; maps to SkyTeam Elite",
      "benefits": [
        "SkyTeam Elite recognition",
        "15% tier bonus on standard mileage earned (standard mileage = flight distance in km)",
        "Extra checked baggage and priority benefits on eligible flights",
        "Minimum 500 miles earned per flight (Minimum Standard Mileage Guarantee)"
      ]
    },
    {
      "name": "Gold",
      "qualification": "40,000 standard miles or 32 flight segments in the qualification period; maps to SkyTeam Elite Plus",
      "benefits": [
        "All Silver benefits",
        "SkyTeam Elite Plus recognition -- lounge access, priority check-in/boarding, and extra baggage across the alliance when flying SkyTeam internationally",
        "30% tier bonus on standard mileage earned",
        "Domestic lounge access"
      ]
    },
    {
      "name": "Platinum",
      "qualification": "A higher standard-mileage or segment threshold than Gold (verify the current requirement at ceair.com); maps to SkyTeam Elite Plus",
      "benefits": [
        "All Gold benefits",
        "SkyTeam Elite Plus recognition",
        "50% tier bonus on standard mileage earned",
        "The program''s highest priority handling and lounge access"
      ]
    }
  ]'::jsonb,

  lounge_access = 'China Eastern operates its own lounges at its Shanghai hubs and other airports. Eastern Miles lounge access is delivered through SkyTeam recognition:

- **Gold and Platinum (SkyTeam Elite Plus)** receive lounge access when flying SkyTeam-operated international flights, plus alliance-wide priority and extra baggage, and domestic lounge access on China Eastern.
- **Silver (SkyTeam Elite)** does not include general lounge access.

Lounge eligibility follows standard SkyTeam rules (same-day onward international travel on a SkyTeam carrier).',

  quirks = '- **SkyTeam member, Shanghai-based**: Eastern Miles earns and redeems across SkyTeam (Delta, Air France, KLM and more) in addition to China Eastern''s own network.
- **No US transfer access**: No major US bank currency transfers to Eastern Miles, and the Marriott Bonvoy partnership ended in 2019. Eastern Miles has international bank partners in some regions, but nothing that helps a US-based collector.
- **The US workaround**: To fly China Eastern on points, book its metal through another SkyTeam program -- Flying Blue or Virgin Atlantic -- both of which are easy to fund from US cards.
- **Miles expiry**: Eastern Miles expire 36 months after they are earned, and the account must see at least one earn or redemption every 18 months to stay active.
- **Minimum mileage guarantee**: Every flight earns at least 500 miles, even on very short segments.
- **Earning is distance-based**: Standard mileage equals the flight distance in kilometers, with a tier bonus on top (15% Silver, 30% Gold, 50% Platinum).',

  award_chart = 'China Eastern prices Eastern Miles awards using its own redemption structure rather than a single public chart, varying by route, cabin, and whether you fly China Eastern or a SkyTeam partner. Verify the point cost for a specific route at ceair.com before committing, as China Eastern adjusts pricing periodically.

**Highlights:**
- China Eastern''s own network is strongest for intra-China and China-to-Asia routes; short regional economy redemptions (for example, Shanghai to Tokyo) are among the better-value uses.
- SkyTeam partner awards reach Delta, Air France, KLM and others, with pricing and surcharges varying by partner.

**Earning:** Standard mileage equals flight distance in kilometers, plus a tier bonus (15% Silver, 30% Gold, 50% Platinum). Every flight earns at least 500 miles. Eastern Miles expire 36 months after earning.

**Transfers in:** None useful for US members -- no major US bank currency transfers to Eastern Miles, and the Marriott partnership ended in 2019. US travelers are better off booking China Eastern flights through another SkyTeam program such as Flying Blue or Virgin Atlantic.',

  content_updated_at = now(),
  updated_at = now()
where slug = 'china-eastern';
