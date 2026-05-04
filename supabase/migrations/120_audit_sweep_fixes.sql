-- Apply HIGH-severity audit findings from the cross-program sweep
-- (re-audit run after the new prompt rules landed in PR #325).
-- The auto-generated apply-llm-audit migration broke on JSONB string
-- replacement (colons inside JSON values). Hand-writing the HIGH fixes
-- here. MEDIUM findings deferred to a follow-up sweep.
--
-- Six HIGH findings across delta + marriott-bonvoy + southwest:
--
-- DELTA (2):
--   - lounge_access table over-detailed Sky Club card mechanics (visit
--     caps, per-visit fees, $75K-spend unlimited threshold). Card-page
--     details per feedback_no_card_af_on_program_pages. Simplify to just
--     "access included; see card page for current terms".
--
-- MARRIOTT (1):
--   - Chase UR transfer bonus end-dates presented as settled facts.
--     Already partially hedged but Sonnet wants a stronger anchor.
--
-- SOUTHWEST (3):
--   - Discontinued "Plus Business" Chase card listed alongside active
--     ones. Remove or label as legacy.
--   - Inconsistent "five Southwest co-brand card types" count.
--   - **Critical bug**: literal LLM-instruction text "Remove this
--     benefit from the A-List Preferred list entirely..." rendering as
--     a benefit in production. From a prior audit-fix that ran wrong.

-- ============================================================
-- Southwest fix 1: remove editorial-leak from A-List Preferred benefits
-- ============================================================
update programs set
  tier_benefits = (
    select jsonb_agg(
      case
        when t->>'name' = 'A-List Preferred'
          then jsonb_set(
            t,
            '{benefits}',
            (select jsonb_agg(b)
             from jsonb_array_elements(t->'benefits') b
             where b::text not like '%Remove this benefit from the A-List Preferred list entirely%')
          )
        else t
      end
    )
    from jsonb_array_elements(tier_benefits) t
  ),
  last_verified = now(),
  updated_at = now()
where slug = 'southwest';

-- ============================================================
-- Southwest fix 2: simplify quirks card list (remove Plus Business as
-- discontinued, fix card-count claim)
-- ============================================================
update programs set
  quirks = replace(
    replace(quirks,
      '**Card TQP earning is restricted to higher-AF Chase Southwest cards.** Premier and Priority earn 1,500 TQPs per $5K spend; Premier Business earns 2,000 TQPs per $5K. Plus, Plus Business, and Employee cards do not earn TQPs.',
      '**Card TQP earning is restricted to certain Chase Southwest cards.** Premier and Priority earn 1,500 TQPs per $5K spend; Premier Business earns 2,000 TQPs per $5K; Performance Business earns 1,500 TQPs per $5K. The basic Plus card does not earn TQPs. Card lineup changes periodically - verify current TQP earn rules on Chase''s product pages.'
    ),
    '**All five Southwest co-brand card types'' spend earns Companion Pass Qualifying Points**',
    '**All actively-issued Southwest co-brand cards'' spend earns Companion Pass Qualifying Points**'
  )
where slug = 'southwest';

-- ============================================================
-- Marriott fix: stronger hedge on Chase UR transfer bonus dates
-- ============================================================
update programs set
  transfer_partners = replace(transfer_partners::text,
    'Active 65% transfer bonus through May 15, 2026 (1,000 UR = 1,650 Bonvoy points), dropping to 55% May 16 - June 30. Transfers are typically instant on Chase''s end. No transfer tax currently applies; confirm current tax treatment before transferring large balances.',
    'A transfer bonus was active as of early May 2026 (65% through May 15, 2026; 55% May 16 - June 30, 2026). Verify current bonus status on Chase''s transfer page before moving points - promotional terms can change. Transfers are typically instant on Chase''s end. No transfer tax currently applies; confirm current tax treatment before transferring large balances.'
  )::jsonb,
  last_verified = now(),
  updated_at = now()
where slug = 'marriott-bonvoy';

-- ============================================================
-- Delta fix: simplify Sky Club card-mechanics in lounge_access
-- ============================================================
-- Replace the verbose visit-cap / per-visit-fee / spend-threshold language
-- on Platinum and Reserve Amex rows with concise "see card page" pointers.
update programs set
  lounge_access = replace(
    replace(lounge_access,
      'Limited Sky Club visits per Medallion Year; per-visit fee applies once cap is exhausted; unlimited visits unlockable via calendar-year spend threshold',
      'Sky Club access included; visit cap and per-visit overage fee apply - see card page for current terms'
    ),
    '15 visits per Medallion Year (Feb 1 – Jan 31); $50/visit ($25 Grab and Go) once cap exhausted; **unlimited unlocked at $75K calendar-year spend**; +2 guest passes per visit',
    'Sky Club access included with annual visit cap; unlimited access unlockable via calendar-year spend threshold; guest access available - see card page for current terms'
  ),
  last_verified = now(),
  updated_at = now()
where slug = 'delta';
