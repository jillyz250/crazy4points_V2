-- Fix 2 regex audit findings on Langham page.

update programs set
  sweet_spots = replace(
    sweet_spots,
    'this is by far the best value route to elite benefits',
    'this is by far the strongest-value route to elite benefits'
  ),
  quirks = replace(
    quirks,
    'are deducted on tier upgrade) -- they never roll over.',
    'are deducted on tier upgrade) -- they do not roll over.'
  ),
  updated_at = now()
where slug = 'langham';
