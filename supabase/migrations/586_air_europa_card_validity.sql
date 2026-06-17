-- Clarify "card validity" (Air Europa calls tiers "Cards") to "status validity period" -- and keep
-- it accurate: tier validity is 12 months from achievement, NOT the calendar year the LLM suggested.
update programs set
  tier_benefits = replace(tier_benefits::text,
    'Two intercontinental Business Class upgrades during the card validity (request up to 24 hours before the flight, subject to space)',
    'Two intercontinental Business Class upgrades during the 12-month Platinum status validity period (request up to 24 hours before the flight, subject to space)')::jsonb,
  updated_at = now()
where slug = 'air-europa';
