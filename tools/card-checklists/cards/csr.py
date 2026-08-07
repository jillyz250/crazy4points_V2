"""CSR (Chase Sapphire Reserve) card data for the Companion generator.

Pure data only - no imports from the renderer. Icons are referenced by NAME
(strings) which the renderer maps to its drawn icon functions via ICONS.
A new card = a copy of this file with its own verified data.
"""

ANNUAL_FEE = 795  # Chase published
TRAVEL_CREDIT = 300

SETUP = [
    # No link: this is activated inside Chase Offers behind a login, so there
    # is no public page worth sending anyone to.
    dict(label="Activate StubHub credit", sub="$150 twice a year - find it in Chase Offers first, then pay with the card"),
    dict(label="Activate Peloton credit", sub="$10/mo - easy to miss, it is not automatic",
         url="https://www.onepeloton.com/digital/promotions/chase"),
    dict(label="Activate DashPass", sub="$25/mo in DoorDash promos - you must activate BEFORE you order"),
    dict(label="Activate dining credit", sub="$150 twice a year - only at Sapphire Exclusive Tables restaurants",
         url="https://www.opentable.com/sapphire-reserve-exclusive-tables"),
    # Chase: "Subscriptions run through 6/22/2027" — it's the coverage window,
    # not an activation deadline (the old copy said "activate by", which is wrong).
    dict(label="Claim Apple TV+ & Apple Music", sub="$288/yr of subscriptions, included through 6/22/2027"),
    # shared field name — auto-syncs the "activated" tag in Perks (page 3)
    # The GO goes to IHG enrollment, so say so — the linking itself happens at
    # chase.com behind a login, which is no use as a destination.
    dict(label="Link IHG account -> Platinum status", sub="Platinum Elite - you have to link the two accounts first",
         url="https://www.ihg.com/rewardsclub/us/en/enrollment/join", field="act_ihg"),
    dict(label="Add card to your Lyft account", sub="$10/mo - add the card in the Lyft app or the credit never posts"),
    dict(label="Apply Global Entry / TSA / NEXUS", sub="$120 back once every 4 years - pay the fee with this card",
         url="https://ttp.dhs.gov"),
]

GRID = [
    dict(amt="$10",      sub="per month",           name="Peloton",           note="activation required",       icon="peloton",  url="https://www.onepeloton.com/digital/promotions/chase"),
    dict(amt="$150",     sub="twice a year",         name="StubHub + viagogo", note="one activation covers both", icon="ticket"),
    dict(amt="$25",      sub="monthly promos",       name="DoorDash",          note="DashPass + set as payment",  icon="bag"),
    dict(amt="Platinum", sub="Elite status",         name="IHG One Rewards",   note="link accounts, 3 weeks",     icon="crown",    url="https://www.ihg.com/rewardsclub/us/en/enrollment/join", field="act_ihg"),
    dict(amt="Elite",    sub="National, Avis, Hertz", name="Car Rental",       note="enroll for upgrades",        icon="key"),
    dict(amt="$10",      sub="per month",           name="Lyft",              note="add the card in the app",    icon="phone"),
    dict(amt="$120",     sub="application fee",       name="Global Entry",      note="pay the fee with the card",  icon="passport", url="https://ttp.dhs.gov"),
    dict(amt="Free",     sub="through 6/22/2027",     name="Apple TV",          note="activate to start it",       icon="tv"),
    dict(amt="Free",     sub="through 6/22/2027",     name="Apple Music",       note="separate activation",        icon="music"),
]

SEMI = [
    ("The Edit", "prepaid hotel, 2-night min - book via Chase Travel", "$250"),
    ("Dining - Sapphire Exclusive Tables", "book through OpenTable", "$150"),
    ("StubHub + viagogo", "concert & event tickets", "$150"),
]

MONTHLY = [
    ("Lyft ride credit", "$10/mo  -  in-app  -  through 9/30/2027", 10),
    ("DoorDash restaurant", "$5/mo  -  promo", 5),
    ("DoorDash grocery/retail #1", "$10/mo  -  promo", 10),
    ("DoorDash grocery/retail #2", "$10/mo  -  promo", 10),
    ("Peloton membership", "$10/mo  -  bill direct at onepeloton.com, NOT the App Store", 10),
]

ANNUAL = [
    ("$300 Annual Travel Credit", "auto-applies to travel purchases", "page4"),
    ("$250 Chase Travel Hotels", "IHG, Montage, Omni, Pendry... thru 12/31/26"),
    ("$120 Global Entry / TSA / NEXUS", "once every 4 years"),
]

