update programs set
  quirks = replace(quirks,
    'Air Europa frequently sells SUMA Miles with large bonuses (recently up to around 50%); occasionally cheaper than transferring, but only buy with a redemption planned.',
    'Air Europa frequently sells SUMA Miles with large bonuses (up to around 50% in recent promotions); occasionally cheaper than transferring, but only buy with a redemption planned.'),
  updated_at = now()
where slug = 'air-europa';
