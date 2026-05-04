-- Final polish on Marriott Bonvoy after the apply-llm-audit pipeline
-- silently reverted a previously-applied fix (mig 113 swapped "trade-off
-- for that scale" BACK to "flip side of that scale"). The new audit
-- prompt rule 7 (transitional-phrase coherence) was added AFTER mig 113
-- ran, so Sonnet at that point judged "flip side" as preferable.
--
-- This is a real LLM-self-editing failure mode worth capturing in the
-- pickup memo: each audit round can undo a previous fix, especially when
-- prompt rules change between runs. Mitigation: re-run the FULL audit
-- chain whenever the prompt is updated, OR track applied fixes in a
-- dedicated audit-history table to prevent reintroduction. Backlog item.
--
-- Two surgical fixes:
-- 1. Restore "trade-off for that scale" wording in intro
-- 2. De-duplicate the "sweet spots beat the average..." sentence in
--    sweet_spots (apply-llm-audit's empty suggested_fix didn't actually
--    remove the dupe; both occurrences still present as of mig 113)

update programs set
  intro = replace(intro,
    'The flip side of that scale: Marriott killed the fixed-price award chart back in 2022',
    'The trade-off for that scale: Marriott killed the fixed-price award chart back in 2022'
  ),
  sweet_spots = regexp_replace(
    sweet_spots,
    '(sweet spots beat the average; do not assume cash rates make all redemptions winners\.)\s*-?\s*\1',
    '\1',
    'g'
  ),
  last_verified = now(),
  content_updated_at = now(),
  updated_at = now()
where slug = 'marriott-bonvoy';
