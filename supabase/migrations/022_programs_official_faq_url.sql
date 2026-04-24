-- Add official_faq_url to programs. This URL points to the program's own
-- FAQ/terms page (NOT blog writeups). A future enrichment step will fetch
-- these pages before regenerating alert drafts so the writer has access
-- to real fee tables, exclusions, and tier rules — reducing fabrication
-- risk and letting it cite specifics without inventing them.

alter table programs
  add column if not exists official_faq_url text;

comment on column programs.official_faq_url is
  'Official program FAQ / terms URL. Source-of-truth for fees, tier validity, exclusions. Editable from /admin/programs.';

-- Seed known programs. Safe no-op if slug does not exist.
update programs set official_faq_url = 'https://flyingblue.statusmatch.com/faq/'                                   where slug = 'flying-blue'       and official_faq_url is null;
update programs set official_faq_url = 'https://www.aa.com/i18n/aadvantage-program/aadvantage-terms-conditions.jsp' where slug = 'aa-aadvantage'     and official_faq_url is null;
update programs set official_faq_url = 'https://www.delta.com/us/en/skymiles/how-to-earn-miles/terms-and-conditions' where slug = 'delta-skymiles'   and official_faq_url is null;
update programs set official_faq_url = 'https://www.united.com/en/us/fly/mileageplus/rules.html'                    where slug = 'united-mileageplus' and official_faq_url is null;
update programs set official_faq_url = 'https://www.alaskaair.com/content/mileage-plan/terms-and-conditions'        where slug = 'alaska-atmos'      and official_faq_url is null;
update programs set official_faq_url = 'https://www.britishairways.com/en-us/executive-club/terms-and-conditions'   where slug = 'ba-executive-club' and official_faq_url is null;
update programs set official_faq_url = 'https://www.world.hyatt.com/content/gp/en/terms.html'                       where slug = 'hyatt'             and official_faq_url is null;
update programs set official_faq_url = 'https://www.hilton.com/en/hilton-honors/terms/'                             where slug = 'hilton-honors'     and official_faq_url is null;
update programs set official_faq_url = 'https://www.marriott.com/loyalty/terms/default.mi'                          where slug = 'marriott-bonvoy'   and official_faq_url is null;
update programs set official_faq_url = 'https://www.ihg.com/onerewards/content/us/en/support/terms-conditions'      where slug = 'ihg-one-rewards'   and official_faq_url is null;
update programs set official_faq_url = 'https://www.chase.com/personal/credit-cards/ultimate-rewards'               where slug = 'chase-ur'          and official_faq_url is null;
update programs set official_faq_url = 'https://www.americanexpress.com/us/rewards/membership-rewards/terms.html'   where slug = 'amex-mr'           and official_faq_url is null;
update programs set official_faq_url = 'https://www.citi.com/rewards/thankyou-rewards-program-terms'                where slug = 'citi-thankyou'     and official_faq_url is null;
update programs set official_faq_url = 'https://www.capitalone.com/learn-grow/money-management/capital-one-rewards/' where slug = 'capital-one-venture' and official_faq_url is null;
update programs set official_faq_url = 'https://www.biltrewards.com/legal/terms'                                    where slug = 'bilt'              and official_faq_url is null;
