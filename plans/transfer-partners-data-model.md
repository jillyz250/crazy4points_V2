# Transfer partners — inbound vs outbound

Migration 301 split the previously-overloaded `programs.transfer_partners`
JSONB column into two semantically explicit columns. Future editors and AI
agents authoring program reference pages must understand the distinction.

## The two columns

| Column | Meaning | Populated for |
|---|---|---|
| `programs.transfer_partners` | INBOUND — programs that transfer points/miles INTO this program | Closed-loop airline co-brand programs (Southwest, Delta, AA, United, JetBlue, Aeroplan, Atmos, Hawaiian, Singapore KrisFlyer, ANA, Cathay, Emirates, Etihad, Avianca LifeMiles, etc.) |
| `programs.transfer_partners_outbound` | OUTBOUND — programs that THIS program transfers points OUT to | Transferable card currencies (UR, MR, TY, Cap1 Miles, Bilt), hotel chains (Marriott, Hilton, Hyatt, IHG, Choice, Wyndham), and the Avios family (BA, Iberia, Aer Lingus, Qatar, Finnair, Vueling, Loganair) |

Both columns share the `TransferPartnerRow` shape:

```ts
interface TransferPartnerRow {
  from_slug: string         // structurally the OTHER program's slug
  ratio: string
  notes: string | null
  bonus_active: boolean
}
```

The field is named `from_slug` for backward compatibility — its actual
semantics depend on which JSONB column the row was read from:
- In `transfer_partners` (inbound): `from_slug` is the source program (the one
  whose points flow INTO the subject).
- In `transfer_partners_outbound`: `from_slug` is the destination program
  (the one this subject's points flow OUT to).

## Why both, not one merged list?

1. The card detail page asks two different questions: "Where can this card's
   points go?" (outbound) and, for closed-loop co-brand cards, "How else
   can I earn these?" (inbound). Mixing them on a card page was the bug
   that caused Southwest cobrand cards to falsely claim outbound transfers
   to Chase UR + Bilt + Marriott.
2. Closed-loop airline programs (Southwest, Delta, AA, etc.) have NO
   outbound destinations — you cannot move Southwest points to anything
   else. Their `transfer_partners_outbound` is empty by definition.
3. Most transferable currencies and hotels do not need an inbound list —
   nothing transfers into Chase UR. Their `transfer_partners` is empty.

## Where each column is rendered

- `/cards/[slug]`:
  - Outbound → "Transfer partners" tile (only when `points_transferable_to_partners=true`)
  - Inbound → "Other ways to earn these points" tile (only when the
    currency has no outbound AND the card itself is non-transferable)
- `/programs/[slug]`:
  - Outbound → "Transfer partners" tile ("[Program] transfers OUT to…")
  - Inbound → "Ways to earn more" tile ("Programs that transfer INTO [Program]")
- `/programs/[slug]/md` (LLM export):
  - Outbound → `## Transfer partners (outbound)`
  - Inbound → `## Ways to earn (inbound transfers)`

## Authoring rules

When adding/refreshing a program reference page:

1. Identify the program's role:
   - Is it a transferable currency (card issuer point system) or hotel chain?
     → populate `transfer_partners_outbound`. Leave `transfer_partners` empty.
   - Is it a closed-loop airline cobrand program?
     → populate `transfer_partners` with INBOUND sources. Leave outbound empty.
   - Is it an Avios family program?
     → populate `transfer_partners_outbound` (members transfer 1:1 to each other).

2. **Do NOT mix inbound and outbound in the same column.** If you find yourself
   listing the same partner in both columns, stop and ask the editor.

3. The `points_transferable_to_partners` flag on `credit_cards` is now
   automatically derived in the migration: cards whose currency program has
   empty outbound get flipped to `false`. If you change a program's
   classification, re-run the equivalent flag-fix UPDATE manually.

## Phase 2 (future, not in this PR)

- Rename `transfer_partners` → `transfer_partners_inbound` for symmetry.
- Update the admin editor to manage both columns separately (currently
  the editor only edits `transfer_partners`).
- Backfill any remaining hotel/credit-card programs that were missed by the
  Phase 1 backfill list.
