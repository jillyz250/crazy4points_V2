-- Delete 4 underscore-slug duplicates that escaped migrations 212 and 213.
-- All have 0 FK refs in partner_redemptions (already cleaned during prior
-- migrations) so this is a straight delete. They were polluting the admin
-- /admin/programs listing as inactive empty stubs.

delete from alert_programs where program_id in (
  select id from programs where slug in ('air_china','air_india','air_new_zealand','air_nz')
);
delete from programs where slug in ('air_china','air_india','air_new_zealand','air_nz');
