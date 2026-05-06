-- Batch-A-rest Sonnet audit polish: hedge superlatives, remove card AF detail.
-- Findings: Qatar (2 HIGH), Cathay (1 HIGH), Miles & More (1 HIGH), Turkish (2 HIGH).

-- Qatar: hedge two unhedged absolutes about Citi-only and partner exclusivity.
update programs set
  intro = replace(replace(intro,
    'Citi ThankYou transfers directly to QR Avios at 1:1 - and to no other Avios program.',
    'Citi ThankYou transfers directly to QR Avios at 1:1 - and is currently the only Avios program Citi transfers to directly.'
  ),
    'QR books non-alliance partners no other Avios program can',
    'QR books several non-alliance partners that other Avios programs cannot currently book'
  ),
  updated_at = now()
where slug = 'qatar';

-- Cathay: hedge "no other US-accessible program" comparative.
update programs set
  how_to_spend = replace(how_to_spend,
    'no other US-accessible program books CX First as cleanly',
    'few other US-accessible programs book CX First as easily'
  ),
  updated_at = now()
where slug = 'cathay';

-- Miles & More: hedge "largest in Europe" superlative.
update programs set
  intro = replace(intro,
    'the **largest frequent flyer program in Europe** with 30+ million members',
    'one of Europe''s largest frequent flyer programs with 30+ million members'
  ),
  updated_at = now()
where slug = 'miles-and-more';

-- Turkish: hedge "more countries than any other airline" superlative + remove card AF.
update programs set
  intro = replace(intro,
    'Turkish flies to **more countries (130+) than any other airline in the world**',
    'Turkish operates one of the broadest country-coverage networks in commercial aviation, serving 130+ countries'
  ),
  award_chart = replace(award_chart,
    '**Turkish Airlines Miles&Smiles Premier Visa Signature** ($99 annual fee):',
    '**Turkish Airlines Miles&Smiles Premier Visa Signature**:'
  ),
  updated_at = now()
where slug = 'turkish';
