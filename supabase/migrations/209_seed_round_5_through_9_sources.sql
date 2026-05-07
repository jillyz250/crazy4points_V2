-- Add 48 official-partner sources to the daily/weekly Scout intel pipeline
-- for the airline programs authored in rounds 5-9.
--
-- Tier convention (matching existing rows):
--   tier=1 = official_partner press rooms / loyalty news pages (highest priority)
--   scrape_frequency: 'daily' for high-news-volume programs, 'weekly' for the rest
--   use_firecrawl=true (most of these are JS-rendered marketing pages)
--
-- Daily (10): the most active programs — frequent transfer-partner changes,
-- alliance moves, devaluations, fleet news.
-- Weekly (38): everything else — occasional updates that don't warrant daily scans.

-- ============================================================
-- DAILY - 10 most active programs
-- ============================================================
insert into sources (name, url, type, tier, is_active, scrape_frequency, use_firecrawl, notes) values
  ('Emirates Skywards', 'https://www.emirates.com/media-centre/', 'official_partner', 1, true, 'daily', true, 'Press room - frequent Skywards updates incl. transfer-partner changes (Amex 5:4, Cap One 4:3, Citi 1000:800, Chase ENDED Oct 2025).'),
  ('Etihad Guest News', 'https://www.etihad.com/en-us/news', 'official_partner', 1, true, 'daily', true, 'Etihad newsroom - active program (Amex MR ending Jun 30 2026; March 2026 elite threshold reduction in progress).'),
  ('Aer Lingus Press Room', 'https://www.aerlingus.com/about-us/press-room/', 'official_partner', 1, true, 'daily', true, 'Aer Lingus press room - AJB updates, A321XLR transatlantic news.'),
  ('Air India Newsroom', 'https://www.airindia.com/in/en/about-air-india/newsroom.html', 'official_partner', 1, true, 'daily', true, 'Air India / Maharaja Club post-Vistara merger; April 2026 chart revaluation; ongoing fleet expansion.'),
  ('Aeromexico Newsroom', 'https://news.aeromexico.com/', 'official_partner', 1, true, 'daily', true, 'Aeromexico Rewards (Aug 2025 dynamic pricing shift; Citi ENDED Jan 2026; SkyTeam moves).'),
  ('Korean Air Newsroom', 'https://www.koreanair.com/contents/footer/about-us/news', 'official_partner', 1, true, 'daily', true, 'Korean Air SKYPASS - Asiana integration (target Jan 2027); Marriott partnership ENDED 2025.'),
  ('Avianca LifeMiles News', 'https://www.avianca.com/us/en/about-us/press-room/', 'official_partner', 1, true, 'daily', true, 'LifeMiles - 2026 transfer-bonus cadence; Diamond International VIP Lounge BOG opened 2026.'),
  ('LATAM Press Room', 'https://www.latamairlines.com/us/en/press-room', 'official_partner', 1, true, 'daily', true, 'LATAM Pass - oneworld rejoin status (Feb 2026 reports); March 2026 partner narrowing.'),
  ('Aegean Press Room', 'https://en.aegeanair.com/about-aegean-and-olympic-air/press-room/press-releases/', 'official_partner', 1, true, 'daily', true, 'Aegean Miles+Bonus - Nov 5 2026 tier overhaul incoming (doubles Aegean-flight requirements + new Platinum tier).'),
  ('Finnair Press Releases', 'https://company.finnair.com/en/media/press-releases', 'official_partner', 1, true, 'daily', true, 'Finnair Plus - Avios family changes; May 2026 JAL earning changes; Cap One 1:1 direct since 2024.');

