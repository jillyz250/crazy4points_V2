-- ACCURACY FIXES on Melia Rewards page (self-audit 2026-06-17):
--
-- (1) Brand count: "seven brands" is wrong. T&C hotel list shows 8 distinct brand labels:
--     Gran Melia, Melia Hotels & Resorts, ME by Melia, The Melia Collection, Paradisus
--     by Melia, Innside by Melia, Sol by Melia, Affiliated by Melia. Changing to
--     "a portfolio of brands" to avoid exact-count maintenance burden.
--
-- (2) Amex Platinum status: UK/international Amex Platinum grants complimentary Melia
--     Gold status (confirmed at americanexpress.com/idc/). US Amex Platinum does NOT
--     include Melia Gold (US grants Marriott + Hilton Gold only). Adding to quirks
--     with clear UK/international framing.

update programs set
  intro = replace(intro,
    'with more than 350 properties across seven brands',
    'with more than 350 properties across a portfolio of brands'),
  quirks = quirks || E'\n- **UK/international Amex Platinum grants complimentary Gold status.** Holders of the American Express Platinum Card issued outside the US (UK, Europe, and other international markets) receive complimentary Melia Rewards Gold status without needing to meet stay or points thresholds. Status persists as long as the Platinum card is held in good standing. US-issued Amex Platinum does not include Melia Gold (the US card grants Marriott Bonvoy Gold and Hilton Honors Gold instead). If you hold a non-US Amex Platinum, enroll via the card benefits portal.',
  updated_at = now()
where slug = 'melia';
