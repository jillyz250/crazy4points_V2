-- ============================================================================
-- 375 - Marriott outbound roster corrections (hotel audit, cross-checked).
-- Verified against point.me's published 2026 roster + Copilot + ChatGPT:
--   REMOVE (not current Marriott partners): korean-air, eva-air, china-airlines
--     (it's China SOUTHERN, not China Airlines), garuda-indonesia, flydubai.
--   ADD (confirmed current, base 3:1): china-southern, hainan-airlines.
-- (jetsmart/alaska/hawaiian already removed in 374.) 47 -> 44.
--
-- Note (follow-up, not done here): Marriott's 5,000-mile-per-60,000 bonus
-- applies to MOST partners but NOT American/Delta/Avianca (flat 3:1), and United
-- gets an enhanced bonus. Our per-row "+bonus" annotation is inconsistent -
-- normalize later (likely move the bonus rule into Marriott's quirks, keep
-- ratios a clean "3:1").
-- ============================================================================

-- china-southern has no program row yet - add a reference stub so the edge resolves.
insert into programs (slug, name, type, is_active, is_reference_stub)
values ('china-southern', 'China Southern Sky Pearl Club', 'airline', true, true)
on conflict (slug) do nothing;

update programs set
  transfer_partners_outbound = (
    (select coalesce(jsonb_agg(p), '[]'::jsonb)
     from jsonb_array_elements(transfer_partners_outbound) p
     where p->>'from_slug' not in ('korean-air', 'eva-air', 'china-airlines', 'garuda-indonesia', 'flydubai'))
    || '[
      {"from_slug":"china-southern","ratio":"3:1","bonus_active":false,"notes":"Marriott Bonvoy points transfer to airline miles (3:1; 5,000-mile bonus per 60,000 transferred)."},
      {"from_slug":"hainan-airlines","ratio":"3:1","bonus_active":false,"notes":"Marriott Bonvoy points transfer to airline miles (3:1; 5,000-mile bonus per 60,000 transferred)."}
    ]'::jsonb
  ),
  last_verified = now(), updated_at = now()
where slug = 'marriott-bonvoy';

select jsonb_array_length(transfer_partners_outbound) as marriott_outbound_after,
  (transfer_partners_outbound @> '[{"from_slug":"china-southern"}]') has_china_southern,
  (transfer_partners_outbound @> '[{"from_slug":"eva-air"}]') still_has_eva
from programs where slug = 'marriott-bonvoy';
