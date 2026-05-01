-- 066_seed_alliance_tier_benefits.sql
-- Seeds tier_benefits jsonb on the three alliance program rows so the
-- Alliance Explorer tool can render structured tier ladders.
--
-- Sources: crazy4points alliance pages + oneworld.com / skyteam.com / staralliance.com
-- Reviewed against Copilot + ChatGPT cross-checks (2026-05-01).
--
-- Schema reminder: tier_benefits is a jsonb array of:
--   { name, qualification, benefits: [string, ...] }

update programs
set tier_benefits = '[
  {
    "name": "Ruby",
    "qualification": "Entry-tier alliance status; thresholds set by each member program",
    "benefits": [
      "Priority check-in at Business Class counters",
      "Preferred or pre-reserved seating",
      "Waitlist and standby priority",
      "No alliance-wide lounge access"
    ]
  },
  {
    "name": "Sapphire",
    "qualification": "Mid-tier alliance status; thresholds set by each member program",
    "benefits": [
      "Business Class lounge access on same-day oneworld flight (Qantas Domestic Business Lounges excluded)",
      "+1 guest in lounge (guest must travel on a same-day oneworld flight)",
      "Priority check-in, boarding, and baggage handling",
      "Extra checked baggage allowance",
      "Preferred or pre-reserved seating"
    ]
  },
  {
    "name": "Emerald",
    "qualification": "Top-tier alliance status; thresholds set by each member program",
    "benefits": [
      "First and Business Class lounge access on same-day oneworld flight",
      "+1 guest in lounge (guest must travel on a same-day oneworld flight)",
      "Fast-track security where available",
      "Priority check-in, boarding, and baggage handling",
      "Extra checked baggage allowance",
      "Airport standby and waitlist priority"
    ]
  }
]'::jsonb
where slug = 'oneworld';

update programs
set tier_benefits = '[
  {
    "name": "Elite",
    "qualification": "Mid-tier alliance status; thresholds set by each member program",
    "benefits": [
      "Priority reservations waitlist",
      "Priority check-in and boarding",
      "Extra checked baggage allowance",
      "Select SkyPriority services (full SkyPriority reserved for Elite Plus and premium cabins)",
      "No alliance-wide lounge access"
    ]
  },
  {
    "name": "Elite Plus",
    "qualification": "Top-tier alliance status; thresholds set by each member program",
    "benefits": [
      "Lounge access at 750+ SkyTeam lounges regardless of cabin (select domestic access added April 2025)",
      "+1 guest in lounge (guest must travel on the same SkyTeam flight)",
      "Guaranteed full-fare Y-class reservation on sold-out long-haul flights at least 24 hours before departure",
      "Priority baggage handling",
      "Extra checked baggage allowance",
      "Full SkyPriority service across check-in, security, boarding, and baggage"
    ]
  }
]'::jsonb
where slug = 'skyteam';

update programs
set tier_benefits = '[
  {
    "name": "Silver",
    "qualification": "Mid-tier alliance status; thresholds set by each member program",
    "benefits": [
      "Priority reservations waitlist",
      "Priority airport standby",
      "Priority check-in on some member airlines (not guaranteed alliance-wide)",
      "No alliance-wide lounge access; no Gold Track"
    ]
  },
  {
    "name": "Gold",
    "qualification": "Top-tier alliance status; thresholds set by each member program",
    "benefits": [
      "Lounge access at 1,000+ member lounges plus 6 Star Alliance-branded lounges (LAX, GIG, EZE, CDG, GRU, CAN)",
      "+1 guest in lounge (guest must travel on a same-day Star Alliance-operated flight)",
      "Gold Track priority security and immigration at 100+ checkpoints",
      "Priority check-in",
      "Priority boarding (ahead of general boarding; exact group varies by airline)",
      "Priority baggage handling",
      "Priority waitlist and standby"
    ]
  }
]'::jsonb
where slug = 'star_alliance';
