-- 650_user_profiles.sql — Stage 2 foundation for the User Accounts & Wallet Dashboard.
-- The first brick: a per-user profile row keyed to the Supabase Auth user id, with
-- row-level security so a user can only ever read/write their OWN row. No PII beyond
-- email; `tier` is a free/paid gating flag from day 1. Additive + reversible.
-- (Locked decisions: see project_user_accounts_wallet_dashboard memory.)

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  tier text not null default 'free',            -- gating is a flag from day 1
  newsletter_opt_in boolean not null default false,
  newsletter_opt_in_at timestamptz,
  created_at timestamptz not null default now()
);

-- case-insensitive uniqueness on email
create unique index if not exists profiles_email_lower_idx on public.profiles (lower(email));

alter table public.profiles enable row level security;

-- A user can only ever see/change their OWN row. user_id is never taken from the
-- client; it is enforced server-side as auth.uid().
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);
