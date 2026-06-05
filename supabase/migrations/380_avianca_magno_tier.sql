-- ============================================================================
-- 380 - Avianca LifeMiles: add the new top tier "Magno" (effective June 10, 2026).
-- Announced by Avianca; benefits per Avianca's website. Magno sits ABOVE Diamond.
-- Diamond = 45,000 qualifying miles (22,500 on Avianca); Magno requires 110,000+
-- ALL flown on Avianca. ASCII-only.
-- ============================================================================
update programs set
  tier_benefits = tier_benefits || '[
    {
      "name": "Magno",
      "qualification": "110,000+ qualifying miles per year, all flown on Avianca metal (new top tier, effective June 10, 2026)",
      "benefits": [
        "Star Alliance Gold",
        "New top tier, sits above Diamond",
        "18 business-class upgrades on international routes within the Americas (Diamond gets 12)",
        "12 business-class upgrades on domestic routes (Diamond gets 8)",
        "4 upgrades to Insignia business class to/from Europe (Diamond gets 2)",
        "100 percent bonus miles on base miles earned (Diamond earns 80 percent)",
        "Dedicated Magno Executive agent support",
        "Complimentary snacks and beverages on all flights"
      ]
    }
  ]'::jsonb,
  last_verified = now(), content_updated_at = now(), updated_at = now()
where slug = 'avianca';

select jsonb_array_length(tier_benefits) as tier_count from programs where slug = 'avianca';
