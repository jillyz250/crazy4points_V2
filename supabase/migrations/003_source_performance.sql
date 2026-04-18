-- source performance tracking
alter table sources
  add column if not exists items_produced integer not null default 0,
  add column if not exists items_approved integer not null default 0;

-- intel_items dedup counter (how many times this story was seen but suppressed)
alter table intel_items
  add column if not exists dedup_count integer not null default 0;

-- RPC: increment items_produced + last_scraped_at for a source by name
create or replace function increment_source_produced(p_source_name text, p_count integer)
returns void language sql as $$
  update sources
     set items_produced  = items_produced + p_count,
         last_scraped_at = now(),
         updated_at      = now()
   where name = p_source_name;
$$;

-- RPC: increment items_approved by looking up the source via the intel_item
create or replace function increment_source_approved(p_intel_id uuid)
returns void language sql as $$
  update sources s
     set items_approved = items_approved + 1,
         updated_at     = now()
    from intel_items i
   where i.id = p_intel_id
     and lower(s.name) = lower(i.source_name);
$$;
