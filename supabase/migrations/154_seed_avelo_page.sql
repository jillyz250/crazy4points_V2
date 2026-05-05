-- Seed Avelo Airlines full program page.
--
-- Authored 2026-05-05. Sources: official Avelo scrapes (avelo-credit-card,
-- avelo-plus, rewards-terms-and-conditions, company-news) + WebSearch
-- (NerdWallet, AwardWallet, Upgraded Points, Aviation Week, View from the
-- Wing, prnewswire). Cross-fact-check round was inconclusive (both Copilot
-- and ChatGPT did not run live searches this round); confidence is
-- HIGH on official scrapes + multiple 2026-dated trusted sources.
--
-- Notes on shape:
-- - alliance = 'none' (standalone, no alliance, no codeshares)
-- - transfer_partners = [] (no flexible-currency transfers)
-- - tier_benefits = [] (no traditional elite tiers; closest equivalent is
--   the paid Avelo PLUS membership which is not a tier)
-- - lounge_access stub (no own-brand lounges, no partner lounges)
-- - award_chart frames the program as fixed-value (1 pt = $0.01 Avelo Cash,
--   card-tied earn only)
--
-- Avelo runs two parallel programs:
--   1. Avelo Rewards - card-tied points/Avelo Cash program. Launched
--      Jan 27, 2026 with the Avelo Airlines World Elite Mastercard via
--      Cardless (issued by First Electronic Bank). 5% Avelo / 2% other,
--      $99 AF, 25K points after $1K/90d.
--   2. Avelo PLUS - paid annual membership ($59 first year, $99 ongoing)
--      launched September 2025. Travel-perk subscription with priority
--      boarding, member fares, $50 Avelo Cash renewal bonus, perks share
--      with up to 9 travel companions.

update programs set
  alliance = 'none',
  hubs = array['HVN','ILG','JQF','LAL','TKI'],
  intro = 'Avelo Airlines is a US ULCC founded in 2018 and commercially launched in April 2021 by Andrew Levy (former Allegiant president and former United CFO). Avelo focuses on small and mid-sized cities and underserved point-to-point routes - mostly leisure-oriented, mostly secondary airports that legacy carriers fly to once a day or skip entirely. After a 2025-2026 network simplification, Avelo''s current operating bases are New Haven CT (HVN, headquarters), Philadelphia/Delaware Valley at Wilmington (ILG), Charlotte/Concord NC (JQF), and Lakeland/Central Florida (LAL). A fifth base at McKinney/North Dallas (TKI) is slated to open late 2026. Avelo closed its Burbank (BUR) base and exited the West Coast in late 2025.

Avelo runs two parallel programs and they don''t look anything like a traditional airline program.

**Avelo Rewards** is a card-tied points / "Avelo Cash" program launched January 27, 2026 with the Avelo Airlines World Elite Mastercard. The card is issued by First Electronic Bank and offered through Cardless - Avelo bills itself as the first US domestic airline co-brand on Cardless''s digital-first card infrastructure. Earn 5% in Avelo Cash on Avelo purchases (5 points per dollar) and 2% on everything else (2 points per dollar). One point equals $0.01 in Avelo Cash, which redeems on Avelo flights and ancillaries. There is no flying-based earn track outside the card.

**Avelo PLUS** is a paid annual membership ($59 first year, $99 each year after) launched September 2025. It''s a travel-perk subscription, not a points program: free priority boarding, member-only fares, and a $50 Avelo Cash bonus on renewal. Benefits extend to up to 9 travel companions on the same booking, which is unusually generous for a paid airline membership.

There''s no alliance, no codeshare partners, no lounges, no traditional elite tiers earned by flying, and no transfer partners from Amex MR, Chase UR, Citi TYP, Capital One Miles, or Bilt. The closest equivalent to "status" is whether you hold the Avelo PLUS membership.',
  transfer_partners = '[]'::jsonb,
  how_to_spend = '- **Avelo flights** - any route, any date, any fare. Avelo Cash redeems at 1 cent per point against the cash price.
- **Bag fees, seat selection, other Avelo purchases** - Avelo Cash covers them at 1 cent per point.
- **Cash + Avelo Cash combos** - mix dollars and points on a single booking.
- **No partner redemptions** - Avelo Cash only redeems on Avelo. No alliance, no codeshare partners, no transfers out to other programs.',
  sweet_spots = '- **The "no chart" sweet spot is straightforward: 5% back on Avelo flights with the card.** That is the highest published earn rate of any US airline co-brand on flights to/from that airline.
