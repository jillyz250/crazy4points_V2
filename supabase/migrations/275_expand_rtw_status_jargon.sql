-- Expand opaque points-and-miles abbreviations on first mention.
--
-- RTW         → round-the-world (RTW)
-- TQP / TQPs  → tier-qualifying points (TQP) / (TQPs)
-- MQD         → medallion qualification dollars (MQD)
-- PQP         → premier qualifying points (PQP)
-- CPQP        → Companion Pass qualifying points (CPQP)
--
-- Strategy: regexp_replace WITHOUT the 'g' flag expands only the FIRST
-- occurrence per text row. Subsequent mentions in the same paragraph
-- stay abbreviated (avoids "tier-qualifying points (TQP) earning... earn
-- 1,500 tier-qualifying points (TQPs) per $5K..." soup). Reader learns
-- the term once, then sees the abbreviation.
--
-- Word-boundary regex (\m…\M) prevents accidental damage to other text
-- containing these letter sequences (RTW could in theory appear in a
-- typo or surname).
--
-- Order matters: TQPs (plural) must run after TQP (singular) so the
-- singular pattern doesn't first-match inside a row that also has the
-- plural. Postgres regex engine evaluates left-to-right per call, so
-- doing TQPs in a separate statement ensures plural gets its own
-- first-mention expansion.

-- ── RTW → round-the-world ──────────────────────────────────────────────
update programs set
  intro = regexp_replace(coalesce(intro, ''), '\mRTW\M', 'round-the-world (RTW)'),
  sweet_spots = regexp_replace(coalesce(sweet_spots, ''), '\mRTW\M', 'round-the-world (RTW)'),
  lounge_access = regexp_replace(coalesce(lounge_access, ''), '\mRTW\M', 'round-the-world (RTW)'),
  quirks = regexp_replace(coalesce(quirks, ''), '\mRTW\M', 'round-the-world (RTW)'),
  award_chart = regexp_replace(coalesce(award_chart, ''), '\mRTW\M', 'round-the-world (RTW)'),
  marquee_pitch = regexp_replace(coalesce(marquee_pitch, ''), '\mRTW\M', 'round-the-world (RTW)')
where intro ~ '\mRTW\M' or sweet_spots ~ '\mRTW\M' or lounge_access ~ '\mRTW\M'
   or quirks ~ '\mRTW\M' or award_chart ~ '\mRTW\M' or marquee_pitch ~ '\mRTW\M';

update partner_redemptions set
  notes = regexp_replace(coalesce(notes, ''), '\mRTW\M', 'round-the-world (RTW)'),
  routing_rules = regexp_replace(coalesce(routing_rules, ''), '\mRTW\M', 'round-the-world (RTW)'),
  availability_reality = regexp_replace(coalesce(availability_reality, ''), '\mRTW\M', 'round-the-world (RTW)')
where notes ~ '\mRTW\M' or routing_rules ~ '\mRTW\M' or availability_reality ~ '\mRTW\M';

update alerts set
  summary = regexp_replace(coalesce(summary, ''), '\mRTW\M', 'round-the-world (RTW)')
where summary ~ '\mRTW\M';

-- ── TQP / TQPs → tier-qualifying points (American AAdvantage + Southwest) ──
update programs set
  intro = regexp_replace(coalesce(intro, ''), '\mTQPs\M', 'tier-qualifying points (TQPs)'),
  sweet_spots = regexp_replace(coalesce(sweet_spots, ''), '\mTQPs\M', 'tier-qualifying points (TQPs)'),
  quirks = regexp_replace(coalesce(quirks, ''), '\mTQPs\M', 'tier-qualifying points (TQPs)'),
  award_chart = regexp_replace(coalesce(award_chart, ''), '\mTQPs\M', 'tier-qualifying points (TQPs)')
where intro ~ '\mTQPs\M' or sweet_spots ~ '\mTQPs\M' or quirks ~ '\mTQPs\M' or award_chart ~ '\mTQPs\M';

update programs set
  intro = regexp_replace(coalesce(intro, ''), '\mTQP\M', 'tier-qualifying points (TQP)'),
  sweet_spots = regexp_replace(coalesce(sweet_spots, ''), '\mTQP\M', 'tier-qualifying points (TQP)'),
  quirks = regexp_replace(coalesce(quirks, ''), '\mTQP\M', 'tier-qualifying points (TQP)'),
  award_chart = regexp_replace(coalesce(award_chart, ''), '\mTQP\M', 'tier-qualifying points (TQP)')
where intro ~ '\mTQP\M' or sweet_spots ~ '\mTQP\M' or quirks ~ '\mTQP\M' or award_chart ~ '\mTQP\M';

-- ── MQD → medallion qualification dollars (Delta SkyMiles) ────────────
update programs set
  intro = regexp_replace(coalesce(intro, ''), '\mMQD\M', 'medallion qualification dollars (MQD)'),
  sweet_spots = regexp_replace(coalesce(sweet_spots, ''), '\mMQD\M', 'medallion qualification dollars (MQD)'),
  quirks = regexp_replace(coalesce(quirks, ''), '\mMQD\M', 'medallion qualification dollars (MQD)'),
  award_chart = regexp_replace(coalesce(award_chart, ''), '\mMQD\M', 'medallion qualification dollars (MQD)')
where intro ~ '\mMQD\M' or sweet_spots ~ '\mMQD\M' or quirks ~ '\mMQD\M' or award_chart ~ '\mMQD\M';

-- ── PQP → premier qualifying points (United MileagePlus) ──────────────
update programs set
  intro = regexp_replace(coalesce(intro, ''), '\mPQP\M', 'premier qualifying points (PQP)'),
  sweet_spots = regexp_replace(coalesce(sweet_spots, ''), '\mPQP\M', 'premier qualifying points (PQP)'),
  quirks = regexp_replace(coalesce(quirks, ''), '\mPQP\M', 'premier qualifying points (PQP)'),
  award_chart = regexp_replace(coalesce(award_chart, ''), '\mPQP\M', 'premier qualifying points (PQP)')
where intro ~ '\mPQP\M' or sweet_spots ~ '\mPQP\M' or quirks ~ '\mPQP\M' or award_chart ~ '\mPQP\M';

-- ── CPQP → Companion Pass qualifying points (Southwest Rapid Rewards) ──
update programs set
  intro = regexp_replace(coalesce(intro, ''), '\mCPQP\M', 'Companion Pass qualifying points (CPQP)'),
  sweet_spots = regexp_replace(coalesce(sweet_spots, ''), '\mCPQP\M', 'Companion Pass qualifying points (CPQP)'),
  quirks = regexp_replace(coalesce(quirks, ''), '\mCPQP\M', 'Companion Pass qualifying points (CPQP)'),
  award_chart = regexp_replace(coalesce(award_chart, ''), '\mCPQP\M', 'Companion Pass qualifying points (CPQP)')
where intro ~ '\mCPQP\M' or sweet_spots ~ '\mCPQP\M' or quirks ~ '\mCPQP\M' or award_chart ~ '\mCPQP\M';

-- ── Verification queries ──────────────────────────────────────────────
-- First-mention expansion should leave subsequent mentions abbreviated.
-- Confirm expansions present:
--   select slug, substring(intro, 1, 200) from programs
--   where intro like '%round-the-world (RTW)%' or intro like '%tier-qualifying points%';
