-- 653_employee_image.sql — 3D-illustrated character portrait per employee (Jill, 2026-09-02).
-- Hosted under /public/team/<slug>.png, referenced by image_url. Shows on the employee page.
alter table public.employees add column if not exists image_url text;
