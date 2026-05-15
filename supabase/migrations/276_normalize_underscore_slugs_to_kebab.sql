-- Normalize 22 program slugs from snake_case to kebab-case.
--
-- Project convention is kebab-case slugs (per CLAUDE.md). Earlier seed
-- migrations used snake_case for some programs; this migration brings
-- them in line with the convention so URLs are consistent across the
-- catalog.
--
-- Rename mapping:
--   bank_of_america          -> bank-of-america
--   capital_one              -> capital-one
--   wells_fargo              -> wells-fargo
--   aleutian_airways         -> aleutian-airways
--   cape_air                 -> cape-air
--   contour_airlines         -> contour-airlines
--   hainan_airlines          -> hainan-airlines
--   kenmore_air              -> kenmore-air
--   mokulele_airlines        -> mokulele-airlines
--   oman_air                 -> oman-air
--   porter_airlines          -> porter-airlines
--   southern_airways_express -> southern-airways-express
--   bahia_principe           -> bahia-principe
--   best_western             -> best-western
--   club_med                 -> club-med
--   disney_vacation_club     -> disney-vacation-club
--   gha_discovery            -> gha-discovery
--   leading_hotels           -> leading-hotels
--   radisson_americas        -> radisson-americas
--   shangri_la               -> shangri-la
--   expedia_one_key          -> expedia-one-key
--   star_alliance            -> star-alliance
--
-- next.config.ts gets 22 matching permanent (308) redirects so old URLs
-- preserve their SEO equity.

-- ── 1. Rename slugs on the programs table ──────────────────────────────
update programs set slug = case slug
  when 'bank_of_america' then 'bank-of-america'
  when 'capital_one' then 'capital-one'
  when 'wells_fargo' then 'wells-fargo'
  when 'aleutian_airways' then 'aleutian-airways'
  when 'cape_air' then 'cape-air'
  when 'contour_airlines' then 'contour-airlines'
  when 'hainan_airlines' then 'hainan-airlines'
  when 'kenmore_air' then 'kenmore-air'
  when 'mokulele_airlines' then 'mokulele-airlines'
  when 'oman_air' then 'oman-air'
  when 'porter_airlines' then 'porter-airlines'
  when 'southern_airways_express' then 'southern-airways-express'
  when 'bahia_principe' then 'bahia-principe'
  when 'best_western' then 'best-western'
  when 'club_med' then 'club-med'
  when 'disney_vacation_club' then 'disney-vacation-club'
  when 'gha_discovery' then 'gha-discovery'
  when 'leading_hotels' then 'leading-hotels'
  when 'radisson_americas' then 'radisson-americas'
  when 'shangri_la' then 'shangri-la'
  when 'expedia_one_key' then 'expedia-one-key'
  when 'star_alliance' then 'star-alliance'
  else slug
end
where slug in (
  'bank_of_america','capital_one','wells_fargo','aleutian_airways','cape_air',
  'contour_airlines','hainan_airlines','kenmore_air','mokulele_airlines','oman_air',
  'porter_airlines','southern_airways_express','bahia_principe','best_western',
  'club_med','disney_vacation_club','gha_discovery','leading_hotels','radisson_americas',
  'shangri_la','expedia_one_key','star_alliance'
);

-- ── 2. Update programs.alliance refs (only star_alliance is affected) ──
update programs set alliance = 'star_alliance' where alliance = 'star_alliance';
-- Keep alliance enum as-is (DB enum value, not slug) — UI maps it via lib/alliance.ts.
-- This is a no-op confirming the alliance column does NOT change.

-- ── 3. Update programs.parent_program_slug refs ────────────────────────
update programs set parent_program_slug = case parent_program_slug
  when 'bank_of_america' then 'bank-of-america'
  when 'capital_one' then 'capital-one'
  when 'wells_fargo' then 'wells-fargo'
  when 'aleutian_airways' then 'aleutian-airways'
  when 'cape_air' then 'cape-air'
  when 'contour_airlines' then 'contour-airlines'
  when 'hainan_airlines' then 'hainan-airlines'
  when 'kenmore_air' then 'kenmore-air'
  when 'mokulele_airlines' then 'mokulele-airlines'
  when 'oman_air' then 'oman-air'
  when 'porter_airlines' then 'porter-airlines'
  when 'southern_airways_express' then 'southern-airways-express'
  when 'bahia_principe' then 'bahia-principe'
  when 'best_western' then 'best-western'
  when 'club_med' then 'club-med'
  when 'disney_vacation_club' then 'disney-vacation-club'
  when 'gha_discovery' then 'gha-discovery'
  when 'leading_hotels' then 'leading-hotels'
  when 'radisson_americas' then 'radisson-americas'
  when 'shangri_la' then 'shangri-la'
  when 'expedia_one_key' then 'expedia-one-key'
  when 'star_alliance' then 'star-alliance'
  else parent_program_slug
end
where parent_program_slug in (
  'bank_of_america','capital_one','wells_fargo','aleutian_airways','cape_air',
  'contour_airlines','hainan_airlines','kenmore_air','mokulele_airlines','oman_air',
  'porter_airlines','southern_airways_express','bahia_principe','best_western',
  'club_med','disney_vacation_club','gha_discovery','leading_hotels','radisson_americas',
  'shangri_la','expedia_one_key','star_alliance'
);

