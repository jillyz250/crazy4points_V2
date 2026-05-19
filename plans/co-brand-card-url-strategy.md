# Co-Brand Credit Card URL Strategy

When setting up a new co-brand credit card (Marriott × Amex, United × Chase, AA × Citi, etc.) for extraction, the bank issuer's product page is **not enough** on its own. The welcome bonus is typically JS-injected and Firecrawl's static scrape misses it. The fix: **also configure the loyalty program partner's marketing page** — they publish SUBs in plain HTML for SEO.

## Why this matters

Discovered 2026-05-19 when Marriott × Amex extractions (Bevy, Brilliant, Business) all returned null welcome bonuses. The issuer page (`americanexpress.com/us/credit-cards/card/...`) had the offer rendered client-side; Marriott's comparison page (`marriott.com/credit-cards/american-express-credit-cards.mi`) had it in plain HTML.

## The 4 URL slots — what goes where

Card extraction reads four URL columns on `credit_cards`. Use them like this for co-brand cards:

| Slot | What to put | Example (Marriott Brilliant) |
|---|---|---|
| `official_url` | Bank issuer's product page (benefits + earn rates live here) | `americanexpress.com/us/credit-cards/card/marriott-bonvoy-brilliant/` |
| `guide_to_benefits_url` | Bank issuer's detailed benefits dashboard | `global.americanexpress.com/card-benefits/view-all/marriott-bonvoy-brilliant` |
| `pricing_terms_url` | **Loyalty-partner comparison page** (SUB lives here) — OR the bank's Schumer Box if partner page lacks pricing | `marriott.com/credit-cards/american-express-credit-cards.mi` |
| `rotating_categories_url` | N/A for co-brand cards. Only used for Chase Freedom Flex / Discover It style cards |  |

## Known partner-comparison pages (verified-living URLs)

Add to this list as we discover more. Each URL should be HTTP-200-verified before use.

### Marriott Bonvoy
- × Amex: `https://www.marriott.com/credit-cards/american-express-credit-cards.mi`
- × Chase: `https://www.marriott.com/credit-cards/chase-marriott-bonvoy-credit-cards.mi` (may be different — verify when needed)

### Delta SkyMiles
- × Amex: `https://www.delta.com/us/en/skymiles/credit-cards/credit-cards-overview`

### Hilton Honors
- × Amex: `https://www.hilton.com/en/hilton-honors/credit-cards/`

### United MileagePlus
- × Chase: `https://www.united.com/en/us/credit-cards`

### Southwest Rapid Rewards
- × Chase: `https://www.southwest.com/rapidrewards/credit-cards/`

### British Airways Executive Club
- × Chase: `https://www.britishairways.com/en-us/information/credit-card`

### Aer Lingus AerClub
- × Chase: `https://www.aerlingus.com/en/credit-card/` (verify)

### Iberia Plus
- × Chase: `https://www.iberia.com/credit-card/` (verify)

### IHG One Rewards
- × Chase: `https://www.ihg.com/onerewards/content/us/en/earn-points/credit-card`

### American Airlines AAdvantage
- × Citi: `https://www.aa.com/i/credit-cards`
- × Barclays: `https://cards.barclaycardus.com/cards/aadvantage-aviator-red-world-elite-mastercard/`

### Alaska Mileage Plan / Atmos Rewards
- × BoA: `https://www.alaskaair.com/content/credit-card`

### JetBlue TrueBlue
- × Barclays: `https://cards.barclaycardus.com/cards/jetblue-card/`

### Aeroplan (Air Canada)
- × Chase: `https://www.aircanada.com/us/en/aco/home/fly/aeroplan/credit-cards/aeroplan-us-credit-card-from-chase.html` (verify)

## Setup checklist before first extraction

For each new co-brand card:

- [ ] Identified bank issuer's product page → set as `official_url`
- [ ] Identified bank issuer's benefits dashboard URL → set as `guide_to_benefits_url`
- [ ] **Identified loyalty-partner comparison page** → set as `pricing_terms_url`
- [ ] All 3-4 URLs return HTTP 200 (curl -sI)
- [ ] Run extraction once — confirm welcome bonus is captured (not null)
- [ ] If SUB still null after extraction: check the partner page in browser to verify the offer was actually present, then escalate to manual entry

## Related rules

- `feedback_co_brand_use_loyalty_partner_page.md` (memory note, same content)
- `feedback_card_data_issuer_source_only.md` (no third-party blogs ever — partner pages count as issuer-side)
- `plans/migration-template.md` (security pattern for new tables; unrelated but lives in same plans dir)
