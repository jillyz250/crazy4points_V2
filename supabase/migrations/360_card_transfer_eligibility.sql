-- ============================================================================
-- 360 - Card transfer_eligibility (+ best-effort network).
--
-- Powers the finder's headline "Earns X directly vs Transfers to X" grouping
-- and the pool-to-unlock caveat. Per-card, audited against the full roster
-- (currency_program + AF + issuer), not memory.
--
--   pool_to_unlock = no-AF UR/ThankYou cards whose points only transfer when
--                    paired with a premium sibling (Chase Freedom/Ink no-AF;
--                    Citi Double/Custom/Rewards+).
--   direct         = transferable-currency cards that transfer on their own
--                    (all Amex MR, all Cap One miles, Bilt, premium Chase &
--                    Citi, both Wells Fargo Autographs).
--   none           = co-brand cards (their points ARE the end currency; onward
--                    transfer, if any, is a PROGRAM property, not card-level).
--
-- network: set deterministically where the card NAME states the network;
-- the rest (Chase/Citi premium etc.) stay NULL for a later per-card pass.
-- Reversible (targets were NULL). Only fills NULLs.
-- Apply: supabase db query --linked --file supabase/migrations/360_card_transfer_eligibility.sql
-- ============================================================================
begin;

-- 1. none: every active card NOT on a transferable currency (co-brand).
update credit_cards c set transfer_eligibility = 'none'
from programs p
where c.currency_program_id = p.id and c.status = 'active'
  and p.slug not in ('amex','chase','citi','bilt','capital-one','wells-fargo')
  and c.transfer_eligibility is null;

-- 2. pool_to_unlock: explicit no-AF UR/ThankYou cards.
update credit_cards set transfer_eligibility = 'pool_to_unlock'
where status = 'active' and transfer_eligibility is null
  and slug in (
    'chase-freedom-flex','chase-freedom-unlimited','chase-freedom-rise',
    'chase-ink-business-cash','chase-ink-business-unlimited',
    'citi-double-cash','citi-custom-cash','citi-rewards-plus'
  );

-- 3. direct: remaining transferable-currency cards (Amex, Cap One, Bilt, Wells
--    Fargo Autographs, premium Chase & Citi) - i.e. on a transferable currency
--    and not already flagged pool_to_unlock above.
update credit_cards c set transfer_eligibility = 'direct'
from programs p
where c.currency_program_id = p.id and c.status = 'active'
  and p.slug in ('amex','chase','citi','bilt','capital-one','wells-fargo')
  and c.transfer_eligibility is null;

-- 4. network (best-effort): only when the card NAME states it.
update credit_cards set network = 'mastercard'
where status = 'active' and network is null and name ilike '%mastercard%';
update credit_cards set network = 'visa'
where status = 'active' and network is null and name ilike '%visa%';

-- 5. post-condition: every active card now has a transfer_eligibility.
do $$
declare n int;
begin
  select count(*) into n from credit_cards where status='active' and transfer_eligibility is null;
  if n > 0 then raise exception 'ABORT: % active cards still have NULL transfer_eligibility', n; end if;
end $$;

commit;
