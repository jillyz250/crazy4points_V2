-- ============================================================================
-- 379 - Move the weekly re-verification source list from hardcoded config into
-- a per-program DB field, so a newly-authored program auto-enrolls in the sweep
-- the moment its source URL is filled in (one box in the authoring flow) - no
-- code change needed.
--
-- The sweep now processes any active program that has reverify_source_url set
-- AND non-empty transfer_partners_outbound. Seeds the current 9.
-- ============================================================================
alter table programs add column if not exists reverify_source_url text;
alter table programs add column if not exists reverify_source_label text;

update programs p set reverify_source_url = v.url, reverify_source_label = v.label
from (values
  ('capital-one', 'https://www.capitalone.com/learn-grow/money-management/venture-miles-transfer-partnerships/', 'Capital One (official)'),
  ('amex', 'https://upgradedpoints.com/credit-cards/amex-membership-rewards-transfer-partners/', 'Upgraded Points'),
  ('chase', 'https://upgradedpoints.com/credit-cards/chase-ultimate-rewards-transfer-partners/', 'Upgraded Points'),
  ('citi', 'https://upgradedpoints.com/credit-cards/citi-thankyou-points-transfer-partners/', 'Upgraded Points'),
  ('bilt', 'https://awardwallet.com/credit-cards/bilt-rewards/bilt-transfer-partners/', 'AwardWallet'),
  ('wells-fargo', 'https://awardwallet.com/credit-cards/wells-fargo-rewards/transfer-partners/', 'AwardWallet'),
  ('marriott-bonvoy', 'https://www.point.me/insights/marriott-bonvoy-transfer-partners/', 'point.me'),
  ('hilton', 'https://upgradedpoints.com/travel/hotels/hilton-honors-transfer-partners/', 'Upgraded Points'),
  ('accor', 'https://pointsmath.com/accor-airline-partners-everything-you-need-to-know/', 'Points Math')
) as v(slug, url, label)
where p.slug = v.slug;

select count(*) as programs_enrolled from programs where reverify_source_url is not null;