-- ── 4. Update programs.member_programs jsonb refs ─────────────────────
-- The member_programs jsonb stores slug strings inside program_slug + carrier_slugs.
-- String-replace each quoted slug across the whole jsonb text representation.
-- Same nested-replace pattern as migration 270.
update programs set
  member_programs = (
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        replace(
                          replace(
                            replace(
                              replace(
                                replace(
                                  replace(
                                    replace(
                                      replace(
                                        replace(
                                          replace(
                                            replace(
                                              replace(
                                                member_programs::text,
                                                '"bank_of_america"', '"bank-of-america"'
                                              ),
                                              '"capital_one"', '"capital-one"'
                                            ),
                                            '"wells_fargo"', '"wells-fargo"'
                                          ),
                                          '"aleutian_airways"', '"aleutian-airways"'
                                        ),
                                        '"cape_air"', '"cape-air"'
                                      ),
                                      '"contour_airlines"', '"contour-airlines"'
                                    ),
                                    '"hainan_airlines"', '"hainan-airlines"'
                                  ),
                                  '"kenmore_air"', '"kenmore-air"'
                                ),
                                '"mokulele_airlines"', '"mokulele-airlines"'
                              ),
                              '"oman_air"', '"oman-air"'
                            ),
                            '"porter_airlines"', '"porter-airlines"'
                          ),
                          '"southern_airways_express"', '"southern-airways-express"'
                        ),
                        '"bahia_principe"', '"bahia-principe"'
                      ),
                      '"best_western"', '"best-western"'
                    ),
                    '"club_med"', '"club-med"'
                  ),
                  '"disney_vacation_club"', '"disney-vacation-club"'
                ),
                '"gha_discovery"', '"gha-discovery"'
              ),
              '"leading_hotels"', '"leading-hotels"'
            ),
            '"radisson_americas"', '"radisson-americas"'
          ),
          '"shangri_la"', '"shangri-la"'
        ),
        '"expedia_one_key"', '"expedia-one-key"'
      ),
      '"star_alliance"', '"star-alliance"'
    )
  )::jsonb,
  last_verified = current_date
where member_programs is not null
  and member_programs::text ~ '"(bank_of_america|capital_one|wells_fargo|aleutian_airways|cape_air|contour_airlines|hainan_airlines|kenmore_air|mokulele_airlines|oman_air|porter_airlines|southern_airways_express|bahia_principe|best_western|club_med|disney_vacation_club|gha_discovery|leading_hotels|radisson_americas|shangri_la|expedia_one_key|star_alliance)"';

-- ── 5. Update programs.transfer_partners jsonb refs ────────────────────
-- Same nested-replace pattern across transfer_partners (currency programs
-- listing their partner airlines/hotels).
update programs set
  transfer_partners = (
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        replace(
                          replace(
                            replace(
                              replace(
                                replace(
                                  replace(
                                    replace(
                                      replace(
                                        replace(
                                          replace(
                                            replace(
                                              replace(
                                                transfer_partners::text,
                                                '"bank_of_america"', '"bank-of-america"'
                                              ),
                                              '"capital_one"', '"capital-one"'
                                            ),
                                            '"wells_fargo"', '"wells-fargo"'
                                          ),
                                          '"aleutian_airways"', '"aleutian-airways"'
                                        ),
                                        '"cape_air"', '"cape-air"'
                                      ),
                                      '"contour_airlines"', '"contour-airlines"'
                                    ),
                                    '"hainan_airlines"', '"hainan-airlines"'
                                  ),
                                  '"kenmore_air"', '"kenmore-air"'
                                ),
                                '"mokulele_airlines"', '"mokulele-airlines"'
                              ),
                              '"oman_air"', '"oman-air"'
                            ),
                            '"porter_airlines"', '"porter-airlines"'
                          ),
                          '"southern_airways_express"', '"southern-airways-express"'
                        ),
                        '"bahia_principe"', '"bahia-principe"'
                      ),
                      '"best_western"', '"best-western"'
                    ),
                    '"club_med"', '"club-med"'
                  ),
                  '"disney_vacation_club"', '"disney-vacation-club"'
                ),
                '"gha_discovery"', '"gha-discovery"'
              ),
              '"leading_hotels"', '"leading-hotels"'
            ),
            '"radisson_americas"', '"radisson-americas"'
          ),
          '"shangri_la"', '"shangri-la"'
        ),
        '"expedia_one_key"', '"expedia-one-key"'
      ),
      '"star_alliance"', '"star-alliance"'
    )
  )::jsonb,
  last_verified = current_date
where transfer_partners is not null
  and transfer_partners::text ~ '"(bank_of_america|capital_one|wells_fargo|aleutian_airways|cape_air|contour_airlines|hainan_airlines|kenmore_air|mokulele_airlines|oman_air|porter_airlines|southern_airways_express|bahia_principe|best_western|club_med|disney_vacation_club|gha_discovery|leading_hotels|radisson_americas|shangri_la|expedia_one_key|star_alliance)"';

-- ── Verification queries ───────────────────────────────────────────────
-- Should return 0 — confirms no underscore slugs remain on programs:
--   select count(*) from programs where slug like '%\_%' escape '\';
--
-- Should return 0 — confirms no underscore slugs remain as parent refs:
--   select count(*) from programs where parent_program_slug like '%\_%' escape '\';
--
-- Should return 0 — confirms no underscore slugs lurking in member_programs:
--   select count(*) from programs
--   where member_programs::text ~ '"(bank_of_america|capital_one|star_alliance|expedia_one_key|shangri_la|bahia_principe|best_western|club_med|disney_vacation_club|gha_discovery|leading_hotels|radisson_americas|aleutian_airways|cape_air|contour_airlines|hainan_airlines|kenmore_air|mokulele_airlines|oman_air|porter_airlines|southern_airways_express|wells_fargo)"';