SPEND = [
    ("World of Hyatt",    "Explorist status",   "link your World of Hyatt account"),
    ("IHG One Rewards",   "Diamond Elite",      "auto if IHG already linked"),
    ("The Shops at Chase", "$250 credit",        "applied automatically"),
    ("Southwest",         "$500 travel credit", "prepaid Southwest via Chase Travel"),
    ("Southwest",         "A-List status",      "link account, allow 10-15 days"),
]

PERKS = [
    ("Chase Sapphire Lounges (+2 guests)", None),
    # Chase: membership is "automatically activated" — no enrollment needed.
    ("Priority Pass Select", None),
    ("Air Canada Maple Leaf Lounges & Cafes", None),
    ("Points Boost - up to 2x via Chase Travel", None),
    ("1:1 transfer to airline & hotel partners", None),
    ("No foreign transaction fees", None),
    ("Exclusive access to card member experiences", None),
    ("Reserve Travel Designers - service worth up to $300", None),
]

EARN = [("8x","Chase Travel"),("5x","Lyft"),("4x","flights direct"),
        ("4x","hotels direct"),("3x","dining"),("10x","Peloton"),("1x","all else")]

PROTECT = [
    "Primary rental car (CDW) to $75k","Trip cancel/interruption to $10k",
    "Trip delay to $500 (6+ hrs)","Lost luggage to $3,000",
    "Baggage delay $100/day x5","Travel accident to $1M",
    "Emergency evacuation to $100k","Emergency medical/dental $2,500",
    "Roadside assistance $50 x4/yr","Purchase protection $10k/item",
    "Return protection $500/item","Extended warranty +1 year",
]

RESETS = [
    ("1st of the month", "Lyft $10  -  DoorDash $25  -  Peloton $10"),
    ("Jan 1 & Jul 1", "Dining $150  -  Tickets $150"),
    ("Your anniversary", "$300 travel credit resets"),
    ("Jan 1", "$75K spend counter resets"),
]

ENDS = [
    ("Sep 30, 2026", "Register Marriott Gold (if invited)"),
    ("Dec 31, 2026", "$250 Chase Travel hotel credit"),
    ("Jun 22, 2027", "Apple TV+ & Apple Music"),
    ("Sep 30, 2027", "Lyft 5x points + $10/mo credit"),
    ("Dec 31, 2027", "StubHub, Peloton, DashPass, IHG"),
    ("Every 4 yrs", "Global Entry / TSA / NEXUS"),
]

LOUNGES = [
    ("Chase Sapphire Lounges by The Club", "you + 2 guests", "https://account.chase.com/sapphire-airport-lounge"),
    ("Priority Pass Select lounges", "1,300+ worldwide, you + 2 guests", "https://www.prioritypass.com/select"),
    ("Air Canada Maple Leaf Lounges", "Star Alliance flights, +1 guest free", "https://www.aircanada.com/lounges"),
]

CAP_LINES = [
    ("cap_monthly", "Monthly credits",     540),
    ("cap_edit",    "The Edit hotel",      500),
    ("cap_dining",  "Dining",              300),
    ("cap_tickets", "StubHub + viagogo",   300),
    ("cap_travel",  "Travel credit",       300),
    ("cap_hotels",  "Chase Travel hotels", 250),
]

BREAKEVEN = [
    ("Monthly credits", 540, "monthly"),
    ("The Edit hotel", 500, "annual"),
    ("Dining", 300, "dining"),
    ("Tickets", 300, "protect"),
    ("Travel credit", 300, "perks"),
    ("Chase Travel hotels", 250, "spend"),
]


# Card identity + copy strings the renderer reads (via CARD[...]).
CARD = {
    "out_name":      "csr-2026-checklist.pdf",
    "doc_title":     "The Sapphire Reserve Companion - 2026 Edition",
    "eyebrow":       "2026 EDITION",
    "title":         "The Sapphire Reserve Companion",
    "mini_title":    "Sapphire Reserve Companion",
    "tagline1":      "Don't let Chase keep your money. There's $2,190 in credits in here, and most",
    "tagline2":      "cardholders leave hundreds of it on the table every single year.",
    "header_button": "SIGN UP FOR THE INSIDER LIST",
    "tracker_total": "of $2,190",
    "cta_headline":  "Don't leave money on the table",
    "cta_sub1":      "There's over $2,000 in credits here. Most people never claim it all.",
    "cta_sub2":      "The Insider List helps you catch every one.",
}
