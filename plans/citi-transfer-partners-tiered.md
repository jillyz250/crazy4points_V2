# Citi ThankYou — Tiered Transfer Partner Capture

**Verified from logged-in Citi ThankYou portal on 2026-05-18 (Jill).**

## Tier definitions

**Premium tier — transfer 1,000 = full ratio:**
- Citi Strata Elite
- Citi Strata Premier
- Citi Prestige (closed to new applicants)
- AT&T Access More (closed)

**Standard tier — transfer 1,000 = 700 (30% haircut):**
- Citi ThankYou Preferred
- Citi Strata Card
- Citi Double Cash Card
- Citi Custom Cash Card
- Citi ThankYou Mastercard
- AT&T Universal Rewards World
- AT&T Universal Savings and Rewards
- AT&T Universal Rewards
- AT&T Points Plus
- AT&T Access (Citi or AT&T Access Cardmembers)

## Data capture — per partner

| # | Partner | Premium ratio | Standard ratio | Currency unit |
|---|---|---|---|---|
| 1 | Virgin Atlantic Flying Club / Virgin Red | 1:1 | 1:0.7 | Virgin Points |
| 2 | Turkish Airlines Miles&Smiles | 1:1 | 1:0.7 | Miles&Smiles miles |
| 3 | Thai Royal Orchid Plus | 1:1 | 1:0.7 | Royal Orchid Plus miles |
| 4 | Singapore Airlines KrisFlyer | 1:1 | 1:0.7 | KrisFlyer miles |
| 5 | Qatar Airways Privilege Club | 1:1 | 1:0.7 | Avios |
| 6 | Flying Blue (Air France-KLM) | 1:1 | 1:0.7 | Flying Blue Miles |
| 7 | JetBlue TrueBlue | 1:1 | 1:0.7 | TrueBlue points |
| 8 | Leaders Club (Leading Hotels) | **1:0.2** | **1:0.14** | Leaders Club points (1,000 = 200 / 140) |
| 9 | Qantas Frequent Flyer | 1:1 | 1:0.7 | Qantas Points |
| 10 | EVA Air Infinity MileageLands | 1:1 | 1:0.7 | Infinity MileageLands Miles |
| 11 | Etihad Guest | 1:1 | 1:0.7 | Guest Miles |
| 12 | Emirates Skywards | **1:0.8** | **1:0.56** | Skywards Miles (1,000 = 800 / 560) |
| 13 | Choice Privileges | **1:1.5** | **1:1.05** | Choice points (1,000 = 1,500 / 1,050) |
| 14 | ALL - Accor Live Limitless | **1:0.5** | **1:0.35** | ALL Reward points (1,000 = 500 / 350) |
| 15 | Cathay Pacific | 1:1 | 1:0.7 | Asia Miles |
| 16 | AAdvantage Program (American) | 1:1 | 1:0.7 | AAdvantage Bonus Miles — **NARROWER tier eligibility** (see below) |
| 17 | Avianca LifeMiles | 1:1 | 1:0.7 | LifeMiles |
| 18 | Preferred Hotels & Resorts (I Prefer) | **1:2.0** base | **1:1.4** base | I Prefer Points. 🟡 30% Bonus active: 1:2.6 / 1:1.82 |
| 19 | Wyndham Rewards | 1:1 base | 1:0.7 base | Wyndham points. 🟡 25% Bonus active: 1:1.25 / 1:0.875 |

### AAdvantage-specific tier eligibility (narrower than other partners)

- **Premium (1:1):** Citi Strata Elite, Citi Strata Premier, Citi Prestige — NO AT&T Access More
- **Standard (1:0.7):** Citi ThankYou Preferred, Citi Strata Card, Citi Double Cash, Citi Custom Cash — NO AT&T cards, NO ThankYou Mastercard

### Active promotions (as of 2026-05-18)

| Partner | Base ratio (premium / standard) | Promo bonus | Promo ratio (premium / standard) |
|---|---|---|---|
| I Prefer | 1:2.0 / 1:1.4 | +30% | 1:2.6 / 1:1.82 |
| Wyndham | 1:1 / 1:0.7 | +25% | 1:1.25 / 1:0.875 |

## ✅ Capture complete — 19 of 19 partners

---

## 🔴 BACKLOG: Tiered transfer partner schema

**Blocker:** Current `transfer_partners_outbound` JSONB row shape `{from_slug, ratio, notes, bonus_active}` cannot represent Citi's tier-based model. SQL for Citi is **on hold** until the schema is extended.

### Required schema extension

Add optional `tiers` array to the row shape:

```ts
type TransferPartnerRow = {
  from_slug: string
  // Existing single-ratio fields stay for non-tiered programs (Amex/Chase/Bilt/Cap One)
  ratio?: string
  notes?: string
  bonus_active?: boolean
  // NEW: tier-aware ratios for programs like Citi where ratio depends on
  // which card the holder has
  tiers?: Array<{
    tier: 'premium' | 'standard'
    ratio: string
    promo_ratio?: string  // when an active bonus is running
    eligible_card_slugs: string[]
  }>
}
```

### Work required to ship Citi

1. Migration to extend the JSONB validation (or just rely on app-level validation)
2. Update `TransferPartnersTable.tsx` to render tier-aware: if `tiers` present, show both ratios with eligible cards, else fall back to flat `ratio`
3. Update card detail page logic: when rendering transfer partners for a Citi card, filter to the tier the card belongs in
4. Add `card_tier` (or similar) column on `credit_cards` to drive the filtering
5. Then run the Citi SQL with all 19 partners + tiers

### Active Citi promos to preserve in final SQL

- I Prefer: +30% bonus
- Wyndham: +25% bonus


## Active bonuses (from overview)

- I Prefer (Preferred Hotels): **30% Bonus**
- Wyndham Rewards: **25% Bonus**

## Schema decision (PENDING — decide after full capture)

Three options:
1. **Two ratio fields per row**: `ratio_premium`, `ratio_standard` — backward-compatible.
2. **Tiered array**: `tiers: [{ratio, eligible_cards: [...]}]` — cleaner but breaks readers.
3. **Per-card lookup** — each card row carries its own tier flag; partner row holds a map.

Decision held until all 19 partners are captured.
