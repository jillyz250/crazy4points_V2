-- Hedge the Citi transfer-bonus claim on Leading Hotels sweet_spots (LLM-audit
-- MEDIUM): past bonuses are not a guarantee of future ones. ASCII-only.
update programs set
  sweet_spots = replace(sweet_spots,
    'and Citi runs periodic 25% transfer bonuses (the most recent ran April through May 16, 2026).',
    'and Citi has run periodic 25% transfer bonuses (most recently April through May 16, 2026 - check LHW.com for current availability).'),
  updated_at = now()
where slug = 'leading-hotels';