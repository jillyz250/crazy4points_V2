-- The www.wellsfargo.com/credit-cards/* marketing URLs 404. The live application
-- pages are on creditcards.wellsfargo.com (verified 200, 2026-06-15).
update credit_cards set official_url='https://creditcards.wellsfargo.com/autograph-visa-credit-card/', updated_at=now() where slug='wells-fargo-autograph';
update credit_cards set official_url='https://creditcards.wellsfargo.com/autograph-journey-visa-credit-card/', updated_at=now() where slug='wells-fargo-autograph-journey';
update credit_cards set official_url='https://creditcards.wellsfargo.com/wells-fargo-choice-privileges-credit-cards', updated_at=now() where slug='wells-fargo-choice-privileges';
update credit_cards set official_url='https://creditcards.wellsfargo.com/choice-hotels-privileges-select-mastercard', updated_at=now() where slug='wells-fargo-choice-privileges-select';
