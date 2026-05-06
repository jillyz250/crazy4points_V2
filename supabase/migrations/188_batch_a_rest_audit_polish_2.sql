-- Batch-A-rest Sonnet audit polish round 2.
-- Qatar: stronger hedge on Citi-direct + partner-list comparative.
-- Miles & More: remove remaining $89 AF mentions (per feedback_no_card_af_on_program_pages).

update programs set
  intro = replace(replace(intro,
    'Citi ThankYou transfers directly to QR Avios at 1:1 - and is currently the only Avios program Citi transfers to directly.',
    'Citi ThankYou transfers directly to QR Avios at 1:1; as of May 2026 Citi does not transfer directly to other Avios family programs (BA, Iberia, Aer Lingus, Finnair).'
  ),
    'QR books several non-alliance partners that other Avios programs cannot currently book** - JetBlue, Bangkok Airways, LATAM, Virgin Australia, RwandAir, MEA, and Gol are all on the QR redemption chart but invisible to BA Avios.',
    'QR books several non-alliance partners that, as of May 2026, are not on the BA Avios redemption chart** - JetBlue, Bangkok Airways, LATAM, Virgin Australia, RwandAir, MEA, and Gol are all on the QR redemption chart but invisible to BA Avios.'
  ),
  updated_at = now()
where slug = 'qatar';

update programs set
  intro = replace(intro,
    '**Barclays Miles & More World Elite Mastercard** ($89 AF, 2x M&M partner airline tickets / 1x other).',
    '**Barclays Miles & More World Elite Mastercard** (2x M&M partner airline tickets / 1x other).'
  ),
  award_chart = replace(award_chart,
    '**Barclays Miles & More World Elite Mastercard** ($89 AF, primary US non-flying earn path):',
    '**Barclays Miles & More World Elite Mastercard** (primary US non-flying earn path):'
  ),
  updated_at = now()
where slug = 'miles-and-more';
