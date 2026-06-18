-- Foundation for the welcome-bonus history + newsletter features.
-- (1) Content-aware dedupe: accidental insert loops left duplicate welcome-bonus rows
--     (Chase Sapphire Reserve had 14 identical 150k/$6k rows; others 2-5). Collapse rows that
--     are IDENTICAL in (bonus_amount, spend_required_usd, tiered_bonuses, bonus_currency),
--     keeping one per group -- preferring the is_current row, else the newest. Genuinely
--     different past offers (distinct content) are preserved as real history.
--     Safe: no FK references this table; every card has exactly one is_current row.
-- (2) Guard: a partial unique index so only ONE is_current row can exist per card going forward.

with ranked as (
  select id,
    row_number() over (
      partition by card_id, bonus_amount, spend_required_usd,
        coalesce(tiered_bonuses::text, ''), coalesce(bonus_currency, '')
      order by is_current desc, updated_at desc nulls last, created_at desc nulls last
    ) as rn
  from credit_card_welcome_bonuses
)
delete from credit_card_welcome_bonuses
where id in (select id from ranked where rn > 1);

create unique index if not exists uniq_welcome_bonus_one_current_per_card
  on credit_card_welcome_bonuses (card_id)
  where is_current = true;
