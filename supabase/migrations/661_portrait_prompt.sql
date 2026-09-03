-- 661_portrait_prompt.sql — store each character's portrait description (Jill, 2026-09-03).
-- So we can regenerate or tweak a character's 3D portrait later without re-inventing it.
-- Stores the CHARACTER DESCRIPTION (the variable "<desc>" part); the full prompt =
-- the constant STYLE BLOCK (see project_admin_redesign memory) + the head/family bg color
-- + this desc. Heads use a light-purple bg; specialists use their head's family color.

alter table public.employees
  add column if not exists portrait_prompt text;
