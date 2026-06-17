-- Fix regex audit findings on Omni page (free -> complimentary, guaranteed -> guarantee).
-- The two "January 2024" references are intentionally kept: that is the accurate, relevant
-- date of the Select Guest revenue-based relaunch and the legacy credit conversion.

update programs set
  how_to_spend = replace(
    how_to_spend,
    'effectively a free suite night for top-tier members',
    'effectively a complimentary suite night for top-tier members'
  ),
  sweet_spots = replace(
    sweet_spots,
    'on top of the room itself being free -- a meaningful extra saving',
    'on top of the room itself being complimentary -- a meaningful extra saving'
  ),
  tier_benefits = replace(
    replace(
      replace(
        replace(
          replace(
            tier_benefits::text,
            'Free Deluxe Wi-Fi',
            'Complimentary Deluxe Wi-Fi'
          ),
          'Free Premier Wi-Fi',
          'Complimentary Premier Wi-Fi'
        ),
        'Free upgrade by',
        'Complimentary upgrade by'
      ),
      'Guaranteed room availability with 24 hours prior notice',
      'Room availability guarantee with 24 hours prior notice'
    ),
    'Guaranteed room availability up to 4pm on the day of arrival',
    'Room availability guarantee up to 4pm on the day of arrival'
  )::jsonb,
  updated_at = now()
where slug = 'omni';
