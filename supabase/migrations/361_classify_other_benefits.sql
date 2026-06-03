-- ============================================================================
-- 361 - Classify the filterable benefits hiding in benefit_type='other' /
-- 'spend_unlock_perk' (benefit_family was left NULL by 359).
--
-- Audit of the 261 NULL rows (176 distinct names) found a mix: ~100 are real,
-- filterable benefits (seat upgrades, award-flight discounts, brand credits,
-- elite-night credits, lounge access, PQP/status credits) and ~80 are genuinely
-- non-filterable (FX fee, Pay Over Time, fraud monitoring, FICO, points-don't-
-- expire, redemption options, business utilities).
--
-- This maps the filterable ones by EXACT NAME (no fuzzy patterns -> no mis-hits)
-- into the frozen benefit_family enum + provider. Anything NOT listed here stays
-- NULL on purpose (genuine misc -> excluded from family filters, still shown on
-- the card). Conservative: ambiguous names left NULL.
--
-- Reversible (re-null by name). availability_type already set by 359.
-- Apply: supabase db query --linked --file supabase/migrations/361_classify_other_benefits.sql
-- ============================================================================
begin;

create temporary table _cls (name text, family text, provider text) on commit drop;
insert into _cls (name, family, provider) values
-- HOTEL ---------------------------------------------------------------------
('15 Elite Night Credits','hotel',null),
('15 Elite Night Credits Per Year','hotel',null),
('25 Elite Night Credits','hotel',null),
('Elite Night Credits','hotel',null),
('Earn Elite Night Credits via Spend','hotel',null),
('10% Points Discount on Free Night Redemptions','hotel',null),
('10% Points Redemption Discount on Free Nights','hotel',null),
('4th Night Free on Award Stays','hotel',null),
('Redeem 3 Nights, Get 4th Night Free','hotel',null),
('Redeem Marriott Bonvoy Points for Free Nights','hotel','Marriott Bonvoy'),
('Redeem Marriott Bonvoy® Points for Free Nights','hotel','Marriott Bonvoy'),
('Cardmember Booking Discount','hotel',null),
('Marriott Bonvoy Room Rate Discount (7%)','hotel','Marriott Bonvoy'),
('Complimentary Wi-Fi at Marriott Bonvoy Hotels','hotel','Marriott Bonvoy'),
('Premium On-Property Internet Access','hotel',null),
('Early Access to IHG Reward Night Sales','hotel','IHG One Rewards'),
('1,000 Bonus Points Per Eligible Stay','hotel',null),
('Marriott Bonvoy® 1,000 Bonus Points per Stay','hotel','Marriott Bonvoy'),
('Fine Hotels + Resorts® Program','hotel','Fine Hotels + Resorts'),
('The Hotel Collection — $100 Property Credit','hotel','The Hotel Collection'),
('Ritz-Carlton Club Level Upgrade Certificates','hotel','Ritz-Carlton'),
('Hyatt Leverage Membership','hotel','World of Hyatt'),
('$550+ in Value When You Stay with The Edit','hotel','The Edit'),
('Marriott Bonvoy Chase Credit Card Events','hotel','Marriott Bonvoy'),
('Marriott Bonvoy Chase Credit Card Events & Experiences','hotel','Marriott Bonvoy'),
('Marriott Bonvoy Chase Credit Card Events Access','hotel','Marriott Bonvoy'),
('Access to Marriott Bonvoy Chase Credit Card Events','hotel','Marriott Bonvoy'),
('Brilliant Earned Choice Award','hotel','Marriott Bonvoy'),
-- AIRLINE -------------------------------------------------------------------
('25% Back on Inflight Purchases','airline',null),
('25% Back on United Inflight Purchases','airline','United'),
('25% Back on United Inflight and Club Premium Drink Purchases','airline','United'),
('10,000-Mile Award Flight Discount','airline',null),
('10,000-Mile Award Flight Discount after $20,000 Spend','airline',null),
('Annual 10,000-Mile Award Flight Discount (Anniversary)','airline',null),
('10% Discount on Award Flights After $10K Spend','airline',null),
('10% Savings on Award Flights','airline',null),
('10% Discount on Iberia Flights','airline','Iberia'),
('10% Flight Discount Promo Code','airline',null),
('10% Off British Airways Flights Starting in the US','airline','British Airways'),
('Miles Discount on Award Flights','airline',null),
('Save at Least 10% on United Award Flights','airline','United'),
('Save at Least 10% on United Flights Booked with Miles','airline','United'),
('Unlimited Reward Seats — No Blackout Dates','airline',null),
('Unlimited Reward Seats','airline',null),
('No Blackout Dates or Seat Restrictions','airline',null),
('Complimentary Preferred Seat','airline',null),
('Complimentary Preferred Seat at Booking','airline',null),
('Complimentary Preferred Seat Selection','airline',null),
('Complimentary Standard Seat Selection','airline',null),
('Complimentary Premier Upgrades on Award Tickets','airline',null),
('Premier Upgrades on Award Tickets','airline',null),
('Economy Plus Seat Upgrades','airline','United'),
('2 Global Economy Plus Seat Upgrades after $40,000 Spend','airline','United'),
('Extra Legroom Seat Upgrade','airline',null),
('FareLock Credit','airline','United'),
('Aeroplan Stopover Award on International Trips','airline','Aeroplan'),
('$1,000 Airfare Discount Voucher','airline',null),
('No Cash Surcharges on Air Canada Flight Rewards','airline','Air Canada'),
('Preferred Pricing on Flight Rewards','airline',null),
('Use Avios to Pay Taxes, Fees, and Carrier Charges','airline',null),
-- LOUNGE --------------------------------------------------------------------
('Star Alliance Lounge Access (All Access Tier)','lounge','Star Alliance'),
('Existing United Club Membership Reimbursement','lounge','United Club'),
('4 United Club One-Time Passes (Anniversary)','lounge','United Club'),
-- STATUS --------------------------------------------------------------------
('Status Qualifying Credits (SQC) — Up to 25,000 per year','status',null),
('PQP Earning from Card Spend','status','United'),
('Up to 18,000 PQP Per Year from Card Spend','status','United'),
('1,000 Card Bonus PQP Each Year','status','United'),
('1,500 Card Bonus Premier Qualifying Points (PQP) Annually','status','United'),
('Tier-Qualifying Night Credits','status',null),
('2 Tier-Qualifying Night Credits per $5,000 Spend','status',null),
('5 Tier-Qualifying Night Credits per Calendar Year','status',null),
-- CREDIT (statement credits, by provider) -----------------------------------
('Instacart Credit','credit','Instacart'),
('Instacart Monthly Credit','credit','Instacart'),
('Up to $120 Annual Instacart Credit','credit','Instacart'),
('Up to $180 Instacart Credit','credit','Instacart'),
('$300 lululemon Credit','credit','lululemon'),
('$200 Oura Ring Credit','credit','Oura'),
('Up to $200 Annual Blacklane Credit','credit','Blacklane'),
('Up to $200 Annual Splurge Credit','credit',null),
('Up to $50 Annual Avis/Budget Car Rental Credit','credit','Avis / Budget'),
('Up to $60 Annual Rideshare Credit','credit',null),
('Citigold Banking Relationship Credit','credit','Citigold'),
('Citigold Private Client First-Year + Annual Credit','credit','Citigold'),
('$25 Statement Credit for Enrolling in Automatic Payments','credit',null),
('$250 Credit for The Shops at Chase ($75K Spend)','credit','Shops at Chase'),
-- EARNING -------------------------------------------------------------------
('Anniversary Bonus Points','earning',null),
('6,000 Anniversary Bonus Points','earning',null),
('3,000 Anniversary Bonus Points','earning',null),
('7,500 Anniversary Points','earning',null),
('10% Anniversary Points Bonus','earning',null),
('10% Bonus on Ultimate Rewards Points Transfers','earning','Chase Ultimate Rewards'),
('10% Redemption Bonus','earning',null),
('Balance Transfer Points Earn','earning',null),
('10,000 Annual Bonus Points after $10,000 Spend','earning',null),
('5,000-Mile Better-Together Anniversary Bonus','earning','Southwest Rapid Rewards'),
('Refer a Friend Rewards','earning',null),
('Refer a Friend Bonus Points','earning',null),
('Refer-a-Friend Bonus Points','earning',null),
('Referral Bonus — Earn up to 50,000 Bonus Points per Year','earning',null),
('Referral Bonus — Refer Business Owners','earning',null),
('Referral Bonus — Up to 50,000 Points per Year','earning',null),
-- INSURANCE / PROTECTION ----------------------------------------------------
('Travel and Emergency Assistance','insurance',null),
('Travel & Purchase Coverage','insurance',null),
('Travel and Purchase Protection Bundle','protection',null),
('Mastercard ID Theft Protection','protection','Mastercard'),
('Premium Global Assist® Hotline','insurance',null),
-- PERK ----------------------------------------------------------------------
('Amex Offers','perk','Amex Offers'),
('Chase Offers','perk','Chase Offers'),
('Citi Entertainment','perk','Citi Entertainment'),
('Amex Special Ticket Access','perk',null),
('Amex Special Ticket Access (Presale & Reserved Tickets)','perk',null),
('American Express Venue Collection™','perk',null),
('Shop Small (American Express Maps)','perk',null),
('DashPass Complimentary Access','perk','DoorDash'),
('Instacart+ Complimentary Membership','perk','Instacart'),
('Relationship Care® Service','perk',null);

update credit_card_benefits b set
  benefit_family = c.family,
  provider = coalesce(b.provider, c.provider)
from _cls c
where b.name = c.name and b.benefit_family is null;

commit;
