-- Verified per-airline conversion ratios (official base 1:1, confirmed exceptions
-- from 2026 sources: KrisFlyer 1:1.25; China Southern Sky Pearl + Hainan Fortune
-- Wings 1:1.6). Min 1,000 points, 500 increments, no transfer tax. Held inactive.
update programs set
  transfer_partners_outbound = '[
    {"from_slug":"air-china","ratio":"1:1","notes":"To Air China PhoenixMiles, 1:1. No transfer tax; min 1,000 points, then 500 increments.","bonus_active":false},
    {"from_slug":"air-france","ratio":"1:1","notes":"To Air France-KLM Flying Blue, 1:1. No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"ana","ratio":"1:1","notes":"To ANA Mileage Club, 1:1. No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"cathay","ratio":"1:1","notes":"To Cathay (Asia Miles), 1:1. No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"china-southern","ratio":"1:1.6","notes":"To China Southern Sky Pearl Club, 1:1.6 (a strong ratio). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"delta","ratio":"1:1","notes":"To Delta SkyMiles, 1:1. No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"etihad","ratio":"1:1","notes":"To Etihad Guest, 1:1. No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"finnair","ratio":"1:1","notes":"To Finnair Plus, 1:1. No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"hainan-airlines","ratio":"1:1.6","notes":"To Hainan Fortune Wings Club, 1:1.6 (a strong ratio). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"juneyao","ratio":"1:1","notes":"To Juneyao Air, 1:1. No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"oman-air","ratio":"1:1","notes":"To Oman Air Sindbad, 1:1. No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"philippine-airlines","ratio":"1:1","notes":"To Philippine Airlines Mabuhay Miles, 1:1. No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"qantas","ratio":"1:1","notes":"To Qantas Frequent Flyer, 1:1. No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"qatar","ratio":"1:1","notes":"To Qatar Privilege Club, 1:1. No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"saudia","ratio":"1:1","notes":"To Saudia AlFursan, 1:1. No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"krisflyer","ratio":"1:1.25","notes":"To Singapore Airlines KrisFlyer, 1:1.25. Periodic conversion bonuses appear (e.g. a 2025 promo lifted it to ~1.56). No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"united","ratio":"1:1","notes":"To United MileagePlus, 1:1. No transfer tax; min 1,000 points.","bonus_active":false},
    {"from_slug":"virgin-australia","ratio":"1:1","notes":"To Velocity Frequent Flyer, 1:1. No transfer tax; min 1,000 points.","bonus_active":false}
  ]'::jsonb,
  last_verified = current_date, updated_at = now()
where slug = 'shangri-la';