-- ============================================================
-- WEEKLY - 38 lower-news-volume programs
-- ============================================================
insert into sources (name, url, type, tier, is_active, scrape_frequency, use_firecrawl, notes) values
  -- Round 5 remainder
  ('EVA Air Press Center', 'https://www.evaair.com/en-us/about-eva-air/press/press-center.html', 'official_partner', 1, true, 'weekly', true, 'EVA Infinity MileageLands - May 1 2026 priority boarding for Gold/Diamond + companions.'),
  ('Air New Zealand Press Centre', 'https://www.airnewzealandnewsroom.com/', 'official_partner', 1, true, 'weekly', true, 'Airpoints rebranding to Koru April 22 2026; new top tier Koru Black; new Premier Lounge AKL late 2026.'),
  ('Velocity Frequent Flyer News', 'https://www.virginaustralia.com/au/en/newsroom/', 'official_partner', 1, true, 'weekly', true, 'Velocity / Virgin Australia - Oct 2025 tier overhaul (Platinum Plus); SkyTeam joining rumors persistent.'),
  -- Round 6
  ('Thai Airways Newsroom', 'https://www.thaiairways.com/en/news/news_announcement/news.page', 'official_partner', 1, true, 'weekly', true, 'Royal Orchid Plus - exited rehabilitation 2026; AMS resumed July 2026; iLoyal platform 2025.'),
  ('Asiana News', 'https://flyasiana.com/C/KR/EN/customer/notice', 'official_partner', 1, true, 'weekly', true, 'Asiana Club SUNSETTING into Korean SKYPASS by Jan 1 2027. Watch integration milestones.'),
  ('Air China Press Center', 'https://www.airchina.us/US/GB/info/news/', 'official_partner', 1, true, 'weekly', true, 'PhoenixMiles - currency in km; April 2026 fuel surcharge raise; ITA Airways partnership announced March 2026.'),
  ('Royal Jordanian Press', 'https://www.rj.com/en/about-rj/press-releases', 'official_partner', 1, true, 'weekly', true, 'Royal Club (rebranded from Royal Plus); status-match path is the headline US value.'),
  ('Saudia Press Releases', 'https://www.saudia.com/about-saudia/news/news-saudia', 'official_partner', 1, true, 'weekly', true, 'Alfursan - SkyTeam member; Vision 2030 fleet expansion; Riyadh Air launch competitive impact.'),
  ('TAP Air Portugal Press', 'https://www.flytap.com/en-us/about-tap/press-area', 'official_partner', 1, true, 'weekly', true, 'TAP Miles&Go - privatization process active 2025-26; Bilt + Cap One + Marriott transfers.'),
  ('China Airlines News', 'https://www.china-airlines.com/us/en/discover/news', 'official_partner', 1, true, 'weekly', true, 'Dynasty Flyer - new Status Points qualification system 2025-2026; status extensions through Jan 2027.'),
  ('Vietnam Airlines News', 'https://www.vietnamairlines.com/us/en/vietnam-airlines/news-events', 'official_partner', 1, true, 'weekly', true, 'Lotusmiles - aggressive paid status-match campaigns; July 1 2026 threshold tightening.'),
  ('Garuda Indonesia News', 'https://www.garuda-indonesia.com/oc/en/news-and-events/news/', 'official_partner', 1, true, 'weekly', true, 'GarudaMiles - April 2026 chart in effect post-Q1 temporary devaluation.'),
  -- Round 7
  ('Royal Air Maroc News', 'https://www.royalairmaroc.com/us-en/news', 'official_partner', 1, true, 'weekly', true, 'Safar Flyer - oneworld member since April 2020; status-match $149/$349/$749 through Dec 2026.'),
  ('Ethiopian News', 'https://corporate.ethiopianairlines.com/news', 'official_partner', 1, true, 'weekly', true, 'ShebaMiles - Marriott Bonvoy partnership LAUNCHED March 27 2026 (3:1 with 5K bonus per 60K).'),
  ('SAA Voyager News', 'https://www.flysaa.com/about-us/news-and-press', 'official_partner', 1, true, 'weekly', true, 'Voyager - operationally fragile post-business-rescue; CEO transition April 2026; Takatso deal collapsed 2024.'),
  ('Egypt Air News', 'https://www.egyptair.com/en/about-egyptair/news/Pages/default.aspx', 'official_partner', 1, true, 'weekly', true, 'EgyptAir Plus - Family Account up to 8 = backdoor cheap Star Gold; New Cairo Airport future hub.'),
  ('Aerolineas Argentinas News', 'https://www.aerolineas.com.ar/en-us/aerolineas-plus/news', 'official_partner', 1, true, 'weekly', true, 'AR Plus - SkyTeam since 2012; privatization pressure under Milei admin.'),
  ('Azul Press', 'https://ri.voeazul.com.br/en/news-and-events/press-releases/', 'official_partner', 1, true, 'weekly', true, 'Azul Fidelidade (rebranded from TudoAzul Apr 2024); Diamante Unique + Azul One launched Jan 13 2026.'),
  ('Volaris News', 'https://newsroom.volaris.com/', 'official_partner', 1, true, 'weekly', true, 'v.club paid discount-club model; $29.99 individual / $49.99 duo / $149.99 friends-and-family.'),
  -- Round 8
  ('Copa Airlines News', 'https://news.copaair.com/', 'official_partner', 1, true, 'weekly', true, 'ConnectMiles - Marriott 3:1 only US currency path; Jan 2025 partner-chart devaluation.'),
  ('Fiji Airways News', 'https://www.fijiairways.com/en-us/about-us/media-centre/news', 'official_partner', 1, true, 'weekly', true, 'Joined oneworld April 1 2025 as 15th member; Tabua Club is paid subscription, AAdvantage powers FFP earning.'),
  ('Vueling Press', 'https://www.vueling.com/en/we-are-vueling/press-room', 'official_partner', 1, true, 'weekly', true, 'Vueling Club (Avios family) - Jan 2026 earning gate (Eur 200/3 flights before Avios accrue).'),
  ('Air Astana Newsroom', 'https://airastana.com/global-en/information/press-room/news', 'official_partner', 1, true, 'weekly', true, 'Nomad Club - NOT a Star Alliance Connecting Partner (only Juneyao + Thai Smile are CPs).'),
  ('Cebu Pacific News', 'https://www.cebupacificair.com/about-us/press-releases', 'official_partner', 1, true, 'weekly', true, 'Go Rewards (renamed from GetGo 2021) - coalition program with Robinsons Retail, restaurants.'),
  ('Philippine Airlines News', 'https://www.philippineairlines.com/aboutus/news/press-releases', 'official_partner', 1, true, 'weekly', true, 'Mabuhay Miles - non-aligned; NEW: Atmos Rewards / Alaska partnership announced May 2025.'),
  ('El Al News', 'https://www.elal.com/en/PressArea/Pages/default.aspx', 'official_partner', 1, true, 'weekly', true, 'Matmid - Delta partnership Jan 2024 replaced AA + Alaska partners; April 2025 overhaul +30% thresholds.'),
  ('flydubai News', 'https://news.flydubai.com/', 'official_partner', 1, true, 'weekly', true, 'flydubai uses Emirates Skywards - April 29 2025 Classic Rewards expansion across all cabins from 5K Miles.'),
  ('VivaAerobus News', 'https://www.vivaaerobus.com/en-us/press-releases', 'official_partner', 1, true, 'weekly', true, 'VivaFan paid discount club (NOT points); annual ~MXN 1499/yr; Allegiant JV proposal pending.'),
  ('Pegasus Press', 'https://www.flypgs.com/en/press-room', 'official_partner', 1, true, 'weekly', true, 'BolBol - Turkish ULCC hybrid points + paid model.'),
  -- Round 9
  ('Bulgaria Air News', 'https://www.air.bg/en/news', 'official_partner', 1, true, 'weekly', true, 'FlyMore - regional carrier; minimal US-reader relevance.'),
  ('Wizz Air News', 'https://wizzair.com/en-gb/information-and-services/about-us/news', 'official_partner', 1, true, 'weekly', true, 'WDC paid discount club (NOT points); 2026 fee changes; MultiPass UK relaunch March 2026.'),
  ('AirAsia News', 'https://newsroom.airasia.com/', 'official_partner', 1, true, 'weekly', true, 'airasia rewards (rebranded from BIG Loyalty) - lifestyle/coalition platform with 300+ partners.'),
  ('Air India Express News', 'https://www.airindiaexpress.com/about-us/news-and-events', 'official_partner', 1, true, 'weekly', true, 'AIX integrating into Maharaja Club - April 2026 redemption launched, earning later 2026.'),
  ('Norwegian News', 'https://www.norwegian.com/uk/about/company/news', 'official_partner', 1, true, 'weekly', true, 'Norwegian Reward CashPoints - cashback model; no longer flies to US (long-haul 787 retired 2021).'),
  ('IndiGo News', 'https://www.goindigo.in/information/news.html', 'official_partner', 1, true, 'weekly', true, 'BluChip (launched 2024) - cashback model; Indian ULCC; no US service.'),
  ('Bamboo Airways News', 'https://www.bambooairways.com/vn/en/about/news', 'official_partner', 1, true, 'weekly', true, 'Bamboo Club - heavily contracted post-2023 collapse; domestic Vietnam only as of May 2026.'),
  ('Air Tahiti Nui News', 'https://us.airtahitinui.com/news', 'official_partner', 1, true, 'weekly', true, 'Club Tiare - real US value via AAdvantage / Atmos / Flying Blue partner routings.'),
  ('JetSmart News', 'https://jetsmart.com/news/', 'official_partner', 1, true, 'weekly', true, 'JetSmart uses AAdvantage as its loyalty program (since Sept 2024). All You Can Fly subscription April 2026.');
