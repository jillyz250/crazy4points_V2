-- Append JGC clarification to the JAL row note in oneworld.member_programs.
--
-- JGC (JAL Global Club) is a lifetime-status club. A plain JMB Crystal
-- member gets oneworld Ruby, but a JGC member who currently sits at JMB
-- Crystal is upgraded to oneworld Sapphire. The tier_crossover table
-- already reflects this correctly (shows "JAL Global Club Crystal" under
-- Sapphire and "JAL Mileage Bank Crystal" under Ruby) but the note
-- doesn't explain why the same "Crystal" word appears twice.
--
-- Uses string-replace (same pattern as migration 270) — safer than
-- jsonb_set indexing because we don't have to assume the JAL row's
-- ordinal position inside the array.

update programs set
  member_programs = replace(
    member_programs::text,
    'Tokyo Haneda + Narita hubs. JAL First Class is a perennial sweet spot redemption.',
    'Tokyo Haneda + Narita hubs. JAL First Class is a perennial sweet spot redemption. JAL Global Club (JGC) is a lifetime-status club: JGC members at JMB Crystal get upgraded to oneworld Sapphire (vs Ruby for plain JMB Crystal).'
  )::jsonb,
  last_verified = current_date
where slug = 'oneworld';

-- Verify: should return 1
--   select count(*) from programs
--   where slug = 'oneworld'
--     and member_programs::text like '%JAL Global Club (JGC) is a lifetime-status club%';
