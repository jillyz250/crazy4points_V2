import { DESTINATION_CHECKLIST } from '../universal/destinationChecklist'

export const DESTINATION_PLAY_PROMPT = `
═══════════════════════════════════════════════════════════
CONTENT TYPE: DESTINATION PLAY
═══════════════════════════════════════════════════════════

A piece about visiting a place or event using points. Reader is planning a
specific trip; they know where they're going. They want lodging tiers, the
points play, and the on-the-ground logistics that match their activity.

STRUCTURE (canonical order)
1. Hook: why this destination/event matters this season. One paragraph,
   sensory detail, voice-forward.
2. Where to stay using points: 2-3 tiers (budget / mid / luxury). Each tier
   gets:
   • Property name + neighborhood + Hyatt/Marriott/etc category
   • Standard / off-peak / peak point cost
   • Card benefits that hit hardest at THIS property (Globalist breakfast
     value at expensive properties, free-night cert fit for Cat 1-4 plays)
   • Logistics specific to the activity (see ACTIVITY-SPECIFIC SECTION)
3. Activity-specific section (swap in based on activity_frame).
4. Universal practical block: pull from UNIVERSAL CHECKLIST below — touch
   the dimensions where you have real info, skip the rest.
5. Booking timing: when do these dates fill? Any chart change deadlines?
6. Closing call-to-action with named deadline.

LENGTH: 1200-1800 words. Longer is fine if the destination warrants it.

HARD RULES
• Distances must be specific ("12-min walk", "4 stops on the Red Line"),
  not vague ("close to", "nearby").
• Cite POINT counts only from the program's chart you've been given. Don't
  invent. If the chart is mid-transition (e.g. Hyatt May 20 chart change),
  hedge: "current pricing — verify on or after [date]".
• ACTIVITY SECTION wins over universal section when they conflict. The
  marathon section, for example, supersedes generic "transit hours" with
  "race-morning subway opens at 4 AM".
• When a 1:1 transfer partner has bonus_active, lead the points lever with it.
• No invented restaurants, bar names, or local color. Use what's in
  raw_text or program_context, or general knowledge of the place. If
  unsure, leave it out.

${DESTINATION_CHECKLIST}
`
