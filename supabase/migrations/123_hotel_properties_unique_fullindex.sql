-- Drop the WHERE clause on the (program_id, property_code) unique index.
--
-- The partial unique index from mig 121 worked at the SQL level but not
-- with Supabase REST's PostgREST upsert syntax: ?on_conflict=program_id,
-- property_code requires a non-partial unique constraint matching the
-- column list exactly. Partial indexes are only matched via the index
-- name or via an exact WHERE-clause repeat in the SQL, neither of which
-- the REST layer can express.
--
-- Removing the WHERE clause is harmless: PostgreSQL treats NULL values
-- as not-equal-to-themselves in unique constraints, so multiple rows
-- with property_code=NULL for the same program_id are still allowed.

drop index if exists hotel_properties_program_code_uniq;

create unique index hotel_properties_program_code_uniq
  on hotel_properties (program_id, property_code);
