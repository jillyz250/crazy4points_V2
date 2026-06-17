-- Editorial consistency (Jill's call, 2026-06-17): model ALL four no-annual-fee Citi
-- ThankYou cards the same way - as pool_to_unlock - so the site steers users to the
-- 1:1 premium-card transfer path rather than leading with the lossy 1:0.7 direct
-- no-AF transfer. citi-strata was the odd one out (points_transferable_to_partners=true,
-- rendering the 1:0.7 table); flip it to match citi-double-cash / citi-custom-cash /
-- citi-rewards-plus. The 0.7 reality stays captured in the `standard` tier (program-page
-- stacking) - we just don't headline it on the no-AF card pages. ASCII-only.
update credit_cards set
  points_transferable_to_partners = false,
  transfer_eligibility = 'pool_to_unlock',
  last_verified = current_date,
  updated_at = now()
where slug = 'citi-strata';
