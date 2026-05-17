-- Currency-program-id slug fixes for cards with incorrect or null currency
-- assignments. These cobrand cards EARN the hotel program's points directly
-- (not the issuer's flexible currency), so the currency_program_id needs to
-- point at the hotel program — otherwise the wallet's sibling-card logic
-- and the public card pages mis-render the transfer behavior.
--
-- Verified slugs via programs table query (2026-05-17):
--   hilton           — Hilton Honors
--   marriott-bonvoy  — Marriott Bonvoy
--   ihg              — IHG One Rewards
--   choice           — Choice Privileges
--
-- 8 cards in total, no risk of FK failure since we're using existing slugs.

-- Hilton family — Aspire + Surpass were mis-assigned to "amex" (they earn
-- Hilton Honors points, not Amex Membership Rewards)
update credit_cards
   set currency_program_id = (select id from programs where slug = 'hilton')
 where slug in ('hilton-honors-aspire', 'hilton-honors-surpass');

-- Marriott Bonvoy Brilliant — same issue, earns Marriott Bonvoy points
update credit_cards
   set currency_program_id = (select id from programs where slug = 'marriott-bonvoy')
 where slug = 'marriott-bonvoy-brilliant';

-- IHG cards — currency_program_id was null on all three. They earn IHG One
-- Rewards points directly. Setting to ihg.
update credit_cards
   set currency_program_id = (select id from programs where slug = 'ihg')
 where slug in (
   'chase-ihg-one-rewards-premier',
   'chase-ihg-one-rewards-premier-business',
   'chase-ihg-one-rewards-traveler'
 );

-- Wells Fargo Choice Privileges cobrands — earn Choice Privileges points
update credit_cards
   set currency_program_id = (select id from programs where slug = 'choice')
 where slug in (
   'wells-fargo-choice-privileges',
   'wells-fargo-choice-privileges-select'
 );
