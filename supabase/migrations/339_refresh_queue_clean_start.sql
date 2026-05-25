-- Refresh queue — clean-start baseline.
--
-- Jill is too far behind on inputting data and wants the refresh queue at
-- ZERO so the natural cadence can drive future review work from today
-- forward.
--
-- Strategy: stamp every entity that the admin_refresh_queue view inspects
-- with `last_verified = now()`. Queue counts then collapse to 0 because
-- the staleness filter (`last_verified < current_date - N`) no longer
-- matches anything.
--
-- IMPORTANT: This only touches the last_verified / verified_at columns.
-- No editorial content is changed. The /admin/cards/[slug]/extract pages
-- continue to work normally for the ~50 skeleton cards she still needs to
-- author — last_verified is purely a refresh-cadence signal and has no
-- effect on extract behavior.
--
-- Re-running the migration is safe; it just refreshes the baseline again.

-- ── Credit cards (90-day cadence) ─────────────────────────────────────────
update credit_cards
   set last_verified = now()
 where is_active = true;

-- ── Credit card welcome bonuses (30-day cadence) ──────────────────────────
update credit_card_welcome_bonuses
   set last_verified = now()
  where is_current = true
    and card_id in (select id from credit_cards where is_active = true);

-- ── Issuers (365-day cadence) ─────────────────────────────────────────────
update issuers
   set last_verified = now();

-- ── Programs (180-day cadence, plus 90-day transfer-partner roster) ───────
-- Touch both columns so programs disappear from BOTH the program_* row AND
-- the transfer_partners row of the view.
update programs
   set last_verified                 = now(),
       transfer_partners_verified_at = now()
 where is_active = true;

-- ── Hotel properties (365-day cadence, aggregated to program) ─────────────
update hotel_properties
   set last_verified = now()
  where program_id in (select id from programs where is_active = true);

-- Note: per the runbook + memory, the natural cadence resumes from here.
--   - Welcome bonuses re-surface in the queue in 30 days
--   - Programs (180d) and credit cards (90d) re-surface as scheduled
--   - Issuers (365d) and transfer partners (90d) re-surface as scheduled
-- That's the working work-list Jill actually wants to see.
