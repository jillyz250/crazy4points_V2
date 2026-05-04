-- Add partner_chart_url to programs.
--
-- BACKGROUND
-- ----------
-- The Partner Booking Tool's MVP returns a list of programs that can book
-- a given route, plus a link to each program's official partner chart so
-- the user can see the precise pricing. This column holds that URL —
-- one per currency program (Atmos, AA, Avios, etc.).
--
-- For dynamic-pricing programs (Delta, Southwest, JetBlue) this points
-- to the search engine homepage instead. The tool surfaces the URL
-- regardless of pricing model so the user can always click through to
-- get authoritative pricing.

alter table programs
  add column if not exists partner_chart_url text;

comment on column programs.partner_chart_url is
  'Official URL where this program publishes partner-award pricing (or search engine URL for dynamic-pricing programs). Tool surfaces this as a click-through for users to see authoritative pricing.';
