-- Normalize hotel_properties.country to use full country names (matching
-- destinations.country format) so the Decision Engine API can join them.
--
-- BACKGROUND
-- The destinations table stores country as full English name ("United
-- States", "Japan", "France"). hotel_properties was originally storing
-- ISO 2-letter codes ("US", "JP", "FR") because the scrape config used
-- country codes for compactness. The Decision Engine API
-- (/api/decision-engine) filters hotels by exact country match against
-- destinations.country - so until the formats align, US properties don't
-- surface in any US destination's hotel list.
--
-- This migration converts existing hotel_properties.country to full
-- names. The scrape script also gets a country-name fallback added so
-- future blocks store full names directly.
--
-- Block 1 only seeded US properties so this migration is mostly a US
-- conversion. Future blocks may add other ISO codes that need similar
-- conversion.

update hotel_properties set country = case country
  when 'US' then 'United States'
  when 'CA' then 'Canada'
  when 'MX' then 'Mexico'
  when 'GB' then 'United Kingdom'
  when 'JP' then 'Japan'
  when 'CN' then 'China'
  when 'KR' then 'South Korea'
  when 'IN' then 'India'
  when 'AU' then 'Australia'
  when 'NZ' then 'New Zealand'
  when 'BR' then 'Brazil'
  when 'AR' then 'Argentina'
  when 'CL' then 'Chile'
  when 'CO' then 'Colombia'
  when 'PE' then 'Peru'
  when 'DE' then 'Germany'
  when 'FR' then 'France'
  when 'IT' then 'Italy'
  when 'ES' then 'Spain'
  when 'PT' then 'Portugal'
  when 'NL' then 'Netherlands'
  when 'BE' then 'Belgium'
  when 'CH' then 'Switzerland'
  when 'AT' then 'Austria'
  when 'IE' then 'Ireland'
  when 'PL' then 'Poland'
  when 'CZ' then 'Czech Republic'
  when 'GR' then 'Greece'
  when 'TR' then 'Turkey'
  when 'NO' then 'Norway'
  when 'SE' then 'Sweden'
  when 'DK' then 'Denmark'
  when 'FI' then 'Finland'
  when 'IS' then 'Iceland'
  when 'AE' then 'United Arab Emirates'
  when 'SA' then 'Saudi Arabia'
  when 'QA' then 'Qatar'
  when 'IL' then 'Israel'
  when 'JO' then 'Jordan'
  when 'EG' then 'Egypt'
  when 'MA' then 'Morocco'
  when 'ZA' then 'South Africa'
  when 'KE' then 'Kenya'
  when 'TH' then 'Thailand'
  when 'VN' then 'Vietnam'
  when 'MY' then 'Malaysia'
  when 'SG' then 'Singapore'
  when 'PH' then 'Philippines'
  when 'ID' then 'Indonesia'
  when 'HK' then 'Hong Kong'
  when 'TW' then 'Taiwan'
  else country
end
where country is not null and length(country) = 2;
