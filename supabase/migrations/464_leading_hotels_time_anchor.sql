-- Final LLM-audit hedge: time-anchor the "sole transfer-in partner" claim. ASCII-only.
update programs set
  intro = replace(intro,
    'and it can transfer in from Citi ThankYou (currently the sole transfer-in partner).',
    'and it can transfer in from Citi ThankYou (as of mid-2026, the sole transfer-in partner).'),
  updated_at = now()
where slug = 'leading-hotels';
