-- Citi ThankYou DOES currently transfer to Enrich at 1:1 (FrequentMiler maintained 2026 list;
-- the 2022 drop was temporary). Add Citi to transfer_partners and update prose to state it as
-- current fact, removing the hedge. FM notes Enrich award values are modest, so the
-- "book via Avios/AAdvantage" nuance is retained.

update programs set
  transfer_partners = '[
    {"from_slug": "citi", "ratio": "1:1", "notes": "Citi ThankYou Rewards transfers to Enrich at 1:1 (1-2 day transfer, no fee). The main US on-ramp to Enrich -- but Enrich award values are modest, so compare against booking Malaysia Airlines via Avios or AAdvantage."},
    {"from_slug": "marriott", "ratio": "3:1", "notes": "Marriott Bonvoy transfers to Enrich at the standard hotel-to-airline rate (roughly 3 Bonvoy points to 1 mile, with a bonus on 60,000-point increments). No transfer tax. Verify the current ratio at marriott.com before transferring."}
  ]'::jsonb,

  intro = replace(intro,
    'Marriott Bonvoy transfers into Enrich, Citi ThankYou dropped Enrich as a transfer partner in 2022 (verify whether it has since been reinstated), and Amex, Chase, and Capital One do not transfer at all -- there is no US Enrich co-brand card.',
    'Citi ThankYou transfers into Enrich at 1:1 and Marriott Bonvoy transfers in as well, while Amex, Chase, and Capital One do not -- and there is no US Enrich co-brand card.'),

  sweet_spots = replace(sweet_spots,
    '**For US flyers, book the flights -- do not chase the currency**: With no Amex/Chase/Capital One transfer and only on-and-off Citi access, the better play is usually to book Malaysia Airlines metal using AAdvantage miles or Avios (both easy to top up from US cards) rather than accumulating Enrich Points.',
    '**For US flyers, weigh the flights against the currency**: Citi ThankYou (1:1) and Marriott feed Enrich from the US, but Enrich award values are modest, so it is often better to book Malaysia Airlines metal using AAdvantage miles or Avios (both easy to top up from US cards) than to accumulate Enrich Points.'),

  quirks = replace(
    replace(quirks,
      'Marriott Bonvoy transfers into Enrich; Citi ThankYou dropped Enrich in 2022 (verify whether it has since been reinstated at thankyou.com); Amex, Chase, and Capital One do not transfer, and there is no US Enrich co-brand card.',
      'Citi ThankYou transfers into Enrich at 1:1 and Marriott Bonvoy transfers in; Amex, Chase, and Capital One do not, and there is no US Enrich co-brand card.'),
    'To fly Malaysia Airlines on points, US travelers can usually book its metal through another oneworld program -- AAdvantage miles or Avios -- both of which are easy to fund from US cards. That sidesteps the Enrich access problem entirely.',
    'Enrich''s own award values are modest, so even though Citi ThankYou funds it directly, US travelers can often get better value booking Malaysia Airlines metal through AAdvantage miles or Avios.'),

  award_chart = replace(award_chart,
    'Marriott Bonvoy transfers to Enrich (standard hotel-to-airline rate). Citi ThankYou dropped Enrich in 2022 -- verify whether it has since been reinstated. Amex, Chase, and Capital One do not transfer to Enrich.',
    'Citi ThankYou transfers to Enrich at 1:1, and Marriott Bonvoy transfers in at the standard hotel-to-airline rate. Amex, Chase, and Capital One do not transfer to Enrich.'),

  updated_at = now()
where slug = 'malaysia';
