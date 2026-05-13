-- Vueling was missing from the 025 airline seed. Spanish LCC, part of IAG
-- (alongside Iberia, BA, Aer Lingus). "Vueling Club" earns Avios as its
-- currency. Adding so it shows up in the admin alert program dropdown.
insert into programs (slug, name, type, is_active) values
  ('vueling', 'Vueling Club', 'airline', true)
on conflict (slug) do nothing;
