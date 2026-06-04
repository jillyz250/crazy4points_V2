-- 364 - Treat transferable currencies as their own category (not "Credit Cards").
-- Mark the 6 transferable points currencies; activate Capital One for authoring;
-- create a Virgin Red stub (Capital One's actual partner, vs Virgin Atlantic).
-- The public /programs listing relabels the credit_card category -> "Points & Currencies".
update programs set is_transferable_currency = true
where slug in ('amex','bilt','capital-one','chase','citi','wells-fargo');

update programs set is_active = true where slug = 'capital-one';

insert into programs (slug, name, type, is_active, is_reference_stub)
values ('virgin-red', 'Virgin Red', 'loyalty_program', true, true)
on conflict (slug) do nothing;