- **Avelo PLUS for group travel** - the $99 annual fee unlocks priority boarding and member fares for up to 9 travel companions on the same booking. If you fly Avelo with family or a regular travel group at least 2-3 times a year, the math typically favors PLUS over a la carte priority boarding upgrades.
- **$50 Avelo Cash on renewal** - the PLUS membership renewal bonus is functionally a $50 rebate on the $99 ongoing renewal, taking the effective cost down to $49/year if you actually use Avelo.
- **No flying-only earn** - if you do not hold the Avelo Airlines World Elite Mastercard, the Avelo Rewards program is effectively inaccessible. The "sweet spot" decision for non-cardholders is whether to add the card or buy Avelo PLUS - the two programs serve different purposes and you can hold both.',
  tier_benefits = '[]'::jsonb,
  lounge_access = 'Avelo does not operate any of its own airport lounges. Avelo is not a member of any alliance (oneworld, SkyTeam, Star Alliance) and has no lounge-access reciprocity with other carriers.

If you are flying Avelo out of an airport that has a third-party lounge program (Priority Pass, Plaza Premium, Capital One Lounges, Amex Centurion, Chase Sapphire Lounges, Delta Sky Club through co-brand cards, etc.), access depends on the lounge''s entry rules and your card or membership - not on your Avelo Rewards or Avelo PLUS standing, because neither program confers any third-party lounge benefits.

The closest equivalent to a status-based airport perk is **priority boarding**, which is a benefit of both the Avelo Airlines World Elite Mastercard and Avelo PLUS membership. Neither is a lounge.',
  quirks = '- **Avelo Cash earned via the Avelo Airlines World Elite Mastercard does not expire** as long as your Avelo account remains open and active.
- **Avelo Cash issued from disruptions/cancellations has a separate validity window** (typically 1 year for customer-initiated changes or minor disruptions, up to 5 years for major delays/diversions/cancellations). These rules are different from the rewards program.
- **No flying-based earn outside the card.** Without the Avelo Airlines World Elite Mastercard, Avelo Rewards is effectively inaccessible.
- **No traditional elite tiers.** The closest analogue to status is the paid Avelo PLUS membership.
- **No family pooling** is part of the public program.
- **Avelo PLUS perks share with up to 9 travel companions** on the same booking - useful for family or group travel.
- **Avelo PLUS auto-renews** at $99/year unless canceled before the renewal date.
- **No alliance, no codeshares, no lounges.**
- **Stopover and open-jaw rules are not relevant** since Avelo flies point-to-point and Avelo Cash redeems at the cash price.',
  award_chart = '## Avelo Rewards redemption structure (no chart)

Avelo''s program is fixed-value, not chart-based. Avelo Cash redeems at 1 cent per point against any Avelo cash price.

| Item | Cost in Avelo Cash | Cost in dollars |
|---|---|---|
| Any Avelo flight | (cash price) | (cash price) |
| Bag fees | (cash price) | (cash price) |
| Seat selection | (cash price) | (cash price) |
| Other Avelo purchases | (cash price) | (cash price) |

**Conversion:** 1 point = $0.01 in Avelo Cash. Avelo automatically converts points into Avelo Cash when posted, so the user-facing balance is in dollars.

**Earn rates (Avelo Airlines World Elite Mastercard, the only Avelo Rewards earn path):**
- 5 points per $1 (5%) on Avelo Airlines purchases
- 2 points per $1 (2%) on all other purchases
- 25,000-point welcome bonus ($250 in Avelo Cash) after $1,000 in purchases in the first 90 days

**No partner award redemptions** - Avelo Cash only redeems on Avelo. No alliance, no codeshare partners.

**Avelo PLUS membership (separate, paid):**
- $59 first year, $99 each year after
- Auto-renews unless canceled
- Free priority boarding, member-only fares
- $50 Avelo Cash bonus at renewal
- Benefits extend to up to 9 travel companions on the same booking',
  partner_chart_url = 'https://www.aveloair.com/avelo-credit-card',
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'avelo';

-- Step 5.5 partner_redemptions seed
insert into partner_redemptions (
  currency_program_id, operating_carrier_id, cabin, region_or_route, pricing_model,
  notes, confidence, last_verified, is_active, fuel_surcharges
)
select
  p.id, p.id, 'Economy', 'All Avelo routes (cash-equivalent)', 'dynamic',
  'Avelo Cash redeems at a fixed 1 point = $0.01 toward any Avelo purchase, including base fare, taxes, fees, bags, and seats. No award chart, no zones, no blackout dates, no fuel surcharges. No partner redemptions - Avelo Cash only redeems on Avelo. Earn is card-only via the Avelo Airlines World Elite Mastercard (Cardless / First Electronic Bank). See aveloair.com/avelo-credit-card for details.',
  'HIGH', current_date, true, 'none'
from programs p where p.slug = 'avelo'
on conflict do nothing;
