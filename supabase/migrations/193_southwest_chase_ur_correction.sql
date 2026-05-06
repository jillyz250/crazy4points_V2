-- Critical correction: Southwest intro previously said "Chase Ultimate Rewards
-- still transfers 1:1 instantly" — that is FACTUALLY WRONG. Southwest is a
-- closed ecosystem; no flexible-currency program transfers to Rapid Rewards
-- (verified by southwest.com Rapid Rewards earning page + multiple official
-- sources). The only credit card path to Rapid Rewards is the Southwest
-- Chase co-brand cards.
--
-- Bilt was also incorrectly listed as a 2025 transfer addition - Bilt does
-- not transfer to Southwest either.
--
-- Sonnet caught this contradiction during the May 2026 verified-refresh
-- audit (mig 192).

update programs set
  intro = replace(replace(replace(intro,
    '**Chase Ultimate Rewards still transfers 1:1 instantly (though transfers do not count toward Companion Pass or A-List Tier Qualifying Points - only Southwest co-brand card spend and revenue flights earn CPQP/TQPs)**, among the cleanest flexible-currency on-ramps in the industry.',
    '**Southwest Rapid Rewards is a closed ecosystem** - no flexible-currency program (Chase UR, Amex MR, Citi TYP, Capital One Miles, Bilt) transfers to Rapid Rewards points. The only credit card path is the Southwest co-branded Chase cards.'
  ),
    ' — though Chase UR transfers do NOT count toward Companion Pass qualifying points (only Southwest Rapid Rewards co-brand card spend and revenue flights earn CPQP). **Bilt was added in 2025** at 1:1 with the same caveat.',
    ''
  ),
    'Bilt was added in 2025** at 1:1 with the same caveat. ',
    ''
  ),
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'southwest';
