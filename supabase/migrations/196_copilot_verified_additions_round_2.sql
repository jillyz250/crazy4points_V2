-- Verified-additions round 2 (Copilot fact sheets for sun-country, breeze, avelo).
--
-- Each addition cross-checked against official sources via WebSearch with
-- 2026-dated results before being applied here. One Copilot claim REJECTED:
-- the doc framed Sun Country "Rewards Plus" as a paid annual subscription;
-- our existing page (and our research) shows Plus is an ELITE TIER earned by
-- 10 flight segments OR $10K Sun Country Visa spend. Not integrating that
-- error.
--
-- Sources verified:
--   sun-country: stories.suncountry.com/acquisition-faqs (DOT approved,
--     stockholder vote May 8 2026, close as soon as May 13)
--   breeze: flybreeze.com/breezy-rewards-info, awardwallet.com,
--     frequentmiler.com, upgradedpoints.com (Jan 1 2026 launch, tier ladder,
--     Breeze Easy Visa $89 AF + 10x earning + 7.5K anniversary bonus + 2x
--     dining/grocery + complimentary A220 WiFi)
--   avelo: aveloair.com/company-news (Oct 1 2025 PLUS launch; Jan 2026 base
--     closures AZA/RDU/ILM; up to 100 E195-E2 with first delivery mid-2027;
--     2024 #1 on-time + lowest cancel rate per Anuvu/WSJ)

-- ============================================================
-- SUN COUNTRY - refresh acquisition status post DOT approval
-- ============================================================
update programs set
  intro = replace(intro,
    'Allegiant announced a $1.5 billion acquisition of Sun Country on January 11, 2026, with closing expected in the second quarter of 2026 (as early as mid-May, after the May 8 shareholder votes). Both airlines are slated to keep operating separately under common ownership at first, and the loyalty programs will integrate into one over time. For now, Sun Country Rewards is its own program.',
    'Allegiant announced a $1.5 billion acquisition of Sun Country on January 11, 2026. The DOT cleared the deal in April 2026, the HSR antitrust waiting period ended early, and stockholder votes are set for May 8, 2026 - positioning the deal to close as soon as May 13, 2026. Both airlines plan to keep operating as separate brands under common ownership at close, and the loyalty programs are slated to integrate into one combined program post-close (no firm timeline yet). For now, Sun Country Rewards is its own program; per Sun Country, points and the Sun Country Visa Signature retain their value through the integration.'
  ),
  quirks = replace(quirks,
    '**Allegiant acquisition expected to close in 2Q 2026** (as early as mid-May, after May 8 shareholder votes). Sun Country Rewards and Allegiant Allways Rewards will operate as separate programs at close, with eventual integration but no firm timeline.',
    '**Allegiant acquisition cleared DOT in April 2026, HSR antitrust waiting period terminated early, and stockholder votes are May 8, 2026 - deal positioned to close as soon as May 13, 2026.** Both brands continue operating separately at close. Sun Country Rewards points and the Sun Country Visa Signature are slated to retain their value into the eventual combined program.'
  ),
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'sun-country';

-- ============================================================
-- BREEZE - add carry-on weight enforcement, card specifics, A220 cabin layout
-- ============================================================
update programs set
  quirks = quirks || '
- **Carry-on weight is actively enforced at 35 lbs (16 kg)** - unusual among US carriers, where most do not weigh carry-ons. Overweight carry-ons get gate-checked at a $75 fee.
- **Breeze Easy Visa Signature (Barclays)** specifics: $89 annual fee; up to 10x BreezePoints on Nicer/Nicest bundles and Breeze add-ons, 4x on Nice bundles, 2x on dining + grocery, 1x on everything else; complimentary A220 WiFi; priority boarding; 7,500-point anniversary bonus after $10K in annual card spend.
- **A220-300 cabin layout** (Breeze''s primary aircraft): 12 Breeze Ascent first-class seats, 45 Economy Plus, 80 Economy. Approximately 28% of seats are non-Economy - high for a low-cost carrier. Embraer E190s are being phased out.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'breeze';

-- ============================================================
-- AVELO - fix PLUS launch date, add base closures, 2024 OTP, E195-E2 order
-- ============================================================
update programs set
  intro = replace(replace(intro,
    '**Avelo PLUS** is a paid annual membership ($59 first year, $99 each year after) launched September 2025.',
    '**Avelo PLUS** is a paid annual membership ($59 first year, $99 each year after) launched October 1, 2025.'
  ),
    'Avelo closed its Burbank (BUR) base and exited the West Coast in late 2025.',
    'Avelo closed its Burbank (BUR) base and exited the West Coast in mid-2025, then in January 2026 closed its Mesa (AZA), Raleigh-Durham (RDU), and Wilmington NC (ILM) bases as part of a balance-sheet recapitalization. Many of the closed-base markets continue as point-to-point service from the four remaining bases.'
  ),
  quirks = quirks || '
- **2024 industry recognition**: Avelo ranked #1 in US on-time performance and posted the industry''s lowest cancellation rate (per Anuvu aviation data, used by the Wall Street Journal).
- **Embraer E195-E2 order**: up to 100 E195-E2 aircraft (50 firm + 50 option, ~$4.4B list value), with first delivery anticipated in H1 2027 - Avelo will be the first US carrier to operate the type.
- **Avelo PLUS launched October 1, 2025** at a $49 introductory price; current pricing is $59 first year / $99 each year after, with a $50 Avelo Cash bonus credited on each renewal.',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'avelo';
