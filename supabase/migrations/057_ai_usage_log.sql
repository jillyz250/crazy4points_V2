-- AI Usage Log
-- Tracks every Anthropic API call: model, tokens, cost estimate, caller.
-- Powers /admin/ai-usage to spot which utility is burning the budget.

create table if not exists ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  caller text not null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cache_creation_input_tokens int not null default 0,
  cache_read_input_tokens int not null default 0,
  cost_usd numeric(10, 6) not null default 0,
  metadata jsonb
);

create index if not exists ai_usage_log_created_at_idx on ai_usage_log (created_at desc);
create index if not exists ai_usage_log_caller_idx on ai_usage_log (caller);
create index if not exists ai_usage_log_model_idx on ai_usage_log (model);
