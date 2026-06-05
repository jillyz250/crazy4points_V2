-- 384 - Retype existing buy-points alerts to the new 'purchase_bonus' type so
-- the newsletter Live Offers "purchase bonuses" bucket auto-fills.
set app.alerts_allow_direct_writes = 'on';
update alerts set type = 'purchase_bonus', updated_at = now()
where status = 'published'
  and type <> 'purchase_bonus'
  and (title ilike '%buy%point%' or title ilike '%buy%mile%' or title ilike '%purchase%point%' or title ilike '%purchase%mile%');
select count(*) as purchase_bonus_alerts from alerts where status='published' and type='purchase_bonus';
