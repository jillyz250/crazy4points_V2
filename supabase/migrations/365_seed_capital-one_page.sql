-- ============================================================================
-- 365 - Seed the Capital One Miles currency page (first authored currency).
-- Editorial fields + verified transfer_partners_outbound (22 partners, from the
-- official Capital One transfer-partner page, 2026-01-29). Virgin Red is Cap
-- One's actual partner (group-wide Virgin club). Intro uses count tokens.
-- ASCII-only per the SQL-data rule. Sets content_updated_at so the page renders.
-- ============================================================================
update programs set
  alliance = 'none',
  intro = 'Capital One Miles are the easygoing flexible currency. You earn them at a flat rate on every purchase - no rotating categories, no spending-bonus gymnastics - and at redemption time they punch above their weight. Capital One transfers to {capital-one_airline_count} airline and {capital-one_hotel_count} hotel partners, most at a clean 1:1, which turns everyday-earn miles into international business class, off-peak Europe, and a few genuinely sneaky sweet spots. The catch is the usual one: the miles are worth the most once you have a specific award in mind, and transfers are one-way. Find the seat first, then move the points.',
  how_to_spend = '- Transfer to airline and hotel partners - the highest-value play (see sweet spots).
- "Purchase Eraser" - wipe travel charges (flights, hotels, rental cars) at 1 cent per mile.
- Book through Capital One Travel at 1 cent per mile.
- Gift cards, Amazon/PayPal checkout, cash back - all weaker (often under 1 cent); only if you are not chasing travel.',
  sweet_spots = '- Aeroplan (1:1) - fixed partner pricing plus a free stopover; around 60k one-way to Europe in business on Lufthansa, Swiss, or Austrian.
- Qatar Privilege Club (1:1) - Qsuites business, one of the best seats in the sky.
- Turkish Miles&Smiles (1:1) - the cult pick: around 10k one-way for United-operated US to Hawaii economy; business to Turkey from about 65k.
- Singapore KrisFlyer (1:1) - Suites and long-haul Asia premium cabins (about 80k to 120k one-way).
- British Airways / Avios (1:1) - short-haul off-peak US East Coast to Europe from about 13k.
- Flying Blue (1:1) - monthly Promo Rewards take 20 to 50 percent off select Europe awards.',
  quirks = '- Transfers are one-way and final - you cannot move miles back to Capital One.
- 1,000-mile minimum per transfer; the name on your Capital One account must match the loyalty account.
- No transfer fee or excise-tax pass-through (unlike some Amex transfers to US airlines).
- Most ratios are 1:1 - check the exceptions: Emirates, EVA Air, and JAL convert at 2:1.5 (1,000 = 750), and JetBlue at 5:3 (1,000 = 600). I Prefer is the rare ratio in your favor at 1:2.
- Capital One''s partner roster changes periodically (their Virgin partner is Virgin Red, the group-wide Virgin club, not Virgin Atlantic Flying Club directly).',
  transfer_partners_outbound = '[
    {"from_slug":"aeromexico","ratio":"1:1","bonus_active":false,"notes":"No transfer fee."},
    {"from_slug":"aeroplan","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Free stopover on partner awards."},
    {"from_slug":"avianca","ratio":"1:1","bonus_active":false,"notes":"No transfer fee."},
    {"from_slug":"ba-avios","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Avios usable across the BA/Iberia/Aer Lingus family via Combine My Avios."},
    {"from_slug":"cathay","ratio":"1:1","bonus_active":false,"notes":"No transfer fee."},
    {"from_slug":"etihad","ratio":"1:1","bonus_active":false,"notes":"No transfer fee."},
    {"from_slug":"finnair","ratio":"1:1","bonus_active":false,"notes":"No transfer fee."},
    {"from_slug":"flying-blue","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Air France-KLM; monthly Promo Rewards discounts."},
    {"from_slug":"qantas","ratio":"1:1","bonus_active":false,"notes":"No transfer fee."},
    {"from_slug":"qatar","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Books Qsuites business."},
    {"from_slug":"krisflyer","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Singapore Suites + own-metal premium."},
    {"from_slug":"tap","ratio":"1:1","bonus_active":false,"notes":"No transfer fee."},
    {"from_slug":"turkish","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. US-Hawaii on United from 10k one-way."},
    {"from_slug":"virgin-red","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. Group-wide Virgin rewards club (move on to Virgin Atlantic Flying Club)."},
    {"from_slug":"emirates","ratio":"2:1.5","bonus_active":false,"notes":"No transfer fee. 1,000 miles = 750 Skywards."},
    {"from_slug":"eva-air","ratio":"2:1.5","bonus_active":false,"notes":"No transfer fee. 1,000 miles = 750 Infinity MileageLands."},
    {"from_slug":"jal","ratio":"2:1.5","bonus_active":false,"notes":"No transfer fee. 1,000 miles = 750 Mileage Bank."},
    {"from_slug":"jetblue","ratio":"5:3","bonus_active":false,"notes":"No transfer fee. 1,000 miles = 600 TrueBlue (the weakest ratio)."},
    {"from_slug":"choice","ratio":"1:1","bonus_active":false,"notes":"No transfer fee. US-based Choice Privileges accounts only."},
    {"from_slug":"wyndham","ratio":"1:1","bonus_active":false,"notes":"No transfer fee."},
    {"from_slug":"iprefer","ratio":"1:2","bonus_active":false,"notes":"No transfer fee. 1,000 miles = 2,000 iPrefer (ratio in your favor; iPrefer points are fixed/lower value)."},
    {"from_slug":"accor","ratio":"2:1","bonus_active":false,"notes":"No transfer fee. 1,000 miles = 500 ALL Reward points."}
  ]'::jsonb,
  last_verified = now(),
  content_updated_at = now(),
  is_active = true,
  is_reference_stub = false,
  updated_at = now()
where slug = 'capital-one';

select slug, (content_updated_at is not null) has_content, jsonb_array_length(transfer_partners_outbound) tp_count from programs where slug='capital-one';
