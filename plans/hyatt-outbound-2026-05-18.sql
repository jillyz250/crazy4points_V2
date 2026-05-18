-- World of Hyatt - canonical 20 outbound airline partners
-- Source: World of Hyatt Convert Points to Miles page (logged-in account)
-- Verified from Hyatt account on 2026-05-18
-- Default: 5000 Hyatt = 2000 miles (2.5:1); 6 exceptions
-- Bonus: extra 5000 bonus miles when converting 50000+ points

UPDATE programs
   SET transfer_partners_outbound = '[
  {"from_slug":"aeromexico","ratio":"5000:4000","notes":"Exception (best Hyatt ratio): 5000 = 4000 kilometers","bonus_active":false},
  {"from_slug":"air-china","ratio":"5000:3200","notes":"Exception: 5000 = 3200 PhoenixMiles","bonus_active":false},
  {"from_slug":"flying-blue","ratio":"5000:2000","notes":"Default. +5000 bonus at 50000+ converted","bonus_active":false},
  {"from_slug":"ana","ratio":"5000:2000","notes":"Default. +5000 bonus at 50000+ converted","bonus_active":false},
  {"from_slug":"aa","ratio":"5000:2000","notes":"Default. +5000 bonus at 50000+ converted","bonus_active":false},
  {"from_slug":"cathay","ratio":"5000:2000","notes":"Default. +5000 bonus at 50000+ converted","bonus_active":false},
  {"from_slug":"china-eastern","ratio":"5000:3200","notes":"Exception: 5000 = 3200 points","bonus_active":false},
  {"from_slug":"delta","ratio":"5000:2000","notes":"Default. +5000 bonus at 50000+ converted","bonus_active":false},
  {"from_slug":"emirates","ratio":"5000:2000","notes":"Default. +5000 bonus at 50000+ converted","bonus_active":false},
  {"from_slug":"etihad","ratio":"5000:2000","notes":"Default. +5000 bonus at 50000+ converted","bonus_active":false},
  {"from_slug":"jal","ratio":"5000:2000","notes":"Default. +5000 bonus at 50000+ converted","bonus_active":false},
  {"from_slug":"korean-air","ratio":"5000:2000","notes":"Default. +5000 bonus at 50000+ converted","bonus_active":false},
  {"from_slug":"qantas","ratio":"5000:2400","notes":"Exception: 5000 = 2400 Qantas Points","bonus_active":false},
  {"from_slug":"qatar","ratio":"5000:2000","notes":"Default. +5000 bonus at 50000+ converted","bonus_active":false},
  {"from_slug":"royal-brunei","ratio":"5000:2000","notes":"Default. +5000 bonus at 50000+ converted","bonus_active":false},
  {"from_slug":"krisflyer","ratio":"5000:2000","notes":"Default. +5000 bonus at 50000+ converted","bonus_active":false},
  {"from_slug":"southwest","ratio":"5000:2400","notes":"Exception: 5000 = 2400 Rapid Rewards","bonus_active":false},
  {"from_slug":"thai","ratio":"5000:2000","notes":"Default. +5000 bonus at 50000+ converted","bonus_active":false},
  {"from_slug":"united","ratio":"5000:2000","notes":"Default. +5000 bonus at 50000+ converted","bonus_active":false},
  {"from_slug":"virgin-atlantic","ratio":"5000:3000","notes":"Exception: 5000 = 3000 Virgin Points","bonus_active":false}
]'::jsonb,
       transfer_partners_verified_at = now(),
       updated_at = now()
 WHERE slug = 'hyatt';

SELECT slug, jsonb_array_length(transfer_partners_outbound) AS outbound_count
  FROM programs WHERE slug = 'hyatt';
