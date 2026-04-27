-- One-shot backfill: fill off_peak_points / standard_points / peak_points on
-- every Hyatt hotel_properties row from the current (pre-May-20-2026) chart.
-- Source of truth: programs.hyatt.award_chart on crazy4points.com.
--
-- Safe to re-run — pure UPDATE keyed on (program_id, category).
-- After May 20, 2026, replace these values with the new 5-tier chart and re-run.

with hyatt as (
  select id from programs where slug = 'hyatt' limit 1
),
chart (category, off_peak_points, standard_points, peak_points) as (
  values
    -- Standard 8-category chart
    ('1',  3500,  5000,  6500),
    ('2',  6500,  8000,  9500),
    ('3',  9000, 12000, 15000),
    ('4', 12000, 15000, 18000),
    ('5', 17000, 20000, 23000),
    ('6', 21000, 25000, 29000),
    ('7', 25000, 30000, 35000),
    ('8', 35000, 40000, 45000),
    -- Inclusive Collection (all-inclusive) A-F chart
    ('A', 12000, 15000, 18000),
    ('B', 17000, 20000, 23000),
    ('C', 21000, 25000, 29000),
    ('D', 25000, 30000, 35000),
    ('E', 35000, 40000, 45000),
    ('F', 42000, 50000, 58000)
)
update hotel_properties hp
set
  off_peak_points = c.off_peak_points,
  standard_points = c.standard_points,
  peak_points     = c.peak_points
from chart c, hyatt h
where hp.program_id = h.id
  and hp.category   = c.category;
