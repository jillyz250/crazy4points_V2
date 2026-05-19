# Migration template — copy this when starting a new migration

Per Supabase's May 2026 announcement, the default permission model is changing on October 30, 2026: new tables created in `public` will require explicit grants for `anon` / `authenticated` / `service_role` before they're visible to supabase-js / PostgREST / GraphQL.

We have until then to update our habits. Use this template for every new migration that creates a table or view.

## Tables — public-readable (programs, alerts, cards, blog_posts, etc.)

These should be readable by web visitors (anon) and modifiable only by the admin (service_role).

```sql
create table if not exists public.<table_name> (
  id uuid primary key default gen_random_uuid(),
  -- ...columns...
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Public read; admin-only write
grant select on public.<table_name> to anon, authenticated;
grant select, insert, update, delete on public.<table_name> to service_role;

-- RLS prevents anyone but service_role from writing even if a grant slips
alter table public.<table_name> enable row level security;
create policy "public read"
  on public.<table_name>
  for select to anon, authenticated
  using (true);
```

## Tables — admin-only (subscribers, ai_usage_log, program_field_history, backup_snapshots, system_errors, etc.)

These should NOT be visible to anon or authenticated — only service_role.

```sql
create table if not exists public.<table_name> (
  id uuid primary key default gen_random_uuid(),
  -- ...columns...
  created_at timestamptz not null default now()
);

-- Service-role only — explicit anon revoke for clarity
grant select, insert, update, delete on public.<table_name> to service_role;
revoke all on public.<table_name> from anon, authenticated;

-- RLS lock (defense in depth)
alter table public.<table_name> enable row level security;
-- No policies = no rows readable except via service_role bypass
```

## Views — always `security_invoker`

Postgres views default to SECURITY DEFINER which bypasses RLS. Supabase Security Advisor flags this as ERROR. Always set `security_invoker = on` on new views.

```sql
create view public.<view_name> with (security_invoker = on) as
  select ...;

-- Apply matching grants (usually service_role only for admin views)
grant select on public.<view_name> to service_role;
revoke all on public.<view_name> from anon, authenticated;
```

If extending an existing view (DROP + CREATE pattern), the `with (security_invoker = on)` clause goes on the CREATE.

## Quick checklist before merging a new-table migration

- [ ] Decided: is this table public-readable or admin-only?
- [ ] Added GRANT statements matching the decision
- [ ] Enabled RLS (`alter table ... enable row level security`)
- [ ] Added policy if needed (or intentionally left empty for service-role-only)
- [ ] If it's a view: `with (security_invoker = on)` set
- [ ] Ran `npx next build` locally to catch any TypeScript errors before push

## Why bother?

1. **Future-proofing**: After Oct 30, 2026, missing grants = the new table just doesn't show up to supabase-js. Save ourselves the support call from future Jill.
2. **Defense in depth**: Even if a grant gets misconfigured later, RLS catches it.
3. **Security Advisor stays green**: Easier to spot real issues when the noise is gone.
