# Card Data Source Policy

## The rule

**Every fact on a card detail page must come from the issuer.** Either:

1. **Scraped by Firecrawl** from a URL on the issuer's domain (the path the
   automated extraction pipeline already takes), OR
2. **Pasted by the editor** from an authoritative issuer document — the Visa
   or Mastercard Guide to Benefits PDF, the Cardmember Agreement, the
   Pricing & Terms doc — into the `manualMarkdown` field on the extract
   page, where Sonnet then extracts it.

That's it. No other sources are acceptable for facts about a card.

## What is NOT an acceptable source

- WebSearch summaries (Bing/Google blurbs)
- Third-party reward blogs: The Points Guy, NerdWallet, Doctor of Credit,
  Upgraded Points, One Mile at a Time, AskSebby, Frequent Miler, WalletHub,
  Forbes Advisor, Bankrate, etc. — even when they cite the issuer
- Claude's training data — it goes stale, often within a year
- Copilot's training data — same problem, often the same stale facts
- Reddit / forum threads
- YouTube reviews
- Archived (Wayback Machine) versions of issuer pages unless the data hasn't
  changed since the archive date

These sources can be useful for **hints** ("this card probably has cell phone
protection — go check the issuer's GTB") but never for the actual facts
(coverage amounts, deductibles, eligibility rules) that land in the database.

## What to do when the issuer source is unreachable

This happens regularly. Firecrawl can't reach PDFs that are auth-walled or
hosted on issuer CDNs with bot-blocking. In that case:

**Option A: Leave it out.** Better to show fewer benefits accurately than
more benefits inaccurately. Users can read the Guide to Benefits they
received with the card.

**Option B: Editor obtains the authoritative document and pastes the text.**
The editor has access to their own card's mailed/emailed Guide to Benefits
or can request a copy from the issuer. Paste the relevant section into the
extract page's manualMarkdown field, set `verified_source_url` to the
canonical issuer URL the doc lives at (even if it 404s for the public),
and let Sonnet extract from authoritative text.

**Option C: Wait.** Note the gap, move on, revisit when the issuer publishes
the doc somewhere accessible.

**Never substitute third-party sources for the missing issuer source.**

## How to enforce this in code review

When reviewing any PR that contains SQL inserts into `credit_card_benefits`,
`credit_card_earn_rates`, `credit_card_welcome_bonuses`, or any update to
`credit_cards` fields (annual_fee_usd, foreign_transaction_fee_pct, etc.):

1. Check the `verified_source_url` column on each row
2. Confirm the URL is on the issuer's own domain (chase.com,
   americanexpress.com, citi.com, capitalone.com, discover.com, etc.)
3. If the URL is on a third-party domain → REJECT the PR
4. If `verified_source_url` is null AND `verified_at` is set → REJECT
   (verified-at must always pair with a source URL)
5. If the data came from `manualMarkdown` paste, the source URL should
   reference the issuer document the editor pasted from

## Historical incident (2026-05-17)

The Ink Business Preferred extraction came back missing the insurance/
protection benefits (Cell Phone Protection, Trip Cancellation, etc.) because
the Visa Sig Business Guide to Benefits PDF wasn't reachable by Firecrawl.

Claude WebSearched third-party blogs for the terms (upgradedpoints,
asksebby, wallethub) and SQL-inserted 8 benefit rows with those amounts.
The dollar amounts may have been approximately correct but they violated
this policy. Rolled back via `plans/ink-preferred-rollback-third-party.sql`.

The trigger for the rollback was a separate failure on the same day: Claude
also added a "25% travel portal uplift" benefit row sourced from Copilot's
audit, which agreed with Claude's training data. Both sources were stale —
Chase removed the flat 25% uplift in 2025 and replaced it with Points Boost
(variable, ~9% of flights). Two stale models agreeing is not verification.

Both errors share a common root cause: substituting easier-to-reach sources
for the authoritative issuer source. This policy exists to prevent it.

## See also

- `memory/feedback_verify_copilot_adds_independently.md` — broader rule on
  Copilot audits as hints not facts
- `memory/feedback_websearch_default_research.md` — when WebSearch IS the
  default (program-page research) vs when it's NOT (card facts)
- `memory/feedback_chase_marketing_page_authoritative.md` — issuer pages are
  authoritative for THAT issuer's products
