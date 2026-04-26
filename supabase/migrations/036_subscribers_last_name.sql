-- Add optional last_name column to subscribers
alter table subscribers add column if not exists last_name text;
