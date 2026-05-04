-- Atmos Rewards: populate programs.award_chart with the official partner +
-- own-metal award chart. Source scraped 2026-05-04 from
-- https://www.alaskaair.com/atmosrewards/content/use-points/award-charts
-- (saved at /tmp/atmos-charts.md, 359 lines).
--
-- The chart is the canonical source-of-truth for redemption costs and
-- powers programSourceText.ts (alert fact-checker reads this field).
--
-- ASCII-only per feedback_ascii_only_in_sql_data.md.

update programs
set award_chart = $$
## Partner award charts (oneworld + non-oneworld partners)

Distance-banded by region. Points shown are starting-at; routes can price higher based on city pair, demand, segments, and partner availability.

### Americas (US to Americas, within Americas)

| Distance (miles) | Economy | Premium Economy | Business | First |
| --- | --- | --- | --- | --- |
| Less than 700 | 4,500 | 6,000 | 9,000 | 13,500 |
| 701-1,400 | 7,500 | 10,000 | 15,000 | 25,000 |
| 1,401-2,100 | 12,500 | 17,500 | 25,000 | 40,000 |
| 2,101-4,000 | 17,500 | 22,500 | 35,000 | 52,500 |
| 4,001-6,000 | 25,000 | 32,500 | 50,000 | 75,000 |
| 6,001 and above | 30,000 | 40,000 | 60,000 | 90,000 |

### Europe, Middle East, Africa (US to EMEA, within EMEA)

| Distance (miles) | Economy | Premium Economy | Business | First |
| --- | --- | --- | --- | --- |
| Less than 1,500 | 7,500 | 10,000 | 15,000 | 22,500 |
| 1,501-3,500 | 22,500 | 30,000 | 45,000 | 67,500 |
| 3,501-5,000 | 27,500 | 35,000 | 55,000 | 82,500 |
| 5,001-7,000 | 35,000 | 45,000 | 70,000 | 105,000 |
| 7,001-10,000 | 42,500 | 55,000 | 85,000 | 130,000 |
| 10,000 and above | 55,000 | 72,500 | 110,000 | 165,000 |

### Asia Pacific (US to AP, within AP, AP-EMEA)

| Distance (miles) | Economy | Premium Economy | Business | First |
| --- | --- | --- | --- | --- |
| Less than 1,500 | 7,500 | 10,000 | 15,000 | 22,500 |
| 1,501-3,000 | 25,000 | 32,500 | 50,000 | 75,000 |
| 3,001-5,000 | 30,000 | 40,000 | 60,000 | 90,000 |
| 5,001-7,000 | 37,500 | 50,000 | 75,000 | 110,000 |
| 7,001-10,000 | 42,500 | 55,000 | 85,000 | 130,000 |
| 10,000 and above | 65,000 | 85,000 | 130,000 | 195,000 |

## Alaska + Hawaiian own-metal (North America)

Applies to awards wholly on Alaska Airlines or Hawaiian Airlines.

| Distance (miles) | Economy | First |
| --- | --- | --- |
| Less than 700 | 4,500 | 15,000 |
| 701-1,400 | 7,500 | 25,000 |
| 1,401-2,100 | 10,000 | 25,000 |
| 2,101-3,500 | 12,500 | 30,000 |
| 3,501 and above | 20,000 | 60,000 |

Premium economy on own-metal awards starts at 30 percent more than the economy rate.

## Booking and fees

- Book on alaskaair.com or hawaiianair.com.
- Taxes and carrier fees from $5.60 per person each way (route-dependent).
- $12.50 partner-award fee per person each way on partner-operated segments. No fee on Alaska, Hawaiian, or Horizon flights.
- Mixed-cabin itineraries price at the highest cabin in the itinerary.
- One enroute stopover (up to 14 days) per one-way on eligible international itineraries; two on roundtrip international (one each direction).
- Lap infants not permitted on international partner awards.
- International awards (origin and destination both outside the US) must be booked at least 72 hours before departure.
- Atmos award tickets cannot earn miles in another program.
$$
where slug = 'atmos';
