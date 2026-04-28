# Admin Refresh Queue

**Status:** Planning doc (2026-04-28)
**Author:** Jill + Claude Code

## Goals

1. **Source of truth for content health** — every editable entity (program, card, issuer, hotel property, etc.) has a freshness expectation. The queue surfaces what's overdue, persistent until acted on.
2. **Per-category cadences** — different content types decay at different rates. Credit-card SUBs and earn rates change quarterly; airline alliance memberships shift over years. Cadence is a property of the entity *type*, not editorial taste.
3. **Auto-derived, not manually managed** — items appear in the queue when `last_verified` ages past the cadence. They disappear when `last_verified` is bumped (on save, or explicit "Mark verified" click).
4. **Visible from anywhere in admin** — a count badge in the nav surfaces urgency without forcing a click. Top-N oldest items render on the admin home.
5. **Replaces the ad-hoc scheduled-agent reminders** — once shipped, individual claude.ai routines for "re-verify card X in 3 months" become unnecessary. The queue handles it for every entity at once.

## Cadences (proposed — ratify before building)

| Entity type | Cadence | Reasoning |
|---|---|---|
| Credit card | **90 days** | SUBs change quarterly; AF + benefits shift more slowly but the SUB cadence drives the schedule |
| Issuer | 365 days | Bank-level facts (intro, website) change rarely |
| Program — airline | 180 days | Tier rules + transfer ratios shift on slower cycles than card SUBs but faster than issuers |
| Program — hotel | 180 days | Award charts annual; quirks/sweet spots shift mid-year too |
| Program — currency | 180 days | Transfer-partner roster updates a few times a year |
| Hotel property | 365 days | Categories shift annually (Hyatt April refresh, etc.); inter-cycle changes are rare |
| Alert (published) | **N/A** | Alerts are time-bound; once expired they leave the queue via the alerts admin, not the refresh queue |
| Blog post | 365 days | Long-tail; refresh on SEO health, not arbitrary cadence. Could opt out individually. |
| Hotel property pricing | 90 days | Standalone-but-related cadence: peak/off-peak point thresholds change with the chart |

**Calibration:** these are starting points. Once we run the queue for a quarter, we'll see which categories generate too many false-positive entries and tune.

## Schema

Most tables already have `last_verified date` (programs, hotel_properties, credit_cards, issuers, alerts). Two changes needed:

1. **Add `last_verified` to any entity tracked by the queue that's missing it.** Audit:
   - `programs` ✅ has it
   - `credit_cards` ✅ has it
   - `issuers` ✅ has it
   - `hotel_properties` ✅ has it
   - `credit_card_benefits` ❌ missing — but lives "under" the card, so the card's `last_verified` represents the whole bundle. Don't add per-row.
   - `credit_card_earn_rates` ❌ same as benefits — under the card
   - `credit_card_welcome_bonuses` ⚠️ debatable — SUBs change more often than the card's other facts. Could justify its own `last_verified`. Decision: add it (cheap, useful).
   - `content_ideas` (blog posts) — check; probably has updated_at but not last_verified. Add if needed.

2. **Centralized cadence config** in TS, not DB:
   ```ts
   // lib/admin/refresh-cadences.ts
   export const REFRESH_CADENCE_DAYS = {
     credit_card: 90,
     issuer: 365,
     program_airline: 180,
     program_hotel: 180,
     program_currency: 180,
     hotel_property: 365,
     credit_card_welcome_bonus: 30,   // SUBs change fastest
     blog_post: 365,
   } as const
   ```
   TS const, not DB table — values are policy, not data, and editing them doesn't need an admin form.

## Detection logic

A single SQL view (or query helper) returns all stale items:

