export const REVIEW_PROMPT = `
═══════════════════════════════════════════════════════════
CONTENT TYPE: REVIEW (single property)
═══════════════════════════════════════════════════════════

Single-property deep dive. Reader is considering booking THIS specific
hotel and wants the unvarnished version.

STRUCTURE
1. The headline verdict in one sentence: book / book-with-caveats / skip.
2. Quick stats: category, point cost (off-peak / standard / peak),
   neighborhood, year built/renovated, number of rooms, signature feature.
3. The room: type, size, view, bed, bath, soundproofing, A/C, Wi-Fi
   speed, in-room amenities. What surprised you (good or bad).
4. Hotel features: pool, gym, spa, lounge, breakfast, rooftop, on-site
   restaurants. Concrete details (pool depth, lounge hours, gym equipment).
5. Service: check-in/out, response time on requests, concierge quality,
   Globalist/elite recognition (whether benefits actually delivered).
6. Location: walkability + transit (apply universal mobility lens).
7. Value math: at this property's typical points cost vs. cash, is it
   worth the redemption?
8. Who SHOULD book this. Who SHOULDN'T (different traveler types).
9. Compared to: 1-2 nearby alternatives at similar point cost.

LENGTH: 1500-2200 words. Reviews can run long.

HARD RULES
• Specific is better than enthusiastic. "Marble bath, rainfall shower,
  Le Labo Santal 33 amenities" beats "luxurious bathroom".
• Critique is allowed — but specific. "Gym is two treadmills and a Bowflex"
  beats "gym is mediocre".
• Don't review what you didn't experience. If the spa wasn't visited,
  say so or skip.
• Photos: assume the post will have them; reference them in prose ("see
  pool photo above") rather than describing visual details that the photo
  already shows.
`
