-- Translate industry jargon → plain English across card benefit descriptions.
--
-- Three patterns:
--   1. "common carrier" (10 cards, insurance descriptions) → "scheduled travel
--      (plane, train, ship, or bus)"
--   2. "Covered Purchase" / "Covered Purchases" (4 cards) → "eligible
--      purchase" / "eligible purchases"
--   3. "CDW" + the surrounding "declining CDW" boilerplate (5 cards) →
--      hand-rewritten per-card auto rental descriptions
--
-- Companion code change: utils/cards/cardExtractionPrompt.ts now instructs
-- Sonnet to translate these terms in description fields going forward
-- (source_quote field stays verbatim). So this is a one-time backfill
-- across the cards extracted before that prompt change.

-- ──────────────────────────────────────────────────────────────────────
-- 1) Global "common carrier" expansion
-- ──────────────────────────────────────────────────────────────────────
-- "common carrier travel" → "scheduled travel (plane, train, ship, or bus)"
UPDATE credit_card_benefits
   SET description = replace(description, 'common carrier travel', 'scheduled travel (plane, train, ship, or bus)'),
       updated_at = now()
 WHERE description ILIKE '%common carrier travel%';

-- "Common Carrier Vehicle" (capitalized as a defined term) → "plane, train, ship, or bus"
UPDATE credit_card_benefits
   SET description = replace(description, 'Common Carrier Vehicle', 'scheduled transit (plane, train, ship, or bus)'),
       updated_at = now()
 WHERE description ILIKE '%Common Carrier Vehicle%';

-- Bare "common carrier" (lowercase, no surrounding "travel" or "Vehicle")
UPDATE credit_card_benefits
   SET description = regexp_replace(description, 'common carrier(?! travel| vehicle)', 'scheduled transit (plane, train, ship, or bus)', 'gi'),
       updated_at = now()
 WHERE description ~* 'common carrier(?! travel| vehicle)';

-- ──────────────────────────────────────────────────────────────────────
-- 2) "Covered Purchase" → "eligible purchase"
-- ──────────────────────────────────────────────────────────────────────
UPDATE credit_card_benefits
   SET description = regexp_replace(description, 'Covered Purchases', 'eligible purchases', 'g'),
       updated_at = now()
 WHERE description LIKE '%Covered Purchases%';

UPDATE credit_card_benefits
   SET description = regexp_replace(description, 'Covered Purchase', 'eligible purchase', 'g'),
       updated_at = now()
 WHERE description LIKE '%Covered Purchase%';

-- ──────────────────────────────────────────────────────────────────────
-- 3) CDW rewrites (5 cards — hand-crafted plain English)
-- ──────────────────────────────────────────────────────────────────────

-- Marriott Bonvoy Brilliant
UPDATE credit_card_benefits
   SET description = 'Charge the full rental to this card and decline the rental counter''s damage-coverage upsell (the CDW pitch). Card coverage takes over for theft or collision damage. Note: secondary coverage in the US (your personal auto insurance pays first). Not available in Australia, Italy, or New Zealand. No liability coverage.',
       updated_at = now()
 WHERE card_id = (SELECT id FROM credit_cards WHERE slug = 'marriott-bonvoy-brilliant')
   AND name = 'Car Rental Loss and Damage Insurance';

-- Marriott Bonvoy Bevy
UPDATE credit_card_benefits
   SET description = 'Charge the full rental to this card and decline the rental counter''s damage-coverage upsell. Card coverage takes over for theft or collision damage as secondary coverage (your personal auto insurance pays first in the US). Not available in Australia, Italy, or New Zealand. No liability coverage.',
       updated_at = now()
 WHERE card_id = (SELECT id FROM credit_cards WHERE slug = 'amex-marriott-bonvoy-bevy')
   AND name = 'Car Rental Loss and Damage Insurance';

-- Marriott Bonvoy Business
UPDATE credit_card_benefits
   SET description = 'Charge the full rental to this card and decline the rental counter''s damage-coverage upsell. Secondary coverage for theft or collision damage in covered countries. Not available in Australia, Italy, or New Zealand. No liability coverage. (See Premium Car Rental Protection for paid primary coverage option.)',
       updated_at = now()
 WHERE card_id = (SELECT id FROM credit_cards WHERE slug = 'amex-marriott-bonvoy-business')
   AND name = 'Car Rental Loss and Damage Insurance';

-- Chase World of Hyatt (personal) — already mentions "decline at the counter"; just expand CDW
UPDATE credit_card_benefits
   SET description = replace(description, 'declining CDW', 'declining the rental counter''s damage-coverage upsell (the CDW pitch)'),
       updated_at = now()
 WHERE card_id = (SELECT id FROM credit_cards WHERE slug = 'chase-world-of-hyatt')
   AND description ILIKE '%CDW%';

-- Amex Platinum
UPDATE credit_card_benefits
   SET description = replace(description, 'declining CDW', 'declining the rental counter''s damage-coverage upsell (the CDW pitch)'),
       updated_at = now()
 WHERE card_id = (SELECT id FROM credit_cards WHERE slug = 'amex-platinum')
   AND description ILIKE '%CDW%';

-- ──────────────────────────────────────────────────────────────────────
-- Verify — should return 0 rows with raw "CDW" or "common carrier" jargon
-- (acceptable: "common carrier" inside the abbreviation expansions we kept)
-- ──────────────────────────────────────────────────────────────────────
SELECT c.slug, b.name,
       CASE
         WHEN b.description ~* '\bCDW\b' THEN 'CDW'
         WHEN b.description ~* 'common carrier(?! \()' THEN 'common carrier'
         WHEN b.description LIKE '%Covered Purchase%' THEN 'Covered Purchase'
         ELSE NULL
       END AS still_jargon
  FROM credit_card_benefits b
  JOIN credit_cards c ON c.id = b.card_id
 WHERE b.description ~* '(\bCDW\b|common carrier(?! \()|Covered Purchase)'
 ORDER BY c.slug, b.name;
