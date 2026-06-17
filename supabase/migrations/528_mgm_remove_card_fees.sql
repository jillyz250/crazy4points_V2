-- Remove card annual fees from intro, award_chart, and lounge_access.
-- Per audit: card fees belong on the card product page, not the program page.

update programs set
  intro = replace(
    intro,
    'The MGM Rewards Iconic Mastercard from FNBO ($249/year) fast-tracks earning at 6 Tier Credits per dollar at MGM properties.',
    'The MGM Rewards Iconic Mastercard from FNBO fast-tracks earning at 6 Tier Credits per dollar at MGM properties.'
  ),
  award_chart = replace(
    replace(
      award_chart,
      '- MGM Rewards Iconic World Elite Mastercard ($249/year): 6x points + TCs at MGM Resorts destinations; 2x at hotels, dining, gas stations, and grocery stores; 1x elsewhere. Includes $200 resort credit annually, complimentary night (up to $250) at anniversary with $25,000 spend, Global Entry/TSA PreCheck credit, Priority Pass Digital membership.',
      '- MGM Rewards Iconic World Elite Mastercard: 6x points + TCs at MGM Resorts destinations; 2x at hotels, dining, gas stations, and grocery stores; 1x elsewhere. Includes $200 resort credit annually, complimentary night (up to $250) at anniversary with $25,000 spend, Global Entry/TSA PreCheck credit, Priority Pass Digital membership.'
    ),
    '- MGM Rewards World Elite Mastercard ($0/year): 3x points + TCs at MGM Resorts destinations; 2x at gas stations and grocery stores; 1x elsewhere. Both cards grant automatic Pearl status and complimentary self-parking.',
    '- MGM Rewards World Elite Mastercard: 3x points + TCs at MGM Resorts destinations; 2x at gas stations and grocery stores; 1x elsewhere. Both cards grant automatic Pearl status and complimentary self-parking.'
  ),
  lounge_access = replace(
    lounge_access,
    'The MGM Rewards Iconic World Elite Mastercard ($249/year, issued by FNBO) includes a Priority Pass Digital membership, granting access to a network of airport lounges worldwide.',
    'The MGM Rewards Iconic World Elite Mastercard (issued by FNBO) includes a Priority Pass Digital membership, granting access to a network of airport lounges worldwide.'
  ),
  updated_at = now()
where slug = 'mgm';
