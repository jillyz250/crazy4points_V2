-- ACCURACY FIXES on GHA Discovery page (identified by self-audit 2026-06-17):
--
-- (1) Brand count: "60-plus" overstates. T&C names ~55 brands but WebSearch
--     sources cite "45 distinct brands." Downgrading to "more than 40 brands"
--     (conservative; defensible from both sources). Applied in intro + award_chart.
--
-- (2) Titanium breakfast brand examples: sweet_spots named Anantara, Kempinski,
--     Capella, Corinthia as breakfast-eligible brands. The official breakfast page
--     (ghadiscovery.com/complimentary-breakfast/titanium-members) shows a specific
--     filtered subset of brands but brand IDs could not be decoded to confirm those
--     four specifically. Removing named brands; directing readers to the official
--     page instead.

update programs set
  intro = replace(intro,
    'a coalition of 60-plus independent hotel brands covering 800-plus properties in 100-plus countries.',
    'a coalition of more than 40 independent hotel brands covering hundreds of properties in 100-plus countries.'),
  sweet_spots = replace(sweet_spots,
    '**Titanium breakfast at aspirational brands.** Complimentary breakfast for two at Anantara, Kempinski, Capella, and Corinthia (where a buffet breakfast can run USD 40-80 per person) meaningfully reduces the effective room cost on longer stays. Budget the D$ earn separately - the breakfast alone can add USD 80-160 per day in value.',
    '**Titanium breakfast at aspirational brands.** Complimentary breakfast for two at participating luxury brands (where a buffet breakfast can run USD 40-80 per person) meaningfully reduces the effective room cost on longer stays. The breakfast alone can add USD 80-160 per day in value at upscale properties. Check the current participating brand list at ghadiscovery.com/complimentary-breakfast/titanium-members before booking.'),
  award_chart = replace(award_chart,
    'GHA Discovery does not have an award chart. D$ are a fixed-value cashback currency (D$1 = USD 1) applied directly to your hotel bill at checkout - not redeemed against category-based award pricing.',
    'GHA Discovery does not have an award chart. D$ are a fixed-value cashback currency (D$1 = USD 1) applied directly to your hotel bill at checkout - not redeemed against category-based award pricing. The coalition covers more than 40 independent hotel brands.'),
  updated_at = now()
where slug = 'gha-discovery';