```sql
create view admin_refresh_queue as
  select
    'credit_card' as entity_type,
    c.id as entity_id,
    c.slug,
    c.name,
    c.last_verified,
    age(now(), c.last_verified::timestamptz) as age,
    '/admin/cards/' || c.id || '/edit' as edit_url
  from credit_cards c
  where c.is_active = true
    and (c.last_verified is null or c.last_verified < current_date - interval '90 days')

  union all

  select
    'program_' || p.type as entity_type,
    p.id as entity_id,
    p.slug,
    p.name,
    p.last_verified,
    age(now(), p.last_verified::timestamptz) as age,
    '/admin/programs/' || p.slug || '/edit' as edit_url
  from programs p
  where p.is_active = true
    and (p.last_verified is null or p.last_verified < current_date -
      case p.type
        when 'airline' then interval '180 days'
        when 'hotel' then interval '180 days'
        else interval '180 days'
      end)

  union all

  -- ... issuers, hotel_properties, etc.
```

Tradeoff: **TS-side cadence config vs SQL-side**. SQL view is fast (no app-side iteration) but cadences are duplicated in TS for the badge count. Resolve by either:
- (a) Generate the SQL view from the TS const at migration time
- (b) Cadences live in SQL; TS imports them via a single fetch

Recommend **(a)** — single source of truth in TS, view rebuilt as a migration whenever cadences change. Cadence changes are rare (quarterly tuning).

## UI

### Admin nav badge
A red dot or count on the existing admin nav shows total queue length. Click → goes to `/admin/refresh-queue`.

### `/admin/refresh-queue` page
- Filter chips: by entity type (credit cards, programs, properties)
- Sort: oldest first by default
- Each row: entity name + type, last_verified date, age in days/weeks, "Edit" button → entity's edit page
- Action button: "Mark verified" (bumps `last_verified = today` without changing other data)
- Empty state when nothing stale: "🎉 All current. Next due: [N] days."

### Admin home top-N
First 5 oldest stale items render on `/admin` home as a "Needs attention" card. Links to full queue.

## Save hook

When a user saves an entity edit form (admin actions for cards, programs, etc.), the action sets `last_verified = current_date` automatically — same way the existing program edit flow already does.

For "drive-by" verifications (no real edit, just confirming current data is still right), add a "Mark verified" button that just bumps the timestamp. Useful for credit-card SUBs that haven't changed but need quarterly confirmation.

## Phases

### Phase 1 — Schema additions + cadence config
- Migration: add `last_verified` to `credit_card_welcome_bonuses` and any other entities missing it
- Add `lib/admin/refresh-cadences.ts` with the constant
- Add `admin_refresh_queue` view in SQL via migration
- ~30 min

### Phase 2 — Backend query + types
- `getRefreshQueue()` query helper in `utils/supabase/queries.ts`
- Returns typed `RefreshQueueItem[]` sorted by age
- ~15 min

### Phase 3 — `/admin/refresh-queue` page
- Server-rendered page
- Filter chips, sort, edit links
- ~30 min

### Phase 4 — Nav badge + home widget
- Count badge in admin nav (cached for 1 min)
- Top-5 widget on admin home
- ~20 min

### Phase 5 — "Mark verified" action
- Server action that bumps `last_verified` only
- Single-button form per row in the queue
- ~15 min

**Total estimate:** ~2 hours of focused work, splittable across sessions.

## Cutover from scheduled remote agents

Existing routines (May 20 Hyatt cleanup, June 1 chart capture, October WoH refresh) can stay until the queue ships. Once it ships, future "set a reminder for X" requests get fulfilled by ensuring X has a tracked `last_verified` instead of scheduling a one-off agent.

## Open questions

1. **Should completed action ALSO log to a history table?** ("Verified WoH on 2026-07-15 by Jill") — useful audit trail, but adds complexity. Recommend: skip for v1, add if we ever want to see refresh patterns.

2. **Cadence per-instance overrides?** Sometimes a specific card has more volatile data than its peers. Could allow per-row `cadence_override_days int`. Recommend: skip for v1; tune the global cadences instead.

3. **Email/Slack notifications when queue length crosses a threshold?** Eventually useful. Not v1.

4. **Should "Mark verified" require a note or reason?** ("Confirmed SUB unchanged" vs "Updated AF $95 → $250"). Recommend: skip for v1; users can edit if data changed, mark verified if it didn't.

5. **What about programs that don't have `last_verified` set yet (legacy rows)?** Treat NULL as infinitely-stale = always in queue until first verification. Forces a one-time backfill pass through every entity, which is exactly the point.
