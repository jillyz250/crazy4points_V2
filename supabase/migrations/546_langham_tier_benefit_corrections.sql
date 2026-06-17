-- Correct two tier-benefit errors found while verifying against the Point Hacks full tier table:
--   1. VIP events / member-exclusive experiences: it is "Topaz and above" (NOT Sapphire/Ruby), and it is
--      the OPPORTUNITY TO PURCHASE tickets, not complimentary access. Moved to Topaz, reworded.
--   2. "Selection of preferred room type": official benefits matrix lists it but the tier cutoff is not
--      confirmed by any source. Removed from specific Sapphire/Ruby tier claims (still mentioned generically
--      in lounge_access). Per the no-unsourced-claims rule -- omit rather than misattribute a tier.
-- Confirmed correct + unchanged: room upgrade (Sapphire/Ruby), early check-in (Diamond+),
-- late checkout (Sapphire 2pm / Ruby 4pm), welcome amenity (Sapphire+, Ruby adds local gift).

update programs set
  tier_benefits = '[
    {
      "name": "Onyx",
      "qualification": "No minimum -- evergreen entry tier (free to join)",
      "benefits": [
        "Earn 150 Award Points and 150 Status Points per US$5 of qualified spend on rooms and dining",
        "Brilliant Member Rates on direct bookings",
        "5% dining discount at participating restaurants outside Hong Kong (15% at designated Hong Kong restaurants)"
      ]
    },
    {
      "name": "Topaz",
      "qualification": "12,000 Status Points (about US$400 of qualified spend at 150 Status Points per US$5)",
      "benefits": [
        "All Onyx benefits",
        "10% Elite Bonus Award Points on qualified stays",
        "5% dining discount outside Hong Kong (15% at designated Hong Kong restaurants)",
        "Opportunity to purchase tickets to member-exclusive experiences and VIP events (Topaz and above)"
      ]
    },
    {
      "name": "Diamond",
      "qualification": "108,000 Status Points (about US$3,600 of qualified spend)",
      "benefits": [
        "All Topaz benefits",
        "15% Elite Bonus Award Points on qualified stays",
        "10% dining discount outside Hong Kong (15% at designated Hong Kong restaurants)",
        "Early check-in, subject to availability (Diamond and above)"
      ]
    },
    {
      "name": "Sapphire",
      "qualification": "360,000 Status Points (about US$12,000 of qualified spend)",
      "benefits": [
        "All Diamond benefits",
        "25% Elite Bonus Award Points on qualified stays",
        "Room upgrade voucher (Sapphire and Ruby exclusive)",
        "Late check-out to 2pm, subject to availability (excludes resort hotels)",
        "Choice of Elite Welcome Amenity each stay (Elite Amenity Points, welcome drink, or dining credit)"
      ]
    },
    {
      "name": "Ruby",
      "qualification": "720,000 Status Points (about US$24,000 of qualified spend); also reachable via Mastercard World Elite fast-track",
      "benefits": [
        "All Sapphire benefits",
        "50% Elite Bonus Award Points on qualified stays",
        "Room upgrade voucher (Sapphire and Ruby exclusive)",
        "Late check-out to 4pm, subject to availability (excludes resort hotels)",
        "Expanded Elite Welcome Amenity choice, adding a Local Welcome Gift option"
      ]
    }
  ]'::jsonb,
  updated_at = now()
where slug = 'langham';
