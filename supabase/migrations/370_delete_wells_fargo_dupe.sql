-- ============================================================================
-- 370 - Delete the 5th deprecated duplicate currency row, wells-fargo-rewards
-- (long loyalty_program dupe of canonical credit_card row wells-fargo). Same
-- class as the 4 removed in migration 369; FK sweep confirmed zero references
-- (no cards, transfers, alerts, redemptions, or outbound slugs). Completes the
-- currency-consolidation Phase 2 hard-delete.
-- ============================================================================
delete from programs where slug = 'wells-fargo-rewards';

select count(*) as remaining_deprecated_currency_dupes from programs
where slug in ('amex-membership-rewards','bilt-rewards','chase-ultimate-rewards','citi-thankyou','wells-fargo-rewards');
