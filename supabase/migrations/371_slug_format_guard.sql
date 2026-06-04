-- ============================================================================
-- 371 - Write-time slug-format guard on transfer_partners_outbound.
--
-- The junk slugs that polluted the legacy data (flying_blue, amex-mr, rove-miles,
-- eva_air) were all convention violations: underscores / non-kebab. This BEFORE
-- trigger rejects any from_slug in transfer_partners_outbound that isn't
-- kebab-case ([a-z0-9-]+), so that class of garbage can never enter the live
-- source-of-truth column again.
--
-- Deliberately does NOT require the target program to exist (a stub may be
-- seeded later) - orphan targets are caught by the daily data-integrity audit,
-- not blocked here, so seed ordering isn't constrained.
--
-- Only validates transfer_partners_outbound (the live column), and only when it
-- actually changes, so unrelated edits to rows that still carry legacy junk in
-- the deprecated transfer_partners column are not blocked.
-- ============================================================================
create or replace function guard_outbound_slug_format()
returns trigger language plpgsql as $$
declare
  elem jsonb;
  s text;
begin
  if tg_op = 'INSERT'
     or new.transfer_partners_outbound is distinct from old.transfer_partners_outbound then
    if new.transfer_partners_outbound is not null then
      for elem in select * from jsonb_array_elements(new.transfer_partners_outbound)
      loop
        s := elem->>'from_slug';
        if s is null or s !~ '^[a-z0-9-]+$' then
          raise exception 'transfer_partners_outbound from_slug "%" on program "%" is not kebab-case (must match ^[a-z0-9-]+$)', s, new.slug
            using errcode = 'check_violation';
        end if;
      end loop;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_outbound_slug_format on programs;
create trigger trg_guard_outbound_slug_format
  before insert or update on programs
  for each row execute function guard_outbound_slug_format();

-- Smoke test: this should raise (rolled back automatically since it errors).
do $$
begin
  begin
    update programs
      set transfer_partners_outbound = '[{"from_slug":"bad_slug","ratio":"1:1"}]'::jsonb
      where slug = 'amex';
    raise exception 'GUARD FAILED: bad_slug was accepted';
  exception when check_violation then
    raise notice 'guard OK: rejected bad_slug as expected';
  end;
end $$;
