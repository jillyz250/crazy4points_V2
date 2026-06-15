-- Retire the Barclays AAdvantage Aviator cards. American Airlines made Citi its
-- exclusive AAdvantage issuer; the Barclays Aviator portfolio closed to new
-- applicants (Oct 2025) and officially transitioned to Citi on 2026-04-24.
-- Mark them defunct + closed, with a note pointing to the Citi successor.
update credit_cards set status='defunct', closed_to_new_applicants=true,
  notes='Discontinued. Barclays Aviator portfolio transitioned to Citi on 2026-04-24; Citi is now American''s exclusive AAdvantage issuer. Successor: Citi / AAdvantage Platinum Select.',
  last_verified='2026-06-15', updated_at=now()
where slug='barclays-aadvantage-aviator-red';

update credit_cards set status='defunct', closed_to_new_applicants=true,
  notes='Discontinued. Transitioned to Citi on 2026-04-24. Successor: Citi / AAdvantage Globe ($350 AF).',
  last_verified='2026-06-15', updated_at=now()
where slug='barclays-aadvantage-aviator-silver';

update credit_cards set status='defunct', closed_to_new_applicants=true,
  notes='Discontinued. Transitioned to Citi on 2026-04-24. Successor: CitiBusiness / AAdvantage Platinum Select.',
  last_verified='2026-06-15', updated_at=now()
where slug='barclays-aadvantage-aviator-business';
