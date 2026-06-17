-- Correct a factual error caught in a confidence re-check: I claimed Amex applies a federal
-- excise tax recovery fee on transfers to Virgin Points. It does NOT -- the Amex excise tax
-- applies only to US airline programs (Delta SkyMiles, JetBlue TrueBlue). Virgin Atlantic is a
-- non-US carrier, so transfers to Virgin Points incur NO fee. Confirmed via TPG + multiple 2026
-- sources. All six bank currencies transfer to Virgin Points 1:1 with no transfer fee.

update programs set
  transfer_partners = replace(
    transfer_partners::text,
    'Amex Membership Rewards transfers to Virgin Points at 1:1. Amex applies a small US federal excise tax recovery fee on the transfer. Virgin runs frequent transfer bonuses -- wait for one if you can.',
    'Amex Membership Rewards transfers to Virgin Points at 1:1 with no transfer fee (Virgin Atlantic is a non-US carrier, so the Amex excise tax -- which applies only to US airlines like Delta and JetBlue -- does not apply here). Virgin runs frequent transfer bonuses -- wait for one if you can.'
  )::jsonb,
  quirks = replace(
    quirks,
    'Amex, Chase, Citi, Capital One, Bilt, and Wells Fargo all transfer in at 1:1 (US Bank also transfers in). Bonuses are common. Amex applies a small US federal excise tax recovery fee; the others transfer with no fee.',
    'Amex, Chase, Citi, Capital One, Bilt, and Wells Fargo all transfer in at 1:1 with no transfer fee (US Bank also transfers in). Bonuses are common. The Amex excise tax applies only to US carriers (Delta, JetBlue), not to Virgin.'
  ),
  updated_at = now()
where slug = 'virgin-red';
