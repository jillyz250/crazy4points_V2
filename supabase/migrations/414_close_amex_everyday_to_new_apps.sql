-- Verified 2026-06-15 that Amex EveryDay and Amex EveryDay Preferred stopped
-- accepting new applications (~Sept 2024) but existing cardholders keep them and
-- still earn - same situation as Citi Prestige (already status='closed_to_new_apps').
-- They were mislabeled status='active'. Correct to 'closed_to_new_apps' (NOT
-- 'defunct': the product still exists for existing holders). Set the verified
-- card-benefits URLs (the only live Amex pages for these now).
-- Sources: Doctor of Credit (no-new-apps report) + the live Amex card-benefits pages.
update credit_cards set
  status = 'closed_to_new_apps',
  official_url = 'https://global.americanexpress.com/card-benefits/view-all/amex-everyday',
  last_verified = current_date, updated_at = now()
where slug = 'amex-everyday';

update credit_cards set
  status = 'closed_to_new_apps',
  official_url = 'https://global.americanexpress.com/card-benefits/view-all/amex-everyday-preferred',
  last_verified = current_date, updated_at = now()
where slug = 'amex-everyday-preferred';
