-- 656_expenses.sql — the Expenses ledger (Erica, Head of Finance, 2026-09-02).
-- The money going OUT: Jill logs every dollar spent (hosting, Supabase, API/LLM,
-- email, ads, tools) so nothing is lost at tax time and spikes are visible.
-- Powers /admin/expenses (add form + running total + this-month total + a
-- month-by-month view + recent list). Janet owns the money coming IN; this is
-- strictly the outflow side.
--
-- Reconcile to the penny: amount is numeric(12,2) — never a float, never rounded.

create table if not exists public.expenses (
  id         uuid primary key default gen_random_uuid(),
  spent_on   date not null,                    -- the date the money went out
  amount     numeric(12,2) not null,           -- dollars.cents, exact — no floats
  vendor     text,                             -- who was paid (Vercel, Supabase, Anthropic, Resend, ...)
  category   text,                             -- hosting | supabase | api-llm | email | ads | tools | other
  note       text,                             -- free-text (invoice #, what it was for)
  created_at timestamptz not null default now()
);

-- The default view is "newest spend first" + the monthly grouping — index the sort key.
create index if not exists expenses_spent_on_idx
  on public.expenses (spent_on desc);

-- SECURITY: internal admin-only, same model as the org/decision-log tables (651/655).
-- Admin pages use the service-role client (bypasses RLS). RLS ON + NO public policies
-- = default-deny to anon + authenticated, so the expense ledger is never publicly
-- readable. Financial data must never leak.
alter table public.expenses enable row level security;
