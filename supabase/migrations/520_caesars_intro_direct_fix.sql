-- Direct fix: the intro accumulated garbled text from sequential replace operations.
-- Set intro to the clean final version.

update programs set
  intro = 'Caesars Rewards spans more than 50 casino resorts under the Caesars Entertainment umbrella -- Caesars Palace, Harrah''s, Horseshoe, Flamingo, Paris Las Vegas, Planet Hollywood, and others. The program uses two parallel currencies: Reward Credits, which you redeem for casino play credits, hotel stays, dining, and show tickets; and Tier Credits, which determine your status tier and reset to zero every January 1. Amex MR, Chase UR, Bilt, and other major bank currencies do not currently transfer into the program (verify at caesars.com/myrewards/partners), so your tier lives and dies by how much you play, eat, and stay at Caesars properties.

The hook for points-minded travelers: Diamond status (15,000 Tier Credits) waives resort fees at every Caesars hotel -- meaningful savings in Las Vegas where resort fees run $35-60+ per night. Seven Stars (150,000 Tier Credits) layers on an annual retreat with airfare up to $1,200, four complimentary nights, a $500 dining folio, a complimentary Norwegian Cruise Line voyage, and a complimentary stay at Atlantis Paradise Island in the Bahamas. Extraordinary benefits -- but achieving them requires serious gambling or hotel spend.',
  updated_at = now()
where slug = 'caesars';
