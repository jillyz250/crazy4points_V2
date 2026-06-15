-- Enrich the Hilton Free Night Reward benefit descriptions. They previously stated
-- only the earn trigger ("Free Night Reward after $X spend") with no redemption
-- criteria, which read as incomplete. Hilton certs are uncapped - valid for a
-- standard room at nearly any Hilton property worldwide with NO points/category
-- cap (the differentiator vs Marriott 35-85k / IHG 40k / Hyatt Cat 1-4). Spelled
-- that out plus the standard-room rule, property exclusions, fee coverage, and
-- ~12-month expiry. Verified 2026-06-15 against:
--   https://www.hilton.com/en/hilton-honors/free-night-reward-terms/

-- Aspire: annual cert
update credit_card_benefits b
set description = 'One Free Night Reward each year of Card Membership. Valid for one standard room (double occupancy) at nearly any property in the Hilton portfolio worldwide - with NO points or category cap, unlike most hotel free-night certs. A short list of properties is excluded (see HiltonHonors.com/freenightreward). Covers resort fees and taxes on the room, can be combined with other Hilton promotions or added to an existing stay, and expires about 12 months after issuance. Redeem by calling 1-800-446-6677.',
    updated_at = now()
from credit_cards c
where c.id = b.card_id and c.slug = 'amex-hilton-honors-aspire' and b.name = 'Annual Free Night Reward';

-- Aspire: after $30k
update credit_card_benefits b
set description = 'A second Free Night Reward after $30,000 in purchases in a calendar year. Same redemption terms as the annual reward: one standard room at nearly any Hilton property worldwide, no points or category cap, minus the short excluded-property list (HiltonHonors.com/freenightreward). Covers resort fees and taxes on the room and expires about 12 months after issuance.',
    updated_at = now()
from credit_cards c
where c.id = b.card_id and c.slug = 'amex-hilton-honors-aspire' and b.name = 'Free Night After $30k';

-- Aspire: after $60k
update credit_card_benefits b
set description = 'A third Free Night Reward after $60,000 in purchases in a calendar year (on top of the annual reward and the $30k reward). Same redemption terms: one standard room at nearly any Hilton property worldwide, no points or category cap, minus the short excluded-property list (HiltonHonors.com/freenightreward). Covers resort fees and taxes on the room and expires about 12 months after issuance.',
    updated_at = now()
from credit_cards c
where c.id = b.card_id and c.slug = 'amex-hilton-honors-aspire' and b.name = 'Free Night After $60k';

-- Surpass: after $15k
update credit_card_benefits b
set description = 'One Free Night Reward after $15,000 in purchases in a calendar year. Valid for one standard room (double occupancy) at nearly any property in the Hilton portfolio worldwide - with NO points or category cap. A short list of properties is excluded (see HiltonHonors.com/freenightreward). Covers resort fees and taxes on the room, can be combined with other Hilton promotions or added to an existing stay, and expires about 12 months after issuance. Redeem by calling 1-800-446-6677.',
    updated_at = now()
from credit_cards c
where c.id = b.card_id and c.slug = 'amex-hilton-honors-surpass' and b.name = 'Free Night After $15k';

-- Re-verified against official source today.
update credit_cards set last_verified = current_date, updated_at = now()
where slug in ('amex-hilton-honors-aspire','amex-hilton-honors-surpass');
