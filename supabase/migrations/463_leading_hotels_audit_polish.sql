-- Final LLM-audit polish on Leading Hotels (MEDIUM): drop the now-past dated Citi
-- bonus example from sweet_spots, and soften the intro Citi-transfer phrasing so it
-- does not imply easy arbitrage. ASCII-only.

update programs set
  sweet_spots = replace(sweet_spots,
    'and Citi has run periodic 25% transfer bonuses (most recently April through May 16, 2026 - check LHW.com for current availability).',
    'and Citi has run periodic 25% transfer bonuses - check LHW.com for current availability.'),
  intro = replace(intro,
    'and it quietly transfers in from Citi ThankYou.',
    'and it can transfer in from Citi ThankYou (currently the sole transfer-in partner).'),
  updated_at = now()
where slug = 'leading-hotels';
