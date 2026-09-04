# Two-Eyes Policy — checks & balances that don't slow us down

**Principle (Jill, 2026-09-03):** every *major* thing gets a second, independent set
of eyes, so there are two chances to catch a mistake before it ships. The goal is
**coverage without a bottleneck** — we review what can hurt us, not everything.

## Rule 1 — Review by RISK, not by everything
| Tier | What | Review |
|---|---|---|
| **Always two-eyes** | Outward-facing or irreversible: published facts, program-page data, email to subscribers, public social posts, spend/vendor commits, security changes (RLS/keys/backups), deletions | Mandatory independent check **before** it goes live |
| **Spot-check** | Routine triage, minor edits | Sampled, not every one |
| **Trusted** | Internal, reversible: drafts, notes, scratch | No review |

The tiering is 90% of the efficiency — only the handful of things that can actually
hurt us get the second look.

## Rule 2 — The checker is a DIFFERENT function than the maker
Independence is the point. A second set of eyes from the *same* lane rubber-stamps;
a different function catches a *different* failure mode. The checker answers **one
targeted question**, not "review everything."

## The maker → checker map
| Major thing | Maker | Independent checker | Targeted question |
|---|---|---|---|
| Published alert / fact | John (Content) | **Vera** (Fact-Check, under Priya) | Does every figure trace to an official source? |
| Program-page data change | Paige | Vera / Priya | Does it match the issuer's own page? |
| Newsletter / email to subscribers | Nora | John or Morgan | Right facts, right list, before send? |
| Public social post | Kesha | **Jill** (until trust) | On-brand, accurate, no overreach? |
| Spend / vendor commit | Erica | Morgan / Jill (Decision Log) | Worth it, and approved? |
| Security change (RLS/keys/backup) | Bill | **Remy** (Reliability, under Bill) | Is the second copy real — did we SEE it restore? |
| Any head's claim to Jill | (head) | **Morgan** verifies before relaying | Is this posture true right now, verified live? |

## Rule 3 — The record is the activity chain (already built)
The two-eyes is **auditable, not paperwork**: every major action logs the MAKER and
the CHECKER as rows in `employee_activity` (mig 666), shown on each person's page and
the dashboard timeline. Proven on alert publish: `publishAlertVariant` logs
`vera-factcheck` (verified) + `john-content` (published). As each other major flow is
wired to log activity, it follows the same maker+checker pattern — so "two chances to
catch it" is visible on the dashboard, never a separate chore.

**Backstops:** Morgan is the final independent check before anything reaches Jill;
Priya (with Vera) is the accuracy backstop. See [[reference_morgan_chief_of_staff]],
[[reference_accuracy_agent_system]], [[project_ai_employee_team]].

## Rule 4 — Legal gate on high-risk content (Charlie, added 2026-09-04)
Charlie (Legal) is the second set of eyes on outward-facing content that carries real
legal risk — but **risk-tiered, so it never bottlenecks the daily pipeline.**

**Legal review REQUIRED (must pass Charlie before publish):**
- **Credit-card content** (FTC financial-product / deception rules).
- **Sweepstakes / giveaways** (promo law, official rules).
- **Anything with an affiliate/referral link, a disclosure, or advice-like claims.**

**No legal gate (publish on Jill's approval as usual):** everyday points news —
transfer bonuses, devaluations, award sales, experiences, program-fact updates.

**How it runs (maker → checker → approver):** John drafts on the relevant template
(disclosure baked in, so most card content is compliant by construction) → the draft
auto-routes to Charlie for the required tiers → **Charlie returns GREEN / YELLOW (fix
this wording) / RED** → Jill approves the final → publish. Compliance-by-template +
a light gate = safe *and* fast. Charlie's review clears WORDING + DISCLOSURE only;
Priya/Vera still clear the FACTS (two separate checks). Proven 2026-09-04 on the
Hyatt bonus alert: Charlie caught an unsubstantiated "the offer will come back"
prediction (FTC) and set the editorial disclosure. See `plans/alert-templates/card-bonus-increase.md`.

## Next (unbuilt) — surface "major items awaiting a second look"
A small dashboard count of outward-facing items that shipped WITHOUT a logged checker,
so a missing second-look is visible. Build when more flows log activity. (Also unbuilt:
auto-routing card/sweepstakes drafts to Charlie — today it's run in John's block.)
