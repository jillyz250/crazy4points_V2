-- Switch Rakuten intro to use token substitution.
--
-- Tokens {amex_airline_count} + {amex_hotel_count} are resolved at render
-- time by utils/programs/expandIntroTokens.ts — counts come from
-- programs.transfer_partners_outbound where slug='amex', joined to each
-- partner's type. Counts auto-update as Amex adds or drops transfer partners;
-- no manual intro edit needed when the partner list changes.

update programs
   set intro = 'Rakuten is the largest cash-back shopping portal in the US, paying members a percentage back when they click through to retailers like Macy''s, Nike, Sephora, and Best Buy. Crucially for points-and-miles users, Rakuten lets members redeem earnings as American Express Membership Rewards points instead of cash - at a 1:1 rate - which converts an everyday shopping rebate into transferable points usable across {amex_airline_count} airline and {amex_hotel_count} hotel transfer partners.',
       content_updated_at = now()
 where slug = 'rakuten';
