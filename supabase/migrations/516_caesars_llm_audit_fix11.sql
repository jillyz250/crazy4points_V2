-- Fix 3 LLM-audit findings (round 11):
-- 1. quirks: sportsbook TC heading clarification.
-- 2+3. tier_benefits: "Tier Score" -> "Tier Credits" for Seven Stars Elite thresholds.
--      Note: the official Seven Stars page uses "Tier Score" for these elite thresholds;
--      however, "Tier Credits" matches the standard naming used elsewhere in the program.

update programs set
  quirks = replace(quirks,
    E'- **Sportsbook TCs count toward Tier Score (with limits).** Online sports betting',
    E'- **Sportsbook TCs earn toward your annual Tier Score, with one key exclusion.** Online sports betting'),

  tier_benefits = replace(replace(tier_benefits::text,
    '"Seven Stars Elite tier at 500,000 Tier Score: advanced priority booking for Signature Events and invitation to attend all Signature Events"',
    '"Seven Stars Elite at 500,000 Tier Credits: advanced priority booking for Signature Events and invitation to attend all Signature Events"'),
    '"Seven Stars Elite at 1,000,000 Tier Score: additional exclusive benefits (details at caesars.com/myrewards/sevenstars/elite-benefits)"',
    '"Seven Stars Elite at 1,000,000 Tier Credits: additional exclusive benefits (details at caesars.com/myrewards/sevenstars/elite-benefits)"')::jsonb,

  updated_at = now()
where slug = 'caesars';
