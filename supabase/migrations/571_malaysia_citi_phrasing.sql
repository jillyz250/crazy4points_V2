update programs set
  intro = replace(intro,
    'Citi ThankYou has been an on-and-off partner (verify current status), and Amex, Chase, and Capital One do not transfer at all',
    'Citi ThankYou dropped Enrich as a transfer partner in 2022 (verify whether it has since been reinstated), and Amex, Chase, and Capital One do not transfer at all'),
  quirks = replace(quirks,
    'Citi ThankYou has been an on-and-off partner (it was dropped in 2022 and sources differ on its current status -- verify at thankyou.com)',
    'Citi ThankYou dropped Enrich in 2022 (verify whether it has since been reinstated at thankyou.com)'),
  award_chart = replace(award_chart,
    'Citi ThankYou has been an on-and-off partner -- verify current status.',
    'Citi ThankYou dropped Enrich in 2022 -- verify whether it has since been reinstated.'),
  updated_at = now()
where slug = 'malaysia';
