-- Rename the `bank-of-america` program row from "Bank of America Travel Rewards" to "Bank of America".
-- It is an empty stub used as a generic Bank of America ISSUER tag by Claude Scout (linked as the
-- primary program on 2 soft_rejected intel alerts about BofA's Atmos/Alaska partnership and the
-- Preferred Rewards overhaul) -- NOT a Travel Rewards cash-back card page. The old name was
-- misleading. No content is authored (content_updated_at stays null, so the page still 404s).
-- Slug unchanged (bank-of-america already fits). Type left as-is.

update programs set
  name = 'Bank of America',
  updated_at = now()
where slug = 'bank-of-america';
