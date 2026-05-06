-- REVERT migrations 192 + 193 Southwest "closed ecosystem" claims.
--
-- The truth (verified via AwardWallet's Chase Travel guide + Chase's own
-- published partner list 2026): Chase Ultimate Rewards DOES transfer 1:1
-- to Southwest Rapid Rewards. Southwest IS a Chase UR transfer partner.
-- The transferred points DO NOT count toward Companion Pass-qualifying
-- points (CPQP) or Tier-Qualifying Points (TQP) - only Southwest co-brand
-- card spend and revenue flights earn those. That nuance is correct.
--
-- The Copilot Master Fact Sheet incorrectly framed Southwest as a "closed
-- ecosystem" with no flexible-currency access. I integrated that without
-- verification, then made it worse in mig 193 by deleting the page's
-- ORIGINAL CORRECT statement when Sonnet flagged the contradiction.
--
-- This migration restores the correct content + removes the wrong addition.

-- Restore the correct Chase UR transfer statement to intro:
update programs set
  intro = replace(intro,
    '**Southwest Rapid Rewards is a closed ecosystem** - no flexible-currency program (Chase UR, Amex MR, Citi TYP, Capital One Miles, Bilt) transfers to Rapid Rewards points. The only credit card path is the Southwest co-branded Chase cards.',
    '**Chase Ultimate Rewards transfers 1:1 instantly to Southwest Rapid Rewards** (though transferred points do NOT count toward Companion Pass-qualifying points or A-List Tier-Qualifying Points - only Southwest co-brand card spend and revenue flights earn those). Among the cleanest flexible-currency on-ramps in the industry. **Amex MR, Citi TYP, Capital One Miles, and Bilt do not transfer to Southwest** - the Chase UR pipeline is the only flexible-currency path. Southwest flights are also bookable via the Chase Travel Portal at fixed cents-per-point rates (1.0-1.5 cpp depending on card).'
  ),
  updated_at = now()
where slug = 'southwest';

-- Remove the wrong "closed ecosystem" line added by mig 192 to quirks:
update programs set
  quirks = replace(quirks,
    '
- **Chase Ultimate Rewards does NOT transfer to Southwest** - closed ecosystem. The only credit card path to Rapid Rewards points is the Southwest Chase co-brand cards.',
    '
- **Chase Ultimate Rewards transfers 1:1 to Southwest Rapid Rewards** (instant). Southwest IS a Chase UR transfer partner - this is the only flexible-currency on-ramp to Rapid Rewards points. **Transferred points do NOT count toward Companion Pass-qualifying points or A-List Tier-Qualifying Points** - those require Southwest co-brand card spend or revenue flights.
- **Amex MR, Citi TYP, Capital One Miles, and Bilt do NOT transfer to Southwest.** Chase UR is the only flexible-currency path.
- **Chase Travel Portal**: Southwest flights are bookable through the Chase Travel Portal at fixed cents-per-point rates (1.0-1.5 cpp depending on card). This is a separate path from the UR -> Rapid Rewards transfer; the booking acts like a paid Southwest fare and earns Rapid Rewards points + Tier-Qualifying Points.'
  ),
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'southwest';
