-- 226_award_chart_structured.sql
-- Award Chart Rebuild (Option C) — Phase 1 schema.
--
-- Adds the structured award chart container to programs. Shape is
-- `{ charts: AwardChart[] }` per audit decision #3 (multi-chart enables
-- AA saver+AAnytime, JAL zone-own-metal+distance-partners, future hybrids).
--
-- See lib/awardChart.ts for the TypeScript types this jsonb conforms to.
-- See plans/award-chart-rebuild.md for the rebuild context.
--
-- Authored: 2026-05-11

begin;

alter table programs
  add column if not exists award_chart_structured jsonb;

comment on column programs.award_chart_structured is
  'Structured award chart container — { charts: AwardChart[] } per lib/awardChart.ts. '
  'Replaces partner_redemptions.cost_miles_low/high as the source of truth for miles '
  'cost. Each chart has a type discriminator (distance, zone, distance_plus_modifiers, '
  'dynamic, fixed_route) plus partners dict + optional overrides + optional peak_calendar.';

-- GIN index for partner-key lookups across all charts on a program.
-- We frequently filter "does this program have a chart whose partners include X?"
create index if not exists programs_award_chart_structured_idx
  on programs using gin (award_chart_structured);

commit;
