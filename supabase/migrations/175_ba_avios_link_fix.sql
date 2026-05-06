-- BA Avios partner_chart_url + award_chart link fix.
--
-- Discovery 2026-05-06: BA aggressively bot-throttles ba.com URLs - many
-- return HTTP 200 but serve a "We are experiencing high demand" placeholder
-- to non-browser user agents. Real users in browsers see normal content.
-- Switching partner_chart_url to the most stable canonical Avios hub and
-- adding a note in award_chart that the chart is best accessed via the
-- ba.com booking flow.

update programs set
  partner_chart_url = 'https://www.britishairways.com/en-us/the-british-airways-club/avios',
  award_chart = replace(award_chart,
    '**Official chart hub:** https://www.britishairways.com/content/the-british-airways-club/avios/spending-avios/flights',
    '**Official Avios hub:** https://www.britishairways.com/en-us/the-british-airways-club/avios

(BA does not publish a single PDF of the partner-award chart. The cleanest way to price an actual route is to log into ba.com, search "Book with Avios," and check the calendar - or use the upcoming Booking Tool here. Some bot-blocking on ba.com URLs means the link may show a "high demand" placeholder for automated tools, but it loads normally in a browser.)'
  ),
  last_verified = current_date,
  content_updated_at = now(),
  updated_at = now()
where slug = 'ba-avios';
