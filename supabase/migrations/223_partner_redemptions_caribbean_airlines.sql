-- Caribbean Airlines partner_redemptions seed.
--
-- Caribbean Miles is a small region-locked currency. As of 08 May 2026
-- (program email to members), peak rates were eliminated, leaving what
-- appears to be a flat single-rate chart for own-metal redemptions:
--   * Economy 15,000 miles
--   * Business 25,000 miles
--   * Classic Upgrade 15,000 miles, Flex Upgrade 10,000 miles
--
-- Full distance-band structure + one-way vs round-trip directionality
-- are NOT publicly published; the program email did not specify them.
-- We seed two rows (Economy + Business) at confidence='LOW' with the
-- caveats captured in `notes`. No partner-airline rows: Caribbean
-- Airlines is non-aligned and has no published partner award chart for
-- redeeming Caribbean Miles on other carriers' metal.

do $$
declare
  cal_id uuid;
begin
  select id into cal_id from programs where slug = 'caribbean-airlines';
  if cal_id is null then
    raise exception 'caribbean-airlines program row not found - apply migration 221 first';
  end if;

  insert into partner_redemptions (
    currency_program_id,
    operating_carrier_id,
    cabin,
    region_or_route,
    pricing_model,
    confidence,
    is_active,
    notes
  )
  values
    (
      cal_id,
      cal_id,
      'Economy',
      'all',
      'fixed',
      'LOW',
      true,
      'Post-08-May-2026: 15,000 miles, year-round (peak rates eliminated). Directionality (one-way vs round-trip) and distance-band structure not publicly published as of May 2026 - verify on caribbean-airlines.com Caribbean Miles redemption page before booking. Source: Caribbean Miles program email to members dated 08 May 2026.'
    ),
    (
      cal_id,
      cal_id,
      'Business',
      'all',
      'fixed',
      'LOW',
      true,
      'Post-08-May-2026: 25,000 miles, year-round (peak rates eliminated). Cabin upgrade redemptions also available: Classic Upgrade 15,000 / Flex Upgrade 10,000. Directionality and distance-band structure not publicly published. Source: Caribbean Miles program email dated 08 May 2026.'
    )
  on conflict do nothing;
end$$;
