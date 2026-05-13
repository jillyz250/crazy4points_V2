-- Drop hotel_properties_program_name_uniq constraint.
--
-- This unique index was created on (program_id, lower(name)) under the
-- assumption that property names are unique within a hotel chain. They
-- aren't - Marriott has at least four "Residence Inn by Marriott Columbus"
-- properties (Columbus OH, Columbus GA, Columbus IN, Columbus MS) and
-- many other repeats: "Courtyard by Marriott Atlanta Airport" exists at
-- multiple sub-locations, "Hampton Inn Newark" appears in NJ and DE,
-- "Marriott Marquis" appears in NYC, SF, and DC, etc.
--
-- Property names alone aren't a stable dedup key. The (program_id,
-- property_code) unique index from mig 123 is the correct identifier
-- since Marriott's 5-letter codes ARE globally unique. The name-based
-- constraint just blocks legitimate inserts and crashed the Block 2
-- scrape on Indiana when Columbus, IN's Residence Inn collided with
-- Columbus, GA's already-seeded row.

drop index if exists hotel_properties_program_name_uniq;
